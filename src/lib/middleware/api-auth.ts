/**
 * API Authentication Middleware
 * Validates API keys for programmatic access
 */

import { NextRequest } from "next/server";
import { ApiKeyService } from "@/lib/services/apikey.service";
import { Errors } from "@/lib/errors";
import { enforceRateLimit, RateLimitResult } from "./rate-limit";

export interface ApiAuthContext {
  apiKey: {
    id: string;
    companyId: string;
    scopes: string[];
    environment: "test" | "live";
    rateLimit: number;
  };
  rateLimit: RateLimitResult;
}

/**
 * Require API key authentication
 * Extracts API key from Authorization header and validates it
 * Also enforces rate limiting
 */
export async function requireApiKey(request: NextRequest): Promise<ApiAuthContext> {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    throw Errors.unauthorized("Missing Authorization header");
  }

  // Expected format: "Bearer gck_live_xxxxx" or "Bearer gck_test_xxxxx"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw Errors.unauthorized("Invalid Authorization header format. Expected: Bearer <api_key>");
  }

  const apiKey = parts[1];

  // Validate API key format
  if (!apiKey.startsWith("gck_")) {
    throw Errors.unauthorized("Invalid API key format");
  }

  // Validate and get API key record
  const apiKeyRecord = await ApiKeyService.validateApiKey(apiKey);

  // Enforce rate limiting
  const rateLimitResult = enforceRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimit);

  return {
    apiKey: {
      id: apiKeyRecord.id,
      companyId: apiKeyRecord.companyId,
      scopes: apiKeyRecord.scopes,
      environment: apiKeyRecord.environment,
      rateLimit: apiKeyRecord.rateLimit,
    },
    rateLimit: rateLimitResult,
  };
}

/**
 * Require specific scope for an API endpoint
 */
export function requireScope(apiKey: { scopes: string[] }, requiredScope: string) {
  if (!ApiKeyService.hasRequiredScope(apiKey, requiredScope)) {
    throw Errors.forbidden(
      `This API key does not have the required scope: ${requiredScope}`
    );
  }
}

/**
 * Extract company ID from request params
 * Validates that the API key belongs to the requested company
 */
export function validateCompanyAccess(
  apiKey: { companyId: string },
  requestedCompanyId: string
) {
  if (apiKey.companyId !== requestedCompanyId) {
    throw Errors.forbidden("API key does not have access to this company");
  }
}
