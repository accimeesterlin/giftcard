/**
 * WebhookEndpoint Mongoose Model
 * Manages webhook endpoints for event notifications
 */

import mongoose, { Schema } from "mongoose";
import { WebhookEndpoint } from "@/types";

export interface WebhookEndpointDocument extends WebhookEndpoint {
  save(): Promise<this>;
  isActive(): boolean;
  recordSuccess(): Promise<void>;
  recordFailure(reason: string): Promise<void>;
}

export interface WebhookEndpointModel extends mongoose.Model<WebhookEndpointDocument> {
  findByCompany(companyId: string): Promise<WebhookEndpointDocument[]>;
  findActiveByCompany(companyId: string): Promise<WebhookEndpointDocument[]>;
  findByEvent(companyId: string, event: string): Promise<WebhookEndpointDocument[]>;
}

const WebhookEndpointSchema = new Schema<WebhookEndpointDocument>(
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
    url: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    // Configuration
    events: {
      type: [String],
      required: true,
    },
    secret: {
      type: String,
      required: true,
      select: false, // Never include in queries by default
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "failed"],
      default: "active",
    },
    // Stats
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    successCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFailureAt: {
      type: Date,
      default: null,
    },
    lastFailureReason: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
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
        delete ret.secret; // Never expose secret in JSON
        return ret;
      },
    },
  }
);

// Compound indexes
WebhookEndpointSchema.index({ companyId: 1, enabled: 1 });
WebhookEndpointSchema.index({ companyId: 1, status: 1 });

// Instance methods
WebhookEndpointSchema.methods.isActive = function () {
  return this.enabled && this.status === "active";
};

WebhookEndpointSchema.methods.recordSuccess = async function () {
  this.successCount += 1;
  this.lastTriggeredAt = new Date();
  if (this.status === "failed") {
    this.status = "active";
  }
  await this.save();
};

WebhookEndpointSchema.methods.recordFailure = async function (reason: string) {
  this.failureCount += 1;
  this.lastFailureAt = new Date();
  this.lastFailureReason = reason;
  this.lastTriggeredAt = new Date();

  // Disable webhook after 5 consecutive failures
  if (this.failureCount >= 5) {
    this.status = "failed";
    this.enabled = false;
  }

  await this.save();
};

// Static methods
WebhookEndpointSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

WebhookEndpointSchema.statics.findActiveByCompany = function (companyId: string) {
  return this.find({
    companyId,
    enabled: true,
    status: "active",
  }).sort({ createdAt: -1 });
};

WebhookEndpointSchema.statics.findByEvent = function (companyId: string, event: string) {
  return this.find({
    companyId,
    events: event,
    enabled: true,
    status: "active",
  });
};

// Prevent model recompilation in development
const WebhookEndpointModelInstance: WebhookEndpointModel =
  (mongoose.models.WebhookEndpoint as WebhookEndpointModel) ||
  mongoose.model<WebhookEndpointDocument, WebhookEndpointModel>(
    "WebhookEndpoint",
    WebhookEndpointSchema
  );

export default WebhookEndpointModelInstance;
