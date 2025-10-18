/**
 * GET /api/v1/companies/:companyId/members/me - Get current user's membership
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { toAppError, Errors } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId/members/me
 * Get the current user's membership for this company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    await connectDB();

    // Find the current user's membership
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    return NextResponse.json(
      {
        data: {
          id: membership.id,
          userId: membership.userId,
          companyId: membership.companyId,
          role: membership.role,
          status: membership.status,
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
