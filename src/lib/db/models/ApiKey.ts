/**
 * ApiKey Mongoose Model
 * Manages API keys for programmatic access
 */

import mongoose, { Schema } from "mongoose";
import { ApiKey } from "@/types";

export interface ApiKeyDocument extends ApiKey {
  save(): Promise<this>;
  isActive(): boolean;
  isExpired(): boolean;
  hasScope(scope: string): boolean;
}

export interface ApiKeyModel extends mongoose.Model<ApiKeyDocument> {
  findByCompany(companyId: string): Promise<ApiKeyDocument[]>;
  findActiveByCompany(companyId: string): Promise<ApiKeyDocument[]>;
  findByKeyHash(keyHash: string): Promise<ApiKeyDocument | null>;
}

const ApiKeySchema = new Schema<ApiKeyDocument>(
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    // Key details
    keyPrefix: {
      type: String,
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // Never include in queries by default
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    // Permissions & Scopes
    scopes: {
      type: [String],
      default: [],
    },
    environment: {
      type: String,
      enum: ["test", "live"],
      required: true,
      default: "test",
    },
    // Rate limiting
    rateLimit: {
      type: Number,
      default: 60, // 60 requests per minute
      min: 1,
    },
    rateLimitWindow: {
      type: Number,
      default: 60, // 60 seconds
      min: 1,
    },
    // Status
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
      ref: "User",
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: String,
      default: null,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.keyHash; // Never expose hash in JSON
        return ret;
      },
    },
  }
);

// Compound indexes
ApiKeySchema.index({ companyId: 1, status: 1 });
ApiKeySchema.index({ companyId: 1, environment: 1 });

// Instance methods
ApiKeySchema.methods.isActive = function () {
  if (this.status !== "active") return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

ApiKeySchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

ApiKeySchema.methods.hasScope = function (scope: string) {
  return this.scopes.includes(scope) || this.scopes.includes("*");
};

// Static methods
ApiKeySchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

ApiKeySchema.statics.findActiveByCompany = function (companyId: string) {
  return this.find({
    companyId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).sort({ createdAt: -1 });
};

ApiKeySchema.statics.findByKeyHash = function (keyHash: string) {
  return this.findOne({ keyHash }).select("+keyHash");
};

// Prevent model recompilation in development
const ApiKeyModelInstance: ApiKeyModel =
  (mongoose.models.ApiKey as ApiKeyModel) ||
  mongoose.model<ApiKeyDocument, ApiKeyModel>("ApiKey", ApiKeySchema);

export default ApiKeyModelInstance;
