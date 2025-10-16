/**
 * GET/POST /api/v1/companies/:companyId/orders
 * List and create orders
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createOrderSchema, orderFilterSchema } from "@/lib/validation/schemas";
import { OrderService } from "@/lib/services/order.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/companies/:companyId/orders
 * List all orders for a company with filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = orderFilterSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      paymentStatus: searchParams.get("paymentStatus"),
      fulfillmentStatus: searchParams.get("fulfillmentStatus"),
      customerEmail: searchParams.get("customerEmail"),
      brand: searchParams.get("brand"),
      search: searchParams.get("search"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    const result = await OrderService.getByCompany(companyId, userId, filters);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-API-Version": "v1",
      },
    });
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
 * POST /api/v1/companies/:companyId/orders
 * Create a new order (checkout)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = createOrderSchema.parse(body);

    const order = await OrderService.createOrder(companyId, input);

    return NextResponse.json(
      {
        data: order,
        meta: {
          message: "Order created successfully",
        },
      },
      {
        status: 201,
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
