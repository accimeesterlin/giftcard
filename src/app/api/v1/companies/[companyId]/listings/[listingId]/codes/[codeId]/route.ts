/**
 * PATCH /api/v1/companies/:companyId/listings/:listingId/codes/:codeId
 * Update a specific code
 *
 * DELETE /api/v1/companies/:companyId/listings/:listingId/codes/:codeId
 * Delete a specific code
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/companies/:companyId/listings/:listingId/codes/:codeId
 * Update a specific code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string; codeId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId: listingIdParam, codeId } = await params;
    const body = await request.json();

    // First get the listing to retrieve its UUID id field
    const listing = await ListingService.getById(companyId, listingIdParam);

    const result = await ListingService.updateCode(
      companyId,
      listing.id,
      codeId,
      body,
      userId
    );

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
 * DELETE /api/v1/companies/:companyId/listings/:listingId/codes/:codeId
 * Delete a specific code
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string; codeId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, listingId: listingIdParam, codeId } = await params;

    // First get the listing to retrieve its UUID id field
    const listing = await ListingService.getById(companyId, listingIdParam);

    await ListingService.deleteCode(companyId, listing.id, codeId, userId);

    return NextResponse.json(
      {
        data: { success: true },
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
