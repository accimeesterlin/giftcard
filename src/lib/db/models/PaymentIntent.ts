/**
 * PaymentIntent Mongoose Model
 * Tracks payment intents across different payment providers
 */

import mongoose, { Schema } from "mongoose";
import { PaymentIntent } from "@/types";

export interface PaymentIntentDocument extends PaymentIntent {
  save(): Promise<this>;
  isPending(): boolean;
  isSucceeded(): boolean;
  isFailed(): boolean;
}

export interface PaymentIntentModel extends mongoose.Model<PaymentIntentDocument> {
  findByOrder(orderId: string): Promise<PaymentIntentDocument | null>;
  findByProviderIntentId(providerIntentId: string): Promise<PaymentIntentDocument | null>;
  findPendingByCompany(companyId: string): Promise<PaymentIntentDocument[]>;
}

const PaymentIntentSchema = new Schema<PaymentIntentDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      ref: "Order",
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
    // Amount details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      length: 3,
    },
    // Provider reference
    providerIntentId: {
      type: String,
      required: true,
      index: true,
    },
    providerStatus: {
      type: String,
      required: true,
    },
    // Customer info
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "canceled"],
      default: "pending",
      index: true,
    },
    // URLs (for redirect-based flows)
    successUrl: {
      type: String,
      default: null,
    },
    cancelUrl: {
      type: String,
      default: null,
    },
    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Timestamps
    completedAt: {
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

// Compound indexes
PaymentIntentSchema.index({ companyId: 1, status: 1 });
PaymentIntentSchema.index({ orderId: 1, status: 1 });
PaymentIntentSchema.index({ provider: 1, providerIntentId: 1 }, { unique: true });

// Instance methods
PaymentIntentSchema.methods.isPending = function () {
  return this.status === "pending" || this.status === "processing";
};

PaymentIntentSchema.methods.isSucceeded = function () {
  return this.status === "succeeded";
};

PaymentIntentSchema.methods.isFailed = function () {
  return this.status === "failed" || this.status === "canceled";
};

// Static methods
PaymentIntentSchema.statics.findByOrder = function (orderId: string) {
  return this.findOne({ orderId }).sort({ createdAt: -1 });
};

PaymentIntentSchema.statics.findByProviderIntentId = function (providerIntentId: string) {
  return this.findOne({ providerIntentId });
};

PaymentIntentSchema.statics.findPendingByCompany = function (companyId: string) {
  return this.find({
    companyId,
    status: { $in: ["pending", "processing"] },
  }).sort({ createdAt: -1 });
};

// Prevent model recompilation in development
const PaymentIntentModelInstance: PaymentIntentModel =
  (mongoose.models.PaymentIntent as PaymentIntentModel) ||
  mongoose.model<PaymentIntentDocument, PaymentIntentModel>(
    "PaymentIntent",
    PaymentIntentSchema
  );

export default PaymentIntentModelInstance;
