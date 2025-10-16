/**
 * GET /api/v1/companies/:companyId/listings/:listingId/codes/by-denomination/:denomination
 * Get all codes for a specific denomination
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings/:listingId/codes/by-denomination/:denomination
 * Get all codes for a specific denomination with search and pagination
 * Query params: search, page, limit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string; denomination: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId: listingIdParam, denomination } = await params;

    // First get the listing to retrieve its UUID id field
    const listing = await ListingService.getById(companyId, listingIdParam);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await ListingService.getCodesByDenomination(
      companyId,
      listing.id,
      parseFloat(denomination),
      userId,
      { search, page, limit }
    );

    return NextResponse.json(
      {
        data: result.data,
        pagination: result.pagination,
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
