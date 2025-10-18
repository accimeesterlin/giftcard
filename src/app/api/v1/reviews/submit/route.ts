/**
 * POST /api/v1/reviews/submit
 * Submit a review using a one-time token
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Review from "@/lib/db/models/Review";
import Order from "@/lib/db/models/Order";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/reviews/submit
 * Submit a review using review token
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, rating, comment } = body;

    // Validate required fields
    if (!token || !rating) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Token and rating are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_RATING",
            message: "Rating must be between 1 and 5",
          },
        },
        { status: 400 }
      );
    }

    // Find the review by token
    const review = await Review.findByToken(token);
    if (!review) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_TOKEN",
            message: "Review token not found",
          },
        },
        { status: 404 }
      );
    }

    // Check if token is valid (not used and not expired)
    if (!review.isTokenValid()) {
      return NextResponse.json(
        {
          error: {
            code: "TOKEN_EXPIRED",
            message: review.tokenUsed
              ? "This review has already been submitted"
              : "This review link has expired",
          },
        },
        { status: 400 }
      );
    }

    // Update the review
    review.rating = rating;
    review.comment = comment || null;
    await review.markTokenAsUsed();

    return NextResponse.json(
      {
        data: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
        message: "Review submitted successfully",
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
