/**
 * Membership Service
 * Handles team invitations, member management, and access control
 */

import { nanoid } from "nanoid";
import { addDays } from "date-fns";
import connectDB from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import User from "@/lib/db/models/User";
import Company from "@/lib/db/models/Company";
import AuditLog from "@/lib/db/models/AuditLog";
import { EmailService } from "./email.service";
import { Errors } from "@/lib/errors";
import type { CompanyRoleType } from "@/types";

export class MembershipService {
  /**
   * Invite a user to join a company
   */
  static async inviteMember({
    companyId,
    invitedBy,
    email,
    role,
  }: {
    companyId: string;
    invitedBy: string;
    email: string;
    role: CompanyRoleType;
  }) {
    await connectDB();

    // Verify inviter has permission
    const inviterMembership = await CompanyMembership.findByUserAndCompany(invitedBy, companyId);

    if (!inviterMembership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Only owners and admins can invite
    if (!inviterMembership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Owners can only be created during company creation
    if (role === "owner") {
      throw Errors.badRequest("Cannot invite owners - only one owner per company");
    }

    // Get company details
    const company = await Company.findOne({ id: companyId });
    if (!company) {
      throw Errors.companyNotFound(companyId);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    // Check if invitation or membership already exists
    const existingMembership = existingUser
      ? await CompanyMembership.findOne({
          userId: existingUser.id,
          companyId,
        })
      : null;

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw Errors.alreadyExists("Membership", { email, companyId });
      }

      if (existingMembership.status === "pending") {
        // Resend invitation
        const invitationToken = `inv_${nanoid(32)}`;
        existingMembership.invitationToken = invitationToken;
        existingMembership.invitationExpiresAt = addDays(new Date(), 7);
        existingMembership.invitedAt = new Date();
        existingMembership.role = role; // Update role if changed
        await existingMembership.save();

        // Send email
        const inviter = await User.findOne({ id: invitedBy });
        const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/accept?token=${invitationToken}`;

        await EmailService.sendTeamInvitation({
          to: email,
          inviterName: inviter?.name || "A team member",
          companyName: company.displayName,
          role,
          invitationUrl,
        });

        await AuditLog.createLog({
          companyId,
          userId: invitedBy,
          action: "member.invitation_resent",
          resourceType: "membership",
          resourceId: existingMembership.id,
          metadata: { email, role },
        });

        return existingMembership;
      }
    }

    // Create new invitation
    const invitationToken = `inv_${nanoid(32)}`;
    const membership = await CompanyMembership.create({
      id: `membership_${nanoid(16)}`,
      userId: existingUser?.id || `pending_${nanoid(16)}`, // Temporary ID if user doesn't exist yet
      companyId,
      role,
      status: "pending",
      invitedBy,
      invitedAt: new Date(),
      invitationToken,
      invitationExpiresAt: addDays(new Date(), 7),
      permissions: [],
      acceptedAt: null,
      lastAccessedAt: null,
    });

    // Send invitation email
    const inviter = await User.findOne({ id: invitedBy });
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitations/accept?token=${invitationToken}`;

    await EmailService.sendTeamInvitation({
      to: email,
      inviterName: inviter?.name || "A team member",
      companyName: company.displayName,
      role,
      invitationUrl,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId: invitedBy,
      action: "member.invited",
      resourceType: "membership",
      resourceId: membership.id,
      metadata: { email, role },
    });

    return membership;
  }

  /**
   * Accept an invitation
   */
  static async acceptInvitation({
    token,
    userId,
  }: {
    token: string;
    userId: string;
  }) {
    await connectDB();

    // Find invitation
    const membership = await CompanyMembership.findByInvitationToken(token);

    if (!membership) {
      throw Errors.invitationInvalid();
    }

    // Check if user matches (if membership already has a userId)
    if (membership.userId !== userId && !membership.userId.startsWith("pending_")) {
      throw Errors.forbidden("This invitation is for a different user");
    }

    // Update membership
    membership.userId = userId;
    membership.status = "active";
    membership.acceptedAt = new Date();
    membership.invitationToken = null;
    membership.invitationExpiresAt = null;
    membership.lastAccessedAt = new Date();
    await membership.save();

    // Create audit log
    await AuditLog.createLog({
      companyId: membership.companyId,
      userId,
      action: "member.invitation_accepted",
      resourceType: "membership",
      resourceId: membership.id,
    });

    return membership;
  }

  /**
   * Get all members of a company
   */
  static async getMembers(companyId: string, requesterId: string) {
    await connectDB();

    // Verify requester has access
    const requesterMembership = await CompanyMembership.findByUserAndCompany(
      requesterId,
      companyId
    );

    if (!requesterMembership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Get all members
    const members = await CompanyMembership.find({
      companyId,
      status: { $in: ["active", "pending"] },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    return members;
  }

  /**
   * Update member role
   */
  static async updateMemberRole({
    companyId,
    memberId,
    newRole,
    requesterId,
  }: {
    companyId: string;
    memberId: string;
    newRole: CompanyRoleType;
    requesterId: string;
  }) {
    await connectDB();

    // Verify requester has permission
    const requesterMembership = await CompanyMembership.findByUserAndCompany(
      requesterId,
      companyId
    );

    if (!requesterMembership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Only owners and admins can change roles
    if (!requesterMembership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Get target membership
    const membership = await CompanyMembership.findOne({
      userId: memberId,
      companyId,
    });

    if (!membership) {
      throw Errors.membershipNotFound();
    }

    // Cannot change owner role
    if (membership.role === "owner") {
      throw Errors.badRequest("Cannot change owner role");
    }

    // Cannot assign owner role
    if (newRole === "owner") {
      throw Errors.badRequest("Cannot assign owner role");
    }

    const oldRole = membership.role;
    membership.role = newRole;
    await membership.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId: requesterId,
      action: "member.role_updated",
      resourceType: "membership",
      resourceId: membership.id,
      changes: { role: { from: oldRole, to: newRole } },
      metadata: { memberId },
    });

    return membership;
  }

  /**
   * Remove or suspend a member
   */
  static async removeMember({
    companyId,
    memberId,
    requesterId,
  }: {
    companyId: string;
    memberId: string;
    requesterId: string;
  }) {
    await connectDB();

    // Verify requester has permission
    const requesterMembership = await CompanyMembership.findByUserAndCompany(
      requesterId,
      companyId
    );

    if (!requesterMembership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Only owners and admins can remove members
    if (!requesterMembership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Get target membership
    const membership = await CompanyMembership.findOne({
      userId: memberId,
      companyId,
    }).populate("user");

    if (!membership) {
      throw Errors.membershipNotFound();
    }

    // Cannot remove owner
    if (membership.role === "owner") {
      throw Errors.badRequest("Cannot remove company owner");
    }

    // Cannot remove self
    if (memberId === requesterId) {
      throw Errors.badRequest("Cannot remove yourself");
    }

    // Revoke membership
    membership.status = "revoked";
    await membership.save();

    // Send notification email
    const user = await User.findOne({ id: memberId });
    const company = await Company.findOne({ id: companyId });

    if (user && company) {
      await EmailService.sendMembershipRevoked({
        to: user.email,
        companyName: company.displayName,
      });
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId: requesterId,
      action: "member.removed",
      resourceType: "membership",
      resourceId: membership.id,
      metadata: { memberId, memberEmail: user?.email },
    });

    return membership;
  }

  /**
   * Cancel/revoke a pending invitation
   */
  static async revokeInvitation({
    companyId,
    membershipId,
    requesterId,
  }: {
    companyId: string;
    membershipId: string;
    requesterId: string;
  }) {
    await connectDB();

    // Verify requester has permission
    const requesterMembership = await CompanyMembership.findByUserAndCompany(
      requesterId,
      companyId
    );

    if (!requesterMembership || !requesterMembership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Get membership
    const membership = await CompanyMembership.findOne({
      id: membershipId,
      companyId,
      status: "pending",
    });

    if (!membership) {
      throw Errors.notFound("Pending invitation");
    }

    // Revoke
    membership.status = "revoked";
    membership.invitationToken = null;
    await membership.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId: requesterId,
      action: "member.invitation_revoked",
      resourceType: "membership",
      resourceId: membership.id,
    });

    return membership;
  }
}
