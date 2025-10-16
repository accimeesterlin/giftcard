/**
 * GET /api/v1/companies/:companyId/customers/:customerId - Get single customer
 * PATCH /api/v1/companies/:companyId/customers/:customerId - Update customer
 * DELETE /api/v1/companies/:companyId/customers/:customerId - Delete customer
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { updateCustomerSchema } from "@/lib/validation/schemas";
import { CustomerService } from "@/lib/services/customer.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId/customers/:customerId
 * Get single customer details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; customerId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, customerId } = await params;

    const customer = await CustomerService.getById(companyId, customerId, userId);

    return NextResponse.json(
      {
        data: customer,
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
 * PATCH /api/v1/companies/:companyId/customers/:customerId
 * Update customer information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; customerId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, customerId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const updates = updateCustomerSchema.parse(body);

    // Update customer
    const customer = await CustomerService.update(companyId, customerId, userId, updates);

    return NextResponse.json(
      {
        data: customer,
        meta: {
          message: "Customer updated successfully",
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
 * DELETE /api/v1/companies/:companyId/customers/:customerId
 * Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; customerId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, customerId } = await params;

    await CustomerService.delete(companyId, customerId, userId);

    return NextResponse.json(
      {
        data: { success: true },
        meta: {
          message: "Customer deleted successfully",
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
