/**
 * Rate Limiting Middleware
 * Tracks and enforces API request rate limits per API key
 *
 * Uses sliding window algorithm with in-memory storage
 * For production, use Redis for distributed rate limiting
 */

import { NextRequest } from "next/server";
import { Errors } from "@/lib/errors";

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

// In-memory store for rate limit tracking
// In production, use Redis with TTL for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within the rate limit
 * Uses sliding window per minute
 */
export function checkRateLimit(
  apiKeyId: string,
  limit: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - 60 * 1000; // 1 minute window
  const resetAt = now + 60 * 1000;

  // Get or initialize rate limit entry
  let entry = rateLimitStore.get(apiKeyId);

  // Reset if window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt,
    };
    rateLimitStore.set(apiKeyId, entry);
  }

  // Check if within limit
  const allowed = entry.count < limit;

  if (allowed) {
    // Increment count
    entry.count += 1;
    rateLimitStore.set(apiKeyId, entry);
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware to enforce rate limiting for API requests
 * Should be called after API key authentication
 */
export function enforceRateLimit(
  apiKeyId: string,
  rateLimit: number
): RateLimitResult {
  const result = checkRateLimit(apiKeyId, rateLimit);

  if (!result.allowed) {
    throw Errors.tooManyRequests(
      `Rate limit exceeded. Limit: ${result.limit} requests per minute. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`
    );
  }

  return result;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };
}

/**
 * Reset rate limit for an API key (useful for testing)
 */
export function resetRateLimit(apiKeyId: string): void {
  rateLimitStore.delete(apiKeyId);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  apiKeyId: string,
  limit: number
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(apiKeyId);

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: now + 60 * 1000,
    };
  }

  return {
    allowed: entry.count < limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
