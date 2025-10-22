/**
 * CompanyMembership Mongoose Model
 * Links users to companies with roles and permissions
 */

import mongoose, { Schema } from "mongoose";
import { CompanyMembership } from "@/types";
import type { CompanyMembershipDocument, CompanyMembershipModel } from "./types";

const CompanyMembershipSchema = new Schema<CompanyMembershipDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      ref: "Company",
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "agent", "viewer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "revoked"],
      default: "active",
    },
    // Invitation tracking
    invitedBy: {
      type: String,
      ref: "User",
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
    invitationEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    invitationToken: {
      type: String,
      // No default - field will be undefined/missing when not set
      // This is required for the sparse unique index to work correctly
    },
    invitationExpiresAt: {
      type: Date,
      default: null,
    },
    // Access control
    permissions: {
      type: [String],
      default: [],
    },
    // Metadata
    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for performance
CompanyMembershipSchema.index({ userId: 1, companyId: 1 }, { unique: true });
CompanyMembershipSchema.index({ companyId: 1, role: 1 });
CompanyMembershipSchema.index({ companyId: 1, status: 1 });
CompanyMembershipSchema.index({ status: 1, invitationExpiresAt: 1 });

// Sparse unique index for invitationToken (allows multiple missing/undefined values)
// Note: This requires invitationToken field to be undefined (not null) when not in use
CompanyMembershipSchema.index({ invitationToken: 1 }, { unique: true, sparse: true, name: "invitationToken_1_sparse" });

// Virtual populate user
CompanyMembershipSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

// Virtual populate company
CompanyMembershipSchema.virtual("company", {
  ref: "Company",
  localField: "companyId",
  foreignField: "id",
  justOne: true,
});

// Instance methods
CompanyMembershipSchema.methods.isActive = function () {
  return this.status === "active";
};

CompanyMembershipSchema.methods.isPending = function () {
  return this.status === "pending";
};

CompanyMembershipSchema.methods.isInvitationExpired = function () {
  if (!this.invitationExpiresAt) return false;
  return new Date() > this.invitationExpiresAt;
};

CompanyMembershipSchema.methods.hasRole = function (role: string | string[]) {
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(this.role);
};

CompanyMembershipSchema.methods.hasPermission = function (permission: string) {
  return this.permissions.includes(permission);
};

// Role hierarchy helper
CompanyMembershipSchema.methods.hasMinimumRole = function (minimumRole: string) {
  const roleHierarchy = {
    viewer: 0,
    agent: 1,
    manager: 2,
    admin: 3,
    owner: 4,
  };

  const userRoleLevel = roleHierarchy[this.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[minimumRole as keyof typeof roleHierarchy] || 0;

  return userRoleLevel >= requiredLevel;
};

// Static methods
CompanyMembershipSchema.statics.findByUserAndCompany = function (
  userId: string,
  companyId: string
) {
  return this.findOne({ userId, companyId, status: "active" });
};

CompanyMembershipSchema.statics.findByInvitationToken = function (token: string) {
  return this.findOne({
    invitationToken: token,
    status: "pending",
    invitationExpiresAt: { $gt: new Date() },
  });
};

CompanyMembershipSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, status: "active" }).populate("company");
};

CompanyMembershipSchema.statics.findActiveByCompany = function (companyId: string) {
  return this.find({ companyId, status: "active" }).populate("user");
};

// Prevent model recompilation in development
const CompanyMembershipModelInstance: CompanyMembershipModel =
  (mongoose.models.CompanyMembership as CompanyMembershipModel) ||
  mongoose.model<CompanyMembershipDocument, CompanyMembershipModel>(
    "CompanyMembership",
    CompanyMembershipSchema
  );

export default CompanyMembershipModelInstance;
