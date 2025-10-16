/**
 * PaymentProviderConfig Mongoose Model
 * Stores payment provider credentials and configuration (encrypted)
 */

import mongoose, { Schema } from "mongoose";
import { PaymentProviderConfig } from "@/types";

export interface PaymentProviderConfigDocument extends PaymentProviderConfig {
  save(): Promise<this>;
  isEnabled(): boolean;
  isConnected(): boolean;
}

export interface PaymentProviderConfigModel extends mongoose.Model<PaymentProviderConfigDocument> {
  findByCompany(companyId: string): Promise<PaymentProviderConfigDocument[]>;
  findByProvider(companyId: string, provider: string): Promise<PaymentProviderConfigDocument | null>;
  findEnabledByCompany(companyId: string): Promise<PaymentProviderConfigDocument[]>;
}

const PaymentProviderConfigSchema = new Schema<PaymentProviderConfigDocument>(
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
    provider: {
      type: String,
      enum: ["stripe", "paypal", "crypto", "pgpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["disconnected", "connected", "pending", "error"],
      default: "disconnected",
    },
    // Credentials (should be encrypted in production)
    publicKey: {
      type: String,
      default: null,
    },
    secretKey: {
      type: String,
      default: null,
      select: false, // Never include in queries by default
    },
    webhookSecret: {
      type: String,
      default: null,
      select: false, // Never include in queries by default
    },
    // Provider-specific settings
    accountId: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      default: null,
    },
    userId: {
      type: String,
      default: null,
      // For PGPay: receiver of funds
    },
    // Configuration
    testMode: {
      type: Boolean,
      default: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
      ref: "User",
    },
    lastTestedAt: {
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
        delete ret.secretKey; // Never expose in JSON
        delete ret.webhookSecret; // Never expose in JSON
        return ret;
      },
    },
  }
);

// Compound indexes
PaymentProviderConfigSchema.index({ companyId: 1, provider: 1 }, { unique: true });
PaymentProviderConfigSchema.index({ companyId: 1, enabled: 1 });

// Instance methods
PaymentProviderConfigSchema.methods.isEnabled = function () {
  return this.enabled && this.status === "connected";
};

PaymentProviderConfigSchema.methods.isConnected = function () {
  return this.status === "connected";
};

// Static methods
PaymentProviderConfigSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

PaymentProviderConfigSchema.statics.findByProvider = function (
  companyId: string,
  provider: string
) {
  return this.findOne({ companyId, provider });
};

PaymentProviderConfigSchema.statics.findEnabledByCompany = function (companyId: string) {
  return this.find({
    companyId,
    enabled: true,
    status: "connected",
  }).sort({ createdAt: -1 });
};

// Prevent model recompilation in development
const PaymentProviderConfigModelInstance: PaymentProviderConfigModel =
  (mongoose.models.PaymentProviderConfig as PaymentProviderConfigModel) ||
  mongoose.model<PaymentProviderConfigDocument, PaymentProviderConfigModel>(
    "PaymentProviderConfig",
    PaymentProviderConfigSchema
  );

export default PaymentProviderConfigModelInstance;
