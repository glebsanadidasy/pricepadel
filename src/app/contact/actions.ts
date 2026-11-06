"use server";

import { BUSINESS } from "@/config/site";
import { attemptKey, recordAttempt, tooManyAttempts } from "@/lib/auth";
import { db, now } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export type ComplaintState = { ok?: string; error?: string } | undefined;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/**
 * Data protection complaint (DPA 2018 s164A): no account needed. Spam protection: a hidden honeypot field,
 * a minimum time on the page, length limits and at most 3 complaints per hour from one address.
 */
export async function submitDataComplaint(_: ComplaintState, form: FormData): Promise<ComplaintState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const order = String(form.get("order") ?? "").trim().slice(0, 20);
  const message = String(form.get("message") ?? "").trim();
  const started = Number(form.get("started"));
  const ok = "Thank you. We have received your complaint and will confirm it by e-mail within 2 working days. You will get a full answer within 14 days.";
  // Bots fill the hidden field or submit instantly: answer as if accepted, store nothing.
  if (String(form.get("website") ?? "") !== "" || !Number.isFinite(started) || Date.now() - started < 3000) return { ok };
  if (!name || !EMAIL.test(email)) return { error: "Please give your name and a valid e-mail address." };
  if (message.length < 10 || message.length > 5000) return { error: "Please describe your complaint (10 to 5,000 characters)." };
  const key = await attemptKey("data-complaint");
  if (tooManyAttempts(key, 3, 3600 * 1000)) return { error: "Too many complaints sent from here. Please e-mail us instead." };
  recordAttempt(key);

  const r = db().prepare("INSERT INTO data_complaints (at, name, email, order_number, message) VALUES (?, ?, ?, ?, ?)").run(now(), name, email, order, message);
  const ref = `DC${1000 + Number(r.lastInsertRowid)}`;
  sendMail({
    to: BUSINESS.email,
    subject: `Data protection complaint ${ref}`,
    text: `New data protection complaint ${ref} (${now()}).\nAcknowledge within 2 working days, full answer within 14 days.\n\nName: ${name}\nE-mail: ${email}\nOrder: ${order || "—"}\n\n${message}`,
  });
  sendMail({
    to: email,
    subject: `We received your data protection complaint ${ref}`,
    text: `Dear ${name},\n\nWe have received your data protection complaint (reference ${ref}). We will look into it and give you a full answer within 14 days.\n\nYou also have the right to complain to the Information Commissioner’s Office: https://ico.org.uk/make-a-complaint/\n\n${BUSINESS.tradingAs}\n${BUSINESS.email}`,
  });
  return { ok };
}
