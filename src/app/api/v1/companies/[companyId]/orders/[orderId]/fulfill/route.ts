/**
 * POST /api/v1/companies/:companyId/orders/:orderId/fulfill
 * Fulfill an order (assign gift card codes and deliver)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/companies/:companyId/orders/:orderId/fulfill
 * Fulfill an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; orderId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, orderId } = await params;

    const order = await OrderService.fulfillOrder(companyId, orderId, userId);

    return NextResponse.json(
      {
        data: order,
        meta: {
          message: "Order fulfilled successfully. Gift card codes sent to customer.",
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
