import "server-only";
import { notFound } from "next/navigation";

/**
 * The admin panel has no login yet (it comes with customer accounts), so for now it exists only in the
 * local preview (`next dev`). A production build answers 404 for every admin page and refuses every admin action.
 */
export const ADMIN_ENABLED = process.env.NODE_ENV !== "production";

export function requireAdmin() {
  if (!ADMIN_ENABLED) notFound();
}

export function assertAdmin() {
  if (!ADMIN_ENABLED) throw new Error("Admin is not available");
}
