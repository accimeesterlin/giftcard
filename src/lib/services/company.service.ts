/**
 * Company Service
 * Business logic for company (tenant) operations
 */

import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { Errors } from "@/lib/errors";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validation/schemas";

export class CompanyService {
  /**
   * Create a new company and make the creator an owner
   */
  static async create(
    userId: string,
    input: CreateCompanyInput
  ) {
    await connectDB();

    // Generate slug from name
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (await Company.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create company
    const company = await Company.create({
      id: `company_${nanoid(16)}`,
      slug,
      name: input.name,
      legalName: input.legalName || null,
      displayName: input.name,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
      supportEmail: input.supportEmail || `support@${slug}.example.com`,
      kybStatus: "unverified",
      trustTier: "new",
      payoutHoldDays: 7,
      allowedPaymentMethods: ["stripe", "paypal"],
      createdBy: userId,
      logo: null,
      bio: null,
      kybSubmittedAt: null,
      kybVerifiedAt: null,
      stripeAccountId: null,
      stripeAccountStatus: null,
      paypalMerchantId: null,
      cryptoWalletAddress: null,
      pgpayMerchantId: null,
      dailyGmvLimit: null,
      subscriptionTier: null,
      subscriptionStatus: null,
    });

    // Create owner membership
    await CompanyMembership.create({
      id: `membership_${nanoid(16)}`,
      userId,
      companyId: company.id,
      role: "owner",
      status: "active",
      permissions: [],
      invitedBy: null,
      invitedAt: null,
      acceptedAt: new Date(),
      // invitationToken is omitted - field should be undefined for sparse index
      invitationExpiresAt: null,
      lastAccessedAt: new Date(),
    });

    // Create audit log
    await AuditLog.createLog({
      companyId: company.id,
      userId,
      action: "company.created",
      resourceType: "company",
      resourceId: company.id,
      metadata: {
        name: company.name,
        slug: company.slug,
      },
    });

    return company;
  }

  /**
   * Get company by ID
   */
  static async getById(companyId: string, userId?: string) {
    await connectDB();

    const company = await Company.findOne({ id: companyId });

    if (!company) {
      throw Errors.companyNotFound(companyId);
    }

    // If userId provided, verify access
    if (userId) {
      const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
      if (!membership) {
        throw Errors.companyAccessDenied(companyId);
      }
    }

    return company;
  }

  /**
   * Get company by slug
   */
  static async getBySlug(slug: string) {
    await connectDB();

    const company = await Company.findBySlug(slug);

    if (!company) {
      throw Errors.notFound("Company");
    }

    return company;
  }

  /**
   * Update company
   */
  static async update(companyId: string, userId: string, updates: UpdateCompanyInput) {
    await connectDB();

    // Verify access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    if (!membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Get company
    const company = await Company.findOne({ id: companyId });

    if (!company) {
      throw Errors.companyNotFound(companyId);
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};

    // Apply updates
    if (updates.displayName !== undefined) {
      changes.displayName = { from: company.displayName, to: updates.displayName };
      company.displayName = updates.displayName;
    }

    if (updates.logo !== undefined) {
      changes.logo = { from: company.logo, to: updates.logo };
      company.logo = updates.logo;
    }

    if (updates.bio !== undefined) {
      changes.bio = { from: company.bio, to: updates.bio };
      company.bio = updates.bio;
    }

    if (updates.supportEmail !== undefined) {
      changes.supportEmail = { from: company.supportEmail, to: updates.supportEmail };
      company.supportEmail = updates.supportEmail;
    }

    if (updates.allowedPaymentMethods !== undefined) {
      changes.allowedPaymentMethods = {
        from: company.allowedPaymentMethods,
        to: updates.allowedPaymentMethods,
      };
      company.allowedPaymentMethods = updates.allowedPaymentMethods;
    }

    await company.save();

    // Create audit log
    await AuditLog.createLog({
      companyId: company.id,
      userId,
      action: "company.updated",
      resourceType: "company",
      resourceId: company.id,
      changes,
    });

    return company;
  }

  /**
   * Get all companies for a user
   */
  static async getUserCompanies(userId: string) {
    await connectDB();

    const memberships = await CompanyMembership.findActiveByUser(userId);

    // Get unique company IDs
    const companyIds = [...new Set(memberships.map((m) => m.companyId))];

    // Fetch companies
    const companies = await Company.find({ id: { $in: companyIds } });

    return companies;
  }

  /**
   * Get company members
   */
  static async getMembers(companyId: string, userId: string) {
    await connectDB();

    // Verify access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const members = await CompanyMembership.findActiveByCompany(companyId);

    return members;
  }

  /**
   * Check if user has access to company
   */
  static async hasAccess(userId: string, companyId: string): Promise<boolean> {
    await connectDB();

    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    return membership !== null && membership.isActive();
  }

  /**
   * Check if user has minimum role in company
   */
  static async hasMinimumRole(
    userId: string,
    companyId: string,
    minimumRole: string
  ): Promise<boolean> {
    await connectDB();

    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.isActive()) {
      return false;
    }

    return membership.hasMinimumRole(minimumRole);
  }
}
