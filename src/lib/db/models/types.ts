/**
 * TypeScript type definitions for Mongoose model static methods
 */

import { Model } from "mongoose";
import type {
  User,
  Company,
  CompanyMembership,
  AuditLog as AuditLogType,
  Customer,
} from "@/types";

// Use simpler types that just extend Model with static methods
// Mongoose types are complex and cause issues with our custom id field

// User Model Interface
export interface UserDocument extends User {
  toSessionUser(): {
    id: string;
    email: string;
    name: string;
    image: string | null;
    kycStatus: string;
  };
  save(): Promise<this>;
}

export interface UserModel extends Model<UserDocument> {
  // Add any static methods here if needed
}

// Company Model Interface
export interface CompanyDocument extends Company {
  save(): Promise<this>;
}

export interface CompanyModel extends Model<CompanyDocument> {
  findBySlug(slug: string): Promise<CompanyDocument | null>;
}

// CompanyMembership Model Interface
export interface CompanyMembershipDocument extends CompanyMembership {
  isActive(): boolean;
  isPending(): boolean;
  isInvitationExpired(): boolean;
  hasRole(role: string | string[]): boolean;
  hasPermission(permission: string): boolean;
  hasMinimumRole(minimumRole: string): boolean;
  save(): Promise<this>;
}

export interface CompanyMembershipModel extends Model<CompanyMembershipDocument> {
  findByUserAndCompany(
    userId: string,
    companyId: string
  ): Promise<CompanyMembershipDocument | null>;
  findByInvitationToken(token: string): Promise<CompanyMembershipDocument | null>;
  findActiveByUser(userId: string): Promise<CompanyMembershipDocument[]>;
  findActiveByCompany(companyId: string): Promise<CompanyMembershipDocument[]>;
}

// AuditLog Model Interface
export interface AuditLogDocument extends AuditLogType {
  save(): Promise<this>;
}

export interface AuditLogModel extends Model<AuditLogDocument> {
  createLog(log: Partial<AuditLogType>): Promise<AuditLogDocument>;
}

// Customer Model Interface
export interface CustomerDocument extends Customer {
  save(): Promise<this>;
}

export interface CustomerModel extends Model<CustomerDocument> {
  findByEmail(companyId: string, email: string): Promise<CustomerDocument | null>;
  findByCompany(companyId: string): Promise<CustomerDocument[]>;
}
