/**
 * GET /api/v1/companies/:companyId/members - List company members
 * POST /api/v1/companies/:companyId/members - Invite new member
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/validation/schemas";
import { MembershipService } from "@/lib/services/membership.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId/members
 * List all members of the company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    const members = await MembershipService.getMembers(companyId, userId);

    return NextResponse.json(
      {
        data: members,
        meta: {
          total: members.length,
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
 * POST /api/v1/companies/:companyId/members
 * Invite a new member to the company
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = inviteMemberSchema.parse(body);

    // Send invitation
    const membership = await MembershipService.inviteMember({
      companyId,
      invitedBy: userId,
      email: input.email,
      role: input.role,
    });

    return NextResponse.json(
      {
        data: membership,
        meta: {
          message: "Invitation sent successfully",
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
