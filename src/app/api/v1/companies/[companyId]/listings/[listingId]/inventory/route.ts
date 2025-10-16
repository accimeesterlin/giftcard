/**
 * GET/POST /api/v1/companies/:companyId/listings/:listingId/inventory
 * Get inventory summary or bulk upload gift card codes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { bulkUploadCodesSchema } from "@/lib/validation/schemas";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings/:listingId/inventory
 * Get inventory summary for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId: listingIdParam } = await params;

    // First get the listing to retrieve its UUID id field
    const listing = await ListingService.getById(companyId, listingIdParam);

    const result = await ListingService.getInventory(companyId, listing.id, userId);

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

/**
 * POST /api/v1/companies/:companyId/listings/:listingId/inventory
 * Bulk upload gift card codes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId: listingIdParam } = await params;

    // First get the listing to retrieve its UUID id field
    const listing = await ListingService.getById(companyId, listingIdParam);

    // Parse and validate request body
    const body = await request.json();
    const input = bulkUploadCodesSchema.parse({
      ...body,
      listingId: listing.id, // Use listing's UUID id, not the URL param
    });

    const result = await ListingService.addInventory(companyId, userId, input);

    return NextResponse.json(
      {
        data: result,
        meta: {
          message: `Successfully uploaded ${result.uploaded} gift card codes`,
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
