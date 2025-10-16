/**
 * RBAC Middleware
 * Role-based access control for company-scoped resources
 */

import { requireUserId } from "@/lib/auth";
import { CompanyService } from "@/lib/services/company.service";
import connectDB from "@/lib/db/mongodb";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { Errors } from "@/lib/errors";
import type { CompanyRoleType } from "@/types";

export interface RBACContext {
  userId: string;
  companyId: string;
  membership: typeof CompanyMembership.prototype | null;
}

/**
 * Verify user has access to company
 */
export async function requireCompanyAccess(companyId: string): Promise<RBACContext> {
  const userId = await requireUserId();

  await connectDB();

  const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

  if (!membership || !membership.isActive()) {
    throw Errors.companyAccessDenied(companyId);
  }

  return {
    userId,
    companyId,
    membership,
  };
}

/**
 * Verify user has minimum role in company
 */
export async function requireRole(
  companyId: string,
  minimumRole: CompanyRoleType
): Promise<RBACContext> {
  const context = await requireCompanyAccess(companyId);

  if (!context.membership) {
    throw Errors.companyAccessDenied(companyId);
  }

  if (!context.membership.hasMinimumRole(minimumRole)) {
    throw Errors.insufficientPermissions(minimumRole, companyId);
  }

  return context;
}

/**
 * Verify user has specific permission in company
 */
export async function requirePermission(
  companyId: string,
  permission: string
): Promise<RBACContext> {
  const context = await requireCompanyAccess(companyId);

  if (!context.membership) {
    throw Errors.companyAccessDenied(companyId);
  }

  if (!context.membership.hasPermission(permission)) {
    throw Errors.insufficientPermissions(permission, companyId);
  }

  return context;
}

/**
 * Check if user is owner of company
 */
export async function isCompanyOwner(userId: string, companyId: string): Promise<boolean> {
  await connectDB();

  const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

  return membership !== null && membership.role === "owner" && membership.isActive();
}

/**
 * Helper to get user's role in company
 */
export async function getUserRole(
  userId: string,
  companyId: string
): Promise<CompanyRoleType | null> {
  await connectDB();

  const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

  return membership?.isActive() ? membership.role : null;
}

/**
 * Helper to check if user can perform action on company
 */
export async function canPerformAction(
  userId: string,
  companyId: string,
  requiredRole: CompanyRoleType
): Promise<boolean> {
  try {
    await requireRole(companyId, requiredRole);
    return true;
  } catch {
    return false;
  }
}
