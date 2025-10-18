/**
 * GET /api/v1/marketplace/:companySlug/:listingId
 * Get public listing information (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Listing from "@/lib/db/models/Listing";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug/:listingId
 * Get public listing information (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string; listingId: string }> }
) {
  try {
    await connectDB();
    const { companySlug, listingId } = await params;

    // Find company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
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

    // Find listing - try by both _id (MongoDB ObjectId) and id (UUID) fields
    let listing = await Listing.findOne({
      _id: listingId,
      companyId: company._id.toString(),
      status: "active", // Only return active listings
    }).catch(() => null);

    // If not found by ObjectId, try by UUID id field with ObjectId companyId
    if (!listing) {
      listing = await Listing.findOne({
        id: listingId,
        companyId: company._id.toString(),
        status: "active",
      });
    }

    // If still not found, try with company.id (UUID) instead
    if (!listing) {
      listing = await Listing.findOne({
        id: listingId,
        companyId: company.id,
        status: "active",
      });
    }

    if (!listing) {
      return NextResponse.json(
        {
          error: {
            code: "LISTING_NOT_FOUND",
            message: "Listing not found or not available",
          },
        },
        { status: 404 }
      );
    }

    // Return only public listing information
    return NextResponse.json(
      {
        data: {
          id: listing.id,
          companyId: listing.companyId,
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
          cardType: listing.cardType,
          category: listing.category,
          denominations: listing.denominations,
          discountPercentage: listing.discountPercentage,
          sellerFeePercentage: listing.sellerFeePercentage,
          currency: listing.currency,
          countries: listing.countries,
          imageUrl: listing.imageUrl,
          brandLogoUrl: listing.brandLogoUrl,
          status: listing.status,
          totalStock: listing.totalStock,
          minPurchaseAmount: listing.minPurchaseAmount,
          maxPurchaseAmount: listing.maxPurchaseAmount,
          termsAndConditions: listing.termsAndConditions,
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
