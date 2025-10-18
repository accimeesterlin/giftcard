/**
 * GET /api/v1/marketplace/:companySlug/listings
 * Get public listings for a company (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Listing from "@/lib/db/models/Listing";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug/listings
 * Get public listings for a company (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    await connectDB();
    const { companySlug } = await params;

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

    // Find all active listings for this company
    // Try both companyId formats (ObjectId and UUID)
    let listings = await Listing.find({
      companyId: company._id.toString(),
      status: "active",
    });

    // If no listings found with ObjectId, try with UUID
    if (listings.length === 0) {
      listings = await Listing.find({
        companyId: company.id,
        status: "active",
      });
    }

    // Return only public listing information
    const publicListings = listings.map((listing) => ({
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
    }));

    return NextResponse.json(
      {
        data: publicListings,
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
