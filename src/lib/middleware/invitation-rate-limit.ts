/**
 * Rate Limiting Middleware for Team Invitations
 * Prevents abuse of invitation endpoints
 */

import { Errors } from "@/lib/errors";

interface InvitationRateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

// In-memory store - use Redis in production
const invitationRateLimitStore = new Map<string, InvitationRateLimitEntry>();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of invitationRateLimitStore.entries()) {
    if (entry.resetAt < now) {
      invitationRateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check invitation rate limit
 * Limit: 10 invitations per company per hour
 */
export function checkInvitationRateLimit(companyId: string, userId: string): void {
  const key = `${companyId}:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxInvitations = 10;

  let entry = invitationRateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    invitationRateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= maxInvitations) {
    const remainingTime = Math.ceil((entry.resetAt - now) / 1000 / 60);
    throw Errors.tooManyRequests(
      `Too many invitation requests. You can send ${maxInvitations} invitations per hour. Try again in ${remainingTime} minutes.`,
      { limit: maxInvitations, resetAt: entry.resetAt }
    );
  }

  // Increment count
  entry.count += 1;
  invitationRateLimitStore.set(key, entry);
}

/**
 * Check resend rate limit
 * Limit: 3 resends per membership per hour
 */
export function checkResendRateLimit(membershipId: string): void {
  const key = `resend:${membershipId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxResends = 3;

  let entry = invitationRateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    invitationRateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= maxResends) {
    const remainingTime = Math.ceil((entry.resetAt - now) / 1000 / 60);
    throw Errors.tooManyRequests(
      `Too many resend requests. You can resend an invitation ${maxResends} times per hour. Try again in ${remainingTime} minutes.`,
      { limit: maxResends, resetAt: entry.resetAt }
    );
  }

  // Increment count
  entry.count += 1;
  invitationRateLimitStore.set(key, entry);
}
