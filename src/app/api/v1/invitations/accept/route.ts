/**
 * POST /api/v1/invitations/accept - Accept team invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { acceptInvitationSchema } from "@/lib/validation/schemas";
import { MembershipService } from "@/lib/services/membership.service";
import { toAppError } from "@/lib/errors";

/**
 * POST /api/v1/invitations/accept
 * Accept a team invitation
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    // Parse and validate request body
    const body = await request.json();
    const input = acceptInvitationSchema.parse(body);

    // Accept invitation
    const membership = await MembershipService.acceptInvitation({
      token: input.token,
      userId,
    });

    return NextResponse.json(
      {
        data: membership,
        meta: {
          message: "Invitation accepted successfully",
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
