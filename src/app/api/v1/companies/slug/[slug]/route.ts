import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { toAppError, Errors } from "@/lib/errors";

// GET /api/v1/companies/slug/:slug - Get company by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await requireUserId();
    const { slug } = await params;

    await connectDB();

    // Find company by slug
    const company = await Company.findBySlug(slug);

    if (!company) {
      throw Errors.notFound("Company", slug);
    }

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, company.id);

    if (!membership) {
      throw Errors.companyAccessDenied(company.id);
    }

    return NextResponse.json(
      {
        company: {
          id: company.id,
          slug: company.slug,
          name: company.name,
          displayName: company.displayName,
          logo: company.logo,
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
