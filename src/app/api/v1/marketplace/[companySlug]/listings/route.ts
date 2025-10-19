/**
 * GET /api/v1/marketplace/:companySlug/listings
 * Get public listings for a company (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Listing from "@/lib/db/models/Listing";
import Review from "@/lib/db/models/Review";
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

    // Get review summaries for all listings
    const listingIds = listings.map(l => l.id);
    const reviews = await Review.find({
      listingId: { $in: listingIds },
      tokenUsed: true,
    });

    // Calculate review summaries for each listing
    const reviewSummaries: Record<string, { averageRating: number; reviewCount: number }> = {};
    listingIds.forEach(id => {
      const listingReviews = reviews.filter(r => r.listingId === id);
      const count = listingReviews.length;
      const avgRating = count > 0
        ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
      reviewSummaries[id] = {
        averageRating: avgRating,
        reviewCount: count,
      };
    });

    // Return only public listing information with review summaries
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
      reviewSummary: reviewSummaries[listing.id] || { averageRating: 0, reviewCount: 0 },
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
