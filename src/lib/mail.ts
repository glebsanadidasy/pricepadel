import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

/**
 * Outgoing e-mail.
 * - SMTP (the contact@pricepadel.com mailbox) when SMTP_HOST, SMTP_USER and SMTP_PASS are set in .env.
 * - Otherwise — and whenever sending fails — the message is saved to outbox/ (git-ignored): a .json and a readable .txt.
 * Callers never wait for the mail server: sending happens in the background.
 */
const OUTBOX = path.resolve(process.env.OUTBOX_DIR || path.join(process.cwd(), "outbox"));

export type Mail = { to: string; subject: string; text: string };

const FROM = () => process.env.MAIL_FROM || "Price Padel <contact@pricepadel.com>";

function saveToOutbox(mail: Mail, error?: string) {
  fs.mkdirSync(OUTBOX, { recursive: true });
  const at = new Date().toISOString();
  const name = `${at.replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;
  const record = { at, from: FROM(), ...mail, ...(error ? { sendError: error } : {}) };
  fs.writeFileSync(path.join(OUTBOX, `${name}.json`), JSON.stringify(record, null, 2));
  fs.writeFileSync(path.join(OUTBOX, `${name}.txt`), `From: ${record.from}\nTo: ${mail.to}\nDate: ${at}\nSubject: ${mail.subject}\n${error ? `X-Send-Error: ${error}\n` : ""}\n${mail.text}\n`);
}

const g = globalThis as unknown as { __ppMailer?: nodemailer.Transporter };
function transporter() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  g.__ppMailer ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return g.__ppMailer;
}

export function mailMode() {
  return transporter() ? "smtp" : "outbox";
}

export function sendMail(mail: Mail) {
  const t = transporter();
  if (!t) return saveToOutbox(mail);
  t.sendMail({ from: FROM(), to: mail.to, subject: mail.subject, text: mail.text }).catch((e: Error) => saveToOutbox(mail, e.message));
}
