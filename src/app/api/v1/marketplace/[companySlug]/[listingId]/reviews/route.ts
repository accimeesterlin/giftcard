/**
 * GET /api/v1/marketplace/:companySlug/:listingId/reviews
 * Get reviews for a listing (public endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Listing from "@/lib/db/models/Listing";
import Review from "@/lib/db/models/Review";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug/:listingId/reviews
 * Get public reviews for a listing
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

    // Find listing
    const listing = await Listing.findOne({
      id: listingId,
      status: "active",
    });

    if (!listing) {
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

    // Get reviews for this listing
    const reviews = await Review.findByListing(listingId);

    // Get average rating
    const stats = await Review.getAverageRating(listingId);

    // Format reviews for public display
    const publicReviews = reviews.map((review) => ({
      id: review.id,
      customerName: review.customerName || "Anonymous",
      rating: review.rating,
      comment: review.comment,
      verified: review.verified,
      createdAt: review.createdAt,
    }));

    return NextResponse.json(
      {
        data: {
          reviews: publicReviews,
          stats: {
            averageRating: stats.average,
            totalReviews: stats.count,
          },
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
