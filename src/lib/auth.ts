import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, now } from "./db";

/**
 * Customer accounts and the admin login.
 * Passwords: scrypt with a per-user salt. Sessions: random token in an httpOnly cookie, only its SHA-256 is stored.
 * The admin password lives only in .env (ADMIN_PASSWORD).
 */
const CUSTOMER_COOKIE = "pp_session";
const ADMIN_COOKIE = "pp_admin";
const CUSTOMER_DAYS = 30;
const ADMIN_HOURS = 12;

export type User = { id: number; email: string; name: string; email_verified_at: string | null; deletion_requested_at: string | null; created_at: string };

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const randomToken = () => crypto.randomBytes(32).toString("base64url");

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "base64"), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(actual, expected);
}

/** Base URL of the site as the visitor reached it (for links in e-mails). */
export async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

// ---------- rate limiting ----------

/** True when `key` had `max` or more attempts in the last `windowMs`. */
export function tooManyAttempts(key: string, max: number, windowMs: number) {
  const since = Date.now() - windowMs;
  const row = db().prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND at > ?").get(key, since) as { n: number };
  return row.n >= max;
}

export function recordAttempt(key: string) {
  db().prepare("INSERT INTO login_attempts (key, at) VALUES (?, ?)").run(key, Date.now());
  db().prepare("DELETE FROM login_attempts WHERE at < ?").run(Date.now() - 24 * 3600 * 1000);
}

async function clientKey() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export async function attemptKey(scope: string, extra = "") {
  return `${scope}:${await clientKey()}:${extra.toLowerCase()}`;
}

// ---------- sessions ----------

async function startSession(kind: "customer" | "admin", userId: number | null) {
  const token = randomToken();
  const ms = kind === "admin" ? ADMIN_HOURS * 3600 * 1000 : CUSTOMER_DAYS * 24 * 3600 * 1000;
  db()
    .prepare("INSERT INTO sessions (token_hash, kind, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .run(sha256(token), kind, userId, now(), new Date(Date.now() + ms).toISOString());
  (await cookies()).set(kind === "admin" ? ADMIN_COOKIE : CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ms / 1000,
  });
}

async function sessionRow(kind: "customer" | "admin") {
  const token = (await cookies()).get(kind === "admin" ? ADMIN_COOKIE : CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const row = db().prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND kind = ?").get(sha256(token), kind) as
    | { user_id: number | null; expires_at: string }
    | undefined;
  if (!row || row.expires_at < now()) return null;
  return row;
}

async function endSession(kind: "customer" | "admin") {
  const jar = await cookies();
  const name = kind === "admin" ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  const token = jar.get(name)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(name);
}

// ---------- customers ----------

export async function signInCustomer(userId: number) {
  await startSession("customer", userId);
}

export async function signOutCustomer() {
  await endSession("customer");
}

export async function currentUser(): Promise<User | null> {
  const s = await sessionRow("customer");
  if (!s?.user_id) return null;
  return (
    (db().prepare("SELECT id, email, name, email_verified_at, deletion_requested_at, created_at FROM users WHERE id = ?").get(s.user_id) as User | undefined) ?? null
  );
}

/** The signed-in customer, or a redirect to the sign-in page that comes back to `next`. */
export async function requireUser(next: string): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return u;
}

// ---------- admin ----------

/** Compares with ADMIN_PASSWORD from .env in constant time. No password configured = no admin login. */
export function adminPasswordMatches(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) return false;
  return crypto.timingSafeEqual(Buffer.from(sha256(password), "hex"), Buffer.from(sha256(expected), "hex"));
}

export async function signInAdmin() {
  await startSession("admin", null);
}

export async function signOutAdmin() {
  await endSession("admin");
}

export async function isAdmin() {
  return (await sessionRow("admin")) !== null;
}

/** Admin pages: redirect to the admin login unless signed in. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Admin actions: refuse unless signed in. */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in as admin");
}
