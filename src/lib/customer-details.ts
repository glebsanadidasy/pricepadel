/**
 * Customer details the card gateway requires: first name, surname, e-mail and a phone number with its country code.
 * Pure helpers (no server imports), used by the address form, checkout and the gateway request.
 */
export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

/** "+44 7700 900-123" → "+447700900123". Must start with + (country code) and have 8–15 digits. */
export function normalizePhone(phone: string) {
  const p = phone.trim().replace(/[\s().-]/g, "").replace(/^00/, "+");
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

export const DETAILS_HELP = "Please give your first name and surname, and a phone number with the country code (for example +44 7700 900123).";

export function paymentDetailsProblem(a: { full_name: string; phone: string }) {
  return splitName(a.full_name) && normalizePhone(a.phone) ? null : DETAILS_HELP;
}
