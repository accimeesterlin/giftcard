/**
 * GET /api/v1/companies/:companyId/orders/:orderId
 * Get a specific order
 *
 * PATCH /api/v1/companies/:companyId/orders/:orderId
 * Update order status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

const updateOrderSchema = z.object({
  paymentStatus: z.enum(["pending", "processing", "completed", "failed", "refunded", "disputed"]).optional(),
  fulfillmentStatus: z.enum(["pending", "fulfilled", "failed"]).optional(),
});

/**
 * GET /api/v1/companies/:companyId/orders/:orderId
 * Get a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; orderId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, orderId } = await params;

    const order = await OrderService.getById(companyId, orderId, userId);

    return NextResponse.json(
      {
        data: order,
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
 * PATCH /api/v1/companies/:companyId/orders/:orderId
 * Update order status (payment or fulfillment)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; orderId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, orderId } = await params;

    await connectDB();

    // Verify user has agent+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("agent")) {
      throw Errors.insufficientPermissions("agent", companyId);
    }

    // Parse and validate request body
    const body = await request.json();
    const input = updateOrderSchema.parse(body);

    // Get order
    const order = await Order.findOne({ id: orderId, companyId });
    if (!order) {
      throw Errors.notFound("Order", orderId);
    }

    // Update order status
    if (input.paymentStatus) {
      order.paymentStatus = input.paymentStatus;
      if (input.paymentStatus === "completed" && !order.paidAt) {
        order.paidAt = new Date();
      }
    }

    if (input.fulfillmentStatus) {
      order.fulfillmentStatus = input.fulfillmentStatus;
      if (input.fulfillmentStatus === "fulfilled" && !order.fulfilledAt) {
        order.fulfilledAt = new Date();
        order.fulfilledBy = userId;
      }
    }

    await order.save();

    return NextResponse.json(
      {
        data: order,
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
