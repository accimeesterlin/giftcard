/**
 * POST /api/v1/companies/:companyId/members/:memberId/revoke
 * Revoke a pending invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { MembershipService } from "@/lib/services/membership.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/companies/:companyId/members/:memberId/revoke
 * Revoke a pending invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, memberId } = await params;

    // Revoke invitation
    await MembershipService.revokeInvitation({
      companyId,
      membershipId: memberId,
      requesterId: userId,
    });

    return NextResponse.json(
      {
        meta: {
          message: "Invitation revoked successfully",
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
