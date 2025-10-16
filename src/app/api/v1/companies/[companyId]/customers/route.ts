/**
 * GET /api/v1/companies/:companyId/customers - List company customers
 * POST /api/v1/companies/:companyId/customers - Create new customer
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createCustomerSchema } from "@/lib/validation/schemas";
import { CustomerService } from "@/lib/services/customer.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId/customers
 * List all customers of the company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    const customers = await CustomerService.getByCompany(companyId, userId);

    return NextResponse.json(
      {
        data: customers,
        meta: {
          total: customers.length,
        },
      },
      {
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
 * POST /api/v1/companies/:companyId/customers
 * Create a new customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = createCustomerSchema.parse(body);

    // Create customer
    const customer = await CustomerService.create(companyId, userId, input);

    return NextResponse.json(
      {
        data: customer,
        meta: {
          message: "Customer created successfully",
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
