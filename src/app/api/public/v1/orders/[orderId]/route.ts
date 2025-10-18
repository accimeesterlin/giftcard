/**
 * Public API: GET /api/public/v1/orders/:orderId
 * Fetch order details including redemption codes
 * No authentication required - customers can view their orders after payment
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import Listing from "@/lib/db/models/Listing";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/v1/orders/:orderId
 * Get order details including gift card codes (public access for customers)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();

    const { orderId } = await params;

    // Get order
    const order = await Order.findOne({ id: orderId });

    if (!order) {
      throw Errors.notFound("Order", orderId);
    }

    // Get listing details
    const listing = await Listing.findOne({ id: order.listingId });

    // Format response with all details needed for the success page
    const response = {
      id: order.id,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      denomination: order.denomination,
      quantity: order.quantity,
      total: order.total,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      listing: {
        title: listing?.title || order.listingTitle,
        brand: listing?.brand || order.brand,
      },
      // Include gift card codes if order is fulfilled
      codes:
        order.fulfillmentStatus === "fulfilled" && order.giftCardCodes
          ? order.giftCardCodes.map((gc: any) => ({
              code: gc.code,
              pin: gc.pin || null,
              denomination: order.denomination,
            }))
          : undefined,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };

    return NextResponse.json(
      {
        data: response,
      },
      {
        status: 200,
        headers: {
          "X-API-Version": "v1",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
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
