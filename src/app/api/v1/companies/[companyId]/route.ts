/**
 * GET   /api/v1/companies/:companyId - Get company details
 * PATCH /api/v1/companies/:companyId - Update company settings
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { updateCompanySchema } from "@/lib/validation/schemas";
import { CompanyService } from "@/lib/services/company.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId
 * Get company details (requires membership)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    const company = await CompanyService.getById(companyId, userId);

    return NextResponse.json(
      {
        data: company,
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
 * PATCH /api/v1/companies/:companyId
 * Update company settings (requires admin role)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const updates = updateCompanySchema.parse(body);

    // Update company
    const company = await CompanyService.update(companyId, userId, updates);

    return NextResponse.json(
      {
        data: company,
        meta: {
          message: "Company updated successfully",
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
