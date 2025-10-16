/**
 * GET /api/v1/companies/:companyId/listings/:listingId/inventory/summary
 * Get simplified inventory summary for a listing
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings/:listingId/inventory/summary
 * Get inventory summary for a listing (simplified for UI display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId } = await params;

    const result = await ListingService.getInventorySummary(companyId, listingId, userId);

    return NextResponse.json(
      {
        data: result,
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
