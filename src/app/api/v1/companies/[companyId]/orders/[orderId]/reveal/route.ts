/**
 * POST /api/v1/companies/:companyId/orders/:orderId/reveal
 * Track code reveal in audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { toAppError, Errors } from "@/lib/errors";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/companies/:companyId/orders/:orderId/reveal
 * Log when a user reveals gift card codes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; orderId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, orderId } = await params;

    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Verify order exists
    const order = await Order.findOne({ id: orderId, companyId });
    if (!order) {
      throw Errors.notFound("Order", orderId);
    }

    // Parse request body to get which code was revealed
    const body = await request.json();
    const { codeIndex } = body;

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "order.code_revealed",
      resourceType: "order",
      resourceId: orderId,
      metadata: {
        customerEmail: order.customerEmail,
        listingTitle: order.listingTitle,
        codeIndex: codeIndex !== undefined ? codeIndex : null,
        totalCodes: order.giftCardCodes?.length || 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
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
