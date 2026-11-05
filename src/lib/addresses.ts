import "server-only";
import { db } from "./db";
import type { Address } from "./orders";

/** The customer's own saved addresses (always filtered by user id). */
export function userAddresses(userId: number) {
  return db().prepare("SELECT id, full_name, line1, line2, city, postcode, country, phone FROM addresses WHERE user_id = ? ORDER BY id").all(userId) as (Address & { id: number })[];
}

export function userAddress(userId: number, id: number) {
  return userAddresses(userId).find((a) => a.id === id);
}
