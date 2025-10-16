/**
 * POST /api/v1/companies/:companyId/orders/:orderId/refund
 * Refund an order
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

/**
 * POST /api/v1/companies/:companyId/orders/:orderId/refund
 * Refund an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; orderId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, orderId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = refundSchema.parse(body);

    const result = await OrderService.refundOrder(
      companyId,
      orderId,
      userId,
      input.amount,
      input.reason
    );

    return NextResponse.json(
      {
        data: result.order,
        meta: {
          message: "Order refunded successfully",
          refund: result.refund,
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
