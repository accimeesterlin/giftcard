/**
 * DELETE /api/v1/companies/:companyId/payments/:providerId
 * Delete/disconnect a payment provider configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/companies/:companyId/payments/:providerId
 * Delete a payment provider configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; providerId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, providerId } = await params;

    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Find the provider configuration
    const config = await PaymentProviderConfig.findOne({
      id: providerId,
      companyId,
    });

    if (!config) {
      throw Errors.notFound("Payment provider configuration", providerId);
    }

    // Delete the configuration
    await PaymentProviderConfig.deleteOne({ id: providerId });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "payment.provider.deleted",
      resourceType: "payment_provider",
      resourceId: providerId,
      metadata: {
        provider: config.provider,
      },
    });

    return NextResponse.json(
      {
        meta: {
          message: "Payment provider configuration deleted successfully",
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
