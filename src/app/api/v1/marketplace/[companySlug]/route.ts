/**
 * GET /api/v1/marketplace/:companySlug
 * Get public company information (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug
 * Get public company information (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    await connectDB();
    const { companySlug } = await params;

    // Find company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return NextResponse.json(
        {
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Company not found",
          },
        },
        { status: 404 }
      );
    }

    // Return only public company information
    return NextResponse.json(
      {
        data: {
          id: company.id,
          slug: company.slug,
          displayName: company.displayName,
          logo: company.logo || null,
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
