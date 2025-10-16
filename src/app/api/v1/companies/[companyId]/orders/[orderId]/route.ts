/**
 * GET /api/v1/companies/:companyId/orders/:orderId
 * Get a specific order
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

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
