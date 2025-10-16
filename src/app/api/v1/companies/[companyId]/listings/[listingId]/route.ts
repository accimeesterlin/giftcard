/**
 * GET/PATCH/DELETE /api/v1/companies/:companyId/listings/:listingId
 * Get, update, or delete a specific listing
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { updateListingSchema } from "@/lib/validation/schemas";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings/:listingId
 * Get a specific listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    await requireUserId();
    const { companyId, listingId } = await params;

    const listing = await ListingService.getById(companyId, listingId);

    return NextResponse.json(
      {
        data: listing,
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
 * PATCH /api/v1/companies/:companyId/listings/:listingId
 * Update a listing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const updates = updateListingSchema.parse(body);

    const listing = await ListingService.update(companyId, listingId, userId, updates);

    return NextResponse.json(
      {
        data: listing,
        meta: {
          message: "Listing updated successfully",
        },
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
 * DELETE /api/v1/companies/:companyId/listings/:listingId
 * Delete a listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId } = await params;

    const result = await ListingService.delete(companyId, listingId, userId);

    return NextResponse.json(
      {
        data: result,
        meta: {
          message: "Listing deleted successfully",
        },
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
