/**
 * Public API: GET /api/public/v1/orders
 * Fetch orders using API key authentication
 * Example of authenticated + rate-limited API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, requireScope, validateCompanyAccess } from "@/lib/middleware/api-auth";
import { getRateLimitHeaders } from "@/lib/middleware/rate-limit";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  companyId: z.string(),
  status: z.enum(["pending", "paid", "fulfilled", "failed", "refunded"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/public/v1/orders
 * List orders for a company using API key authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate with API key and enforce rate limiting
    const authContext = await requireApiKey(request);

    // Require orders:read scope
    requireScope(authContext.apiKey, "orders:read");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      companyId: searchParams.get("companyId"),
      status: searchParams.get("status"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    // Validate company access
    validateCompanyAccess(authContext.apiKey, query.companyId);

    // Fetch orders (using a service account user ID for API access)
    const orders = await OrderService.getByCompany(
      query.companyId,
      "api-key-access", // Special user ID for API key access
      {
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      }
    );

    // Return with rate limit headers
    return NextResponse.json(
      {
        data: orders,
        meta: {
          limit: query.limit,
          offset: query.offset,
        },
      },
      {
        status: 200,
        headers: {
          "X-API-Version": "v1",
          ...getRateLimitHeaders(authContext.rateLimit),
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
