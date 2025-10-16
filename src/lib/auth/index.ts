/**
 * Auth utilities and helpers
 */

export { auth, signIn, signOut } from "./config";

import { auth } from "./config";
import { Errors } from "@/lib/errors";

/**
 * Get current session or throw if not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    throw Errors.notAuthenticated();
  }

  return session;
}

/**
 * Get current user ID or throw if not authenticated
 */
export async function requireUserId() {
  const session = await requireAuth();
  return session.user.id;
}

/**
 * Get optional session (returns null if not authenticated)
 */
export async function getSession() {
  return await auth();
}

/**
 * Get optional user ID (returns null if not authenticated)
 */
export async function getUserId() {
  const session = await auth();
  return session?.user?.id || null;
}
