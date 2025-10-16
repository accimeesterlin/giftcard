/**
 * GET /api/v1/marketplace/:companySlug/:listingId/inventory
 * Get public inventory availability for a listing (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Listing from "@/lib/db/models/Listing";
import Inventory from "@/lib/db/models/Inventory";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug/:listingId/inventory
 * Get public inventory availability (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; listingId: string }> }
) {
  try {
    await connectDB();
    const { companySlug, listingId } = await params;

    console.log("[Marketplace] Request:", { companySlug, listingId });

    // Find company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      console.log("[Marketplace] Company not found:", companySlug);
      return NextResponse.json(
        {
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Company not found",
          },
        },
        { status: 404 }
      );
    }

    console.log("[Marketplace] Company found:", { id: company.id, _id: company._id.toString() });

    // Find listing - try by both _id (MongoDB ObjectId) and id (UUID) fields
    // Also try both ObjectId and UUID for companyId matching
    let listing = await Listing.findOne({
      _id: listingId,
      companyId: company._id.toString(),
      status: "active", // Only return data for active listings
    }).catch(() => null);

    console.log("[Marketplace] Attempt 1 (_id + ObjectId companyId):", listing ? "FOUND" : "NOT FOUND");

    // If not found by ObjectId, try by UUID id field with ObjectId companyId
    if (!listing) {
      listing = await Listing.findOne({
        id: listingId,
        companyId: company._id.toString(),
        status: "active",
      });
      console.log("[Marketplace] Attempt 2 (UUID + ObjectId companyId):", listing ? "FOUND" : "NOT FOUND");
    }

    // If still not found, try with company.id (UUID) instead
    if (!listing) {
      listing = await Listing.findOne({
        id: listingId,
        companyId: company.id,
        status: "active",
      });
      console.log("[Marketplace] Attempt 3 (UUID + UUID companyId):", listing ? "FOUND" : "NOT FOUND");
    }

    if (!listing) {
      console.log("[Marketplace] Listing not found after all attempts");
      return NextResponse.json(
        {
          error: {
            code: "LISTING_NOT_FOUND",
            message: "Listing not found",
          },
        },
        { status: 404 }
      );
    }

    console.log("[Marketplace] Listing found:", { id: listing.id, companyId: listing.companyId, status: listing.status });

    // Get inventory availability grouped by denomination
    // Use listing.id (not the URL param) to match the inventory listingId field
    console.log("[Marketplace Inventory] Searching for inventory:", {
      listingIdFromUrl: listingId,
      listingUuid: listing.id,
      companySlug,
    });

    const inventory = await Inventory.aggregate([
      {
        $match: {
          listingId: listing.id,
          status: "available", // Only count available codes
        },
      },
      {
        $group: {
          _id: "$denomination",
          available: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("[Marketplace Inventory] Found inventory:", inventory);

    // Transform to map format for easy lookup
    const availabilityMap: Record<number, number> = {};
    inventory.forEach((item) => {
      availabilityMap[item._id] = item.available;
    });

    // Create response with all denominations
    const result = listing.denominations.map((denom) => ({
      denomination: denom,
      available: availabilityMap[denom] || 0,
      inStock: (availabilityMap[denom] || 0) > 0,
    }));

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
