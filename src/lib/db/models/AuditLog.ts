/**
 * AuditLog Mongoose Model
 * Tracks all sensitive actions performed by users in companies
 */

import mongoose, { Schema } from "mongoose";
import { AuditLog } from "@/types";
import type { AuditLogDocument, AuditLogModel } from "./types";

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      ref: "Company",
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
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

// Compound indexes for efficient queries
AuditLogSchema.index({ companyId: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, resourceType: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // For cleanup jobs

// Static methods
AuditLogSchema.statics.createLog = async function (log: Partial<AuditLog>) {
  return this.create({
    ...log,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  });
};

AuditLogSchema.statics.findByCompany = function (
  companyId: string,
  filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit = 100
) {
  const query: Record<string, unknown> = { companyId };

  if (filters?.action) query.action = filters.action;
  if (filters?.resourceType) query.resourceType = filters.resourceType;
  if (filters?.userId) query.userId = filters.userId;

  if (filters?.startDate || filters?.endDate) {
    query.timestamp = {};
    if (filters.startDate) (query.timestamp as Record<string, unknown>).$gte = filters.startDate;
    if (filters.endDate) (query.timestamp as Record<string, unknown>).$lte = filters.endDate;
  }

  return this.find(query).sort({ timestamp: -1 }).limit(limit);
};

// Prevent model recompilation in development
const AuditLogModelInstance: AuditLogModel =
  (mongoose.models.AuditLog as AuditLogModel) ||
  mongoose.model<AuditLogDocument, AuditLogModel>("AuditLog", AuditLogSchema);

export default AuditLogModelInstance;
