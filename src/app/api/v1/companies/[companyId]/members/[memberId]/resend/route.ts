/**
 * POST /api/v1/companies/:companyId/members/:memberId/resend
 * Resend invitation to a pending member
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { toAppError, Errors } from "@/lib/errors";
import connectDB from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import Company from "@/lib/db/models/Company";
import User from "@/lib/db/models/User";
import AuditLog from "@/lib/db/models/AuditLog";
import { EmailService } from "@/lib/services/email.service";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";
import { checkResendRateLimit } from "@/lib/middleware/invitation-rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/companies/:companyId/members/:memberId/resend
 * Resend invitation email to a pending member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, memberId } = await params;

    await connectDB();

    // Check rate limit first to prevent abuse
    checkResendRateLimit(memberId);

    // Verify requester has admin+ permissions
    const requesterMembership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!requesterMembership || !requesterMembership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Get the membership to resend
    const membership = await CompanyMembership.findOne({
      id: memberId,
      companyId,
      status: "pending",
    });

    if (!membership) {
      throw Errors.notFound("Pending invitation");
    }

    // Get company details
    const company = await Company.findOne({ id: companyId });
    if (!company) {
      throw Errors.companyNotFound(companyId);
    }

    // Generate new invitation token
    const invitationToken = `inv_${nanoid(32)}`;
    membership.invitationToken = invitationToken;
    membership.invitationExpiresAt = addDays(new Date(), 7);
    membership.invitedAt = new Date();
    await membership.save();

    // Get inviter details
    const inviter = await User.findOne({ id: userId });
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/accept?token=${invitationToken}`;

    // Get the user's email (from invitationEmail field for pending invitations)
    const recipientEmail = membership.invitationEmail;

    if (!recipientEmail) {
      throw Errors.badRequest("Cannot resend invitation - user email not found");
    }

    // Send invitation email
    await EmailService.sendTeamInvitation({
      companyId,
      to: recipientEmail,
      inviterName: inviter?.name || "A team member",
      companyName: company.displayName,
      role: membership.role,
      invitationUrl,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "member.invitation_resent",
      resourceType: "membership",
      resourceId: membership.id,
      metadata: { email: recipientEmail, role: membership.role },
    });

    return NextResponse.json(
      {
        data: membership,
        meta: {
          message: "Invitation resent successfully",
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
