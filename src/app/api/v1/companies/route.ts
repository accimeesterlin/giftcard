/**
 * GET  /api/v1/companies - List companies user has access to
 * POST /api/v1/companies - Create new company
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createCompanySchema } from "@/lib/validation/schemas";
import { CompanyService } from "@/lib/services/company.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies
 * List all companies the authenticated user has access to
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();

    const companies = await CompanyService.getUserCompanies(userId);

    return NextResponse.json(
      {
        data: companies,
        meta: {
          total: companies.length,
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
 * POST /api/v1/companies
 * Create a new company (caller becomes owner)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    // Parse and validate request body
    const body = await request.json();
    const input = createCompanySchema.parse(body);

    // Create company
    const company = await CompanyService.create(userId, input);

    return NextResponse.json(
      {
        data: company,
        meta: {
          message: "Company created successfully",
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
