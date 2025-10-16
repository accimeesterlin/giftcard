import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import Company from "@/lib/db/models/Company";
import User from "@/lib/db/models/User";
import { Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();

    const { token } = await params;

    if (!token) {
      throw Errors.badRequest("Invitation token is required");
    }

    // Find membership by invitation token
    const membership = await CompanyMembership.findByInvitationToken(token);

    if (!membership) {
      throw Errors.notFound("Invitation not found or has expired");
    }

    // Check if invitation is still pending
    if (membership.status !== "pending") {
      throw Errors.badRequest("This invitation has already been used");
    }

    // Check if invitation has expired
    if (membership.invitationExpiresAt && membership.invitationExpiresAt < new Date()) {
      throw Errors.badRequest("This invitation has expired");
    }

    // Get company details
    const company = await Company.findOne({ id: membership.companyId });

    if (!company) {
      throw Errors.notFound("Company not found");
    }

    // Get inviter details if available
    let inviterName = "A team member";
    if (membership.invitedBy) {
      const inviter = await User.findOne({ id: membership.invitedBy });
      if (inviter && inviter.name) {
        inviterName = inviter.name;
      }
    }

    // Return invitation details
    const invitationDetails = {
      companyName: company.displayName,
      companySlug: company.slug,
      role: membership.role,
      inviterName,
      expiresAt: membership.invitationExpiresAt?.toISOString() || null,
    };

    return NextResponse.json(
      {
        data: invitationDetails,
      },
      {
        status: 200,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error: any) {
    console.error("Get invitation error:", error);

    if (error.code && error.statusCode) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        {
          status: error.statusCode,
          headers: {
            "X-API-Version": "v1",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      {
        status: 500,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  }
}
