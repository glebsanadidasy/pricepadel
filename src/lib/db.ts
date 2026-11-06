import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Customer data: accounts, sessions, addresses, wishlists, orders, payments.
 * One SQLite file (Node's built-in driver) in .data/ — git-ignored, never committed. STORE_DB points tests elsewhere.
 */
const FILE = path.resolve(process.env.STORE_DB || path.join(process.cwd(), ".data", "store.db"));

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email_verified_at TEXT,
  deletion_requested_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  kind TEXT NOT NULL,              -- 'customer' | 'admin'
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts(key, at);
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  rate REAL NOT NULL,
  subtotal_gbp INTEGER NOT NULL,
  delivery_gbp INTEGER NOT NULL,
  total_gbp INTEGER NOT NULL,
  total_charged INTEGER NOT NULL,  -- minor units of currency
  items_json TEXT NOT NULL,
  address_json TEXT NOT NULL,
  email TEXT NOT NULL,
  terms_accepted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  at TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount INTEGER NOT NULL,         -- minor units
  currency TEXT NOT NULL,
  status TEXT NOT NULL,            -- created | succeeded | declined | cancelled
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS data_complaints (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  order_number TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',   -- open | answered
  answered_at TEXT
);
CREATE TABLE IF NOT EXISTS payment_notifications (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL,
  payment_id TEXT,
  accepted INTEGER NOT NULL,
  reason TEXT NOT NULL
);
`;

const g = globalThis as unknown as { __ppDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__ppDb) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const d = new DatabaseSync(FILE);
    d.exec(SCHEMA);
    // Columns added after the first release (SQLite has no "ADD COLUMN IF NOT EXISTS").
    for (const sql of ["ALTER TABLE orders ADD COLUMN tracking_number TEXT", "ALTER TABLE users ADD COLUMN last_active_at TEXT"]) {
      try {
        d.exec(sql);
      } catch {
        /* already there */
      }
    }
    g.__ppDb = d;
  }
  return g.__ppDb;
}

export const now = () => new Date().toISOString();

/** Runs fn inside a transaction (all or nothing). */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
