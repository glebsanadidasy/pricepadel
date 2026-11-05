import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Outgoing e-mail. No mail service is connected yet, so every message is saved to outbox/ (git-ignored):
 * one .json (for tests and tools) and one .txt (to read). Connecting a mail service later replaces only this function.
 */
const OUTBOX = path.resolve(process.env.OUTBOX_DIR || path.join(process.cwd(), "outbox"));

export type Mail = { to: string; subject: string; text: string };

export function sendMail(mail: Mail) {
  fs.mkdirSync(OUTBOX, { recursive: true });
  const at = new Date().toISOString();
  const name = `${at.replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;
  const record = { at, from: "Price Padel <contact@pricepadel.com>", ...mail };
  fs.writeFileSync(path.join(OUTBOX, `${name}.json`), JSON.stringify(record, null, 2));
  fs.writeFileSync(path.join(OUTBOX, `${name}.txt`), `From: ${record.from}\nTo: ${mail.to}\nDate: ${at}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
}
