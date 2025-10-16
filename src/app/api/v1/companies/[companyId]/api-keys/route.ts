/**
 * GET/POST /api/v1/companies/:companyId/api-keys
 * List and create API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { ApiKeyService } from "@/lib/services/apikey.service";
import { toAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).min(1),
  environment: z.enum(["test", "live"]),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().int().positive().optional(),
});

/**
 * GET /api/v1/companies/:companyId/api-keys
 * List API keys for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    const apiKeys = await ApiKeyService.listApiKeys(companyId, userId);

    return NextResponse.json(
      {
        data: apiKeys,
      },
      {
        status: 200,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    const appError = toAppError(error);

    return NextResponse.json(
      {
        error: appError.toJSON(),
      },
      {
        status: appError.statusCode,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  }
}

/**
 * POST /api/v1/companies/:companyId/api-keys
 * Create a new API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = createApiKeySchema.parse(body);

    const result = await ApiKeyService.createApiKey({
      companyId,
      userId,
      name: input.name,
      description: input.description,
      scopes: input.scopes,
      environment: input.environment,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      rateLimit: input.rateLimit,
    });

    return NextResponse.json(
      {
        data: {
          apiKey: result.apiKey, // Plain text key - only shown once
          record: result.apiKeyRecord,
        },
        meta: {
          message:
            "API key created successfully. Please save this key securely - it will not be shown again.",
        },
      },
      {
        status: 201,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    const appError = toAppError(error);

    return NextResponse.json(
      {
        error: appError.toJSON(),
      },
      {
        status: appError.statusCode,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  }
}
