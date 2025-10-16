/**
 * GET/POST /api/v1/companies/:companyId/listings
 * List and create gift card listings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createListingSchema, listingFilterSchema } from "@/lib/validation/schemas";
import { ListingService } from "@/lib/services/listing.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings
 * List all listings for a company with filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = listingFilterSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      brand: searchParams.get("brand"),
      category: searchParams.get("category"),
      cardType: searchParams.get("cardType"),
      search: searchParams.get("search"),
    });

    const result = await ListingService.getByCompany(companyId, userId, filters);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-API-Version": "v1",
      },
    });
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
 * POST /api/v1/companies/:companyId/listings
 * Create a new gift card listing
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
    const input = createListingSchema.parse(body);

    const listing = await ListingService.create(companyId, userId, input);

    return NextResponse.json(
      {
        data: listing,
        meta: {
          message: "Listing created successfully",
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
