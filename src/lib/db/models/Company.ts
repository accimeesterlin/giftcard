/**
 * Company Mongoose Model
 * Multi-tenant entity - each company is an independent selling business
 */

import mongoose, { Schema } from "mongoose";
import { Company } from "@/types";
import type { CompanyDocument, CompanyModel } from "./types";

const CompanySchema = new Schema<CompanyDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    legalName: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
    },
    country: {
      type: String,
      required: true,
      length: 2,
    },
    currency: {
      type: String,
      required: true,
      length: 3,
    },
    timezone: {
      type: String,
      required: true,
    },
    supportEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // KYB/Verification
    kybStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "failed"],
      default: "unverified",
    },
    kybSubmittedAt: {
      type: Date,
      default: null,
    },
    kybVerifiedAt: {
      type: Date,
      default: null,
    },
    // Payment settings
    allowedPaymentMethods: {
      type: [String],
      enum: ["stripe", "paypal", "crypto", "pgpay"],
      default: ["stripe", "paypal"],
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    stripeAccountStatus: {
      type: String,
      default: null,
    },
    paypalMerchantId: {
      type: String,
      default: null,
    },
    cryptoWalletAddress: {
      type: String,
      default: null,
    },
    pgpayMerchantId: {
      type: String,
      default: null,
    },
    // Trust & Risk
    trustTier: {
      type: String,
      enum: ["new", "standard", "trusted"],
      default: "new",
    },
    payoutHoldDays: {
      type: Number,
      default: 7,
    },
    dailyGmvLimit: {
      type: Number,
      default: null,
    },
    // Subscription (optional for SaaS model)
    subscriptionTier: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      default: null,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
      index: true,
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

// Indexes for performance and queries
CompanySchema.index({ slug: 1 });
CompanySchema.index({ createdBy: 1 });
CompanySchema.index({ kybStatus: 1 });
CompanySchema.index({ trustTier: 1 });
CompanySchema.index({ createdAt: -1 });

// Virtual for company members
CompanySchema.virtual("members", {
  ref: "CompanyMembership",
  localField: "id",
  foreignField: "companyId",
});

// Instance methods
CompanySchema.methods.canAcceptPayments = function () {
  return this.kybStatus === "verified" && this.stripeAccountId !== null;
};

CompanySchema.methods.isPayoutBlocked = function () {
  return this.kybStatus !== "verified";
};

// Static methods
CompanySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase() });
};

// Prevent model recompilation in development
const CompanyModelInstance: CompanyModel =
  (mongoose.models.Company as CompanyModel) ||
  mongoose.model<CompanyDocument, CompanyModel>("Company", CompanySchema);

export default CompanyModelInstance;
