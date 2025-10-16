/**
 * GET /api/v1/companies/:companyId/listings/:listingId/orders
 * Get orders for a specific listing
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import Order from "@/lib/db/models/Order";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/listings/:listingId/orders
 * Get orders for a specific listing (requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; listingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw Errors.unauthorized();
    }

    const { companyId, listingId } = await params;

    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(
      session.user.id,
      companyId
    );

    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Get query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get orders for this listing
    const orders = await Order.find({
      companyId,
      listingId,
      paymentStatus: "completed", // Only show completed orders
    })
      .select("id customerEmail customerName denomination quantity total currency paidAt createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count for pagination
    const totalCount = await Order.countDocuments({
      companyId,
      listingId,
      paymentStatus: "completed",
    });

    return NextResponse.json(
      {
        data: orders,
        meta: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + orders.length < totalCount,
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
