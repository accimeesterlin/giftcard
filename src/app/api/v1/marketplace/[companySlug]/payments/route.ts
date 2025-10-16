/**
 * GET /api/v1/marketplace/:companySlug/payments
 * Get enabled payment providers for a company (public endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/marketplace/:companySlug/payments
 * Get enabled payment providers for a company (no auth required - public marketplace endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;

    await connectDB();

    // Get company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      throw Errors.notFound("Company", companySlug);
    }

    console.log("[Marketplace Payments] Looking for providers:", {
      companyId: company.id,
      companyObjectId: company._id,
      companySlug,
    });

    // Try multiple approaches to find payment providers (multi-tenant compatibility)
    // Attempt 1: Try with UUID (id field)
    let providers = await PaymentProviderConfig.find({
      companyId: company.id,
      enabled: true,
      status: "connected",
    }).select("id provider enabled status testMode");

    console.log("[Marketplace Payments] Attempt 1 (UUID companyId):", providers.length, "found");

    // Attempt 2: If not found, try with MongoDB ObjectId (_id)
    if (providers.length === 0) {
      providers = await PaymentProviderConfig.find({
        companyId: company._id.toString(),
        enabled: true,
        status: "connected",
      }).select("id provider enabled status testMode");

      console.log("[Marketplace Payments] Attempt 2 (ObjectId companyId):", providers.length, "found");
    }

    // Debug: Show all providers for this company regardless of status
    const allProvidersUUID = await PaymentProviderConfig.find({
      companyId: company.id,
    }).select("id provider enabled status testMode companyId");

    const allProvidersObjectId = await PaymentProviderConfig.find({
      companyId: company._id.toString(),
    }).select("id provider enabled status testMode companyId");

    console.log("[Marketplace Payments] All providers (UUID):", allProvidersUUID);
    console.log("[Marketplace Payments] All providers (ObjectId):", allProvidersObjectId);
    console.log("[Marketplace Payments] Final enabled providers:", providers);

    return NextResponse.json(
      {
        data: providers,
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
