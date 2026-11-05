"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BUSINESS } from "@/config/site";
import { isCountry } from "@/config/countries";
import {
  attemptKey, currentUser, hashPassword, randomToken, recordAttempt, requireUser, sha256, signInCustomer, signOutCustomer, siteUrl, tooManyAttempts, verifyPassword,
} from "@/lib/auth";
import { getProductById } from "@/lib/catalog";
import { db, now } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** Only same-site paths are allowed as a place to return to after sign-in. */
function safeNext(v: string) {
  return v.startsWith("/") && !v.startsWith("//") ? v : "/account";
}

async function sendVerification(userId: number, email: string) {
  const token = randomToken();
  db()
    .prepare("INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, 'verify', ?)")
    .run(sha256(token), userId, new Date(Date.now() + 48 * 3600 * 1000).toISOString());
  const link = `${await siteUrl()}/account/verify?token=${token}`;
  sendMail({
    to: email,
    subject: "Confirm your e-mail for Price Padel",
    text: `Welcome to Price Padel.\n\nPlease confirm your e-mail address to be able to place orders:\n${link}\n\nThe link is valid for 48 hours. If you did not create an account, ignore this message.\n\n${BUSINESS.email}`,
  });
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const name = str(form, "name", 100);
  if (!EMAIL.test(email)) return { error: "Please enter a valid e-mail address.", email };
  if (password.length < 10 || password.length > 200) return { error: "Choose a password of at least 10 characters.", email };
  const key = await attemptKey("register");
  if (tooManyAttempts(key, 20, 3600 * 1000)) return { error: "Too many attempts. Please try again later.", email };
  recordAttempt(key);
  if (db().prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return { error: "An account with this e-mail already exists. Please sign in.", email };
  const r = db().prepare("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)").run(email, hashPassword(password), name, now());
  const id = Number(r.lastInsertRowid);
  await sendVerification(id, email);
  await signInCustomer(id);
  redirect(`/account?welcome=1`);
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const key = await attemptKey("login", email);
  if (tooManyAttempts(key, 8, 15 * 60 * 1000)) return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
  const user = db().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as { id: number; password_hash: string } | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordAttempt(key);
    return { error: "Wrong e-mail or password.", email };
  }
  await signInCustomer(user.id);
  redirect(safeNext(str(form, "next", 300)));
}

export async function logout() {
  await signOutCustomer();
  redirect("/");
}

export async function resendVerification(): Promise<void> {
  const u = await requireUser("/account");
  if (u.email_verified_at) return;
  const key = await attemptKey("verify-mail", String(u.id));
  if (tooManyAttempts(key, 5, 3600 * 1000)) redirect("/account?mail=limit");
  recordAttempt(key);
  await sendVerification(u.id, u.email);
  redirect("/account?mail=sent");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("/account");
  db().prepare("UPDATE users SET name = ? WHERE id = ?").run(str(form, "name", 100), u.id);
  revalidatePath("/account");
  return { ok: "Saved." };
}

export async function addAddress(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser("/account/addresses");
  const a = {
    full_name: str(form, "full_name", 100),
    line1: str(form, "line1", 150),
    line2: str(form, "line2", 150),
    city: str(form, "city", 80),
    postcode: str(form, "postcode", 20),
    country: str(form, "country", 2),
    phone: str(form, "phone", 30),
  };
  if (!a.full_name || !a.line1 || !a.city || !a.postcode) return { error: "Please fill in name, address, city and postcode." };
  if (!isCountry(a.country)) return { error: "We deliver to the UK and Europe only — please choose a country from the list." };
  const count = (db().prepare("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?").get(u.id) as { n: number }).n;
  if (count >= 10) return { error: "You can keep up to 10 addresses." };
  db()
    .prepare("INSERT INTO addresses (user_id, full_name, line1, line2, city, postcode, country, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(u.id, a.full_name, a.line1, a.line2, a.city, a.postcode, a.country, a.phone, now());
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  const back = str(form, "back", 100);
  if (back === "/checkout") redirect("/checkout");
  return { ok: "Address saved." };
}

export async function deleteAddress(id: number) {
  const u = await requireUser("/account/addresses");
  db().prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(id, u.id);
  revalidatePath("/account/addresses");
}

/** Adds or removes a product; guests are sent to sign in first. */
export async function toggleWishlist(productId: string, returnTo: string) {
  const u = await currentUser();
  if (!u) redirect(`/account/login?next=${encodeURIComponent(safeNext(returnTo))}`);
  const has = db().prepare("SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?").get(u.id, productId);
  if (has) db().prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(u.id, productId);
  else if (getProductById(productId)) db().prepare("INSERT INTO wishlist (user_id, product_id, created_at) VALUES (?, ?, ?)").run(u.id, productId, now());
  revalidatePath("/", "layout");
}

export async function requestDeletion(form: FormData) {
  const u = await requireUser("/account/delete");
  if (form.get("confirm") !== "yes" || u.deletion_requested_at) redirect("/account/delete");
  db().prepare("UPDATE users SET deletion_requested_at = ? WHERE id = ?").run(now(), u.id);
  sendMail({
    to: BUSINESS.email,
    subject: `Account deletion request: ${u.email}`,
    text: `Customer ${u.email} (account #${u.id}) asked to delete their account on ${now()}.\nPlease process the request (keep order records only as long as the law requires).`,
  });
  sendMail({
    to: u.email,
    subject: "We received your account deletion request",
    text: `We have received your request to delete your Price Padel account. We will process it and confirm by e-mail.\n\n${BUSINESS.email}`,
  });
  redirect("/account/delete?sent=1");
}
