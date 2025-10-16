/**
 * PATCH /api/v1/companies/:companyId/members/:memberId - Update member role
 * DELETE /api/v1/companies/:companyId/members/:memberId - Remove member
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { updateMemberRoleSchema } from "@/lib/validation/schemas";
import { MembershipService } from "@/lib/services/membership.service";
import { toAppError } from "@/lib/errors";

/**
 * PATCH /api/v1/companies/:companyId/members/:memberId
 * Update member's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, memberId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = updateMemberRoleSchema.parse(body);

    // Update role
    const membership = await MembershipService.updateMemberRole({
      companyId,
      memberId,
      newRole: input.role,
      requesterId: userId,
    });

    return NextResponse.json(
      {
        data: membership,
        meta: {
          message: "Member role updated successfully",
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
 * DELETE /api/v1/companies/:companyId/members/:memberId
 * Remove member from company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, memberId } = await params;

    // Remove member
    await MembershipService.removeMember({
      companyId,
      memberId,
      requesterId: userId,
    });

    return NextResponse.json(
      {
        meta: {
          message: "Member removed successfully",
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
