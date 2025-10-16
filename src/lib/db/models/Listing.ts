/**
 * Listing Mongoose Model
 * Gift card listings scoped to companies (multi-tenant)
 */

import mongoose, { Schema } from "mongoose";
import { Listing } from "@/types";

// Define the schema interface extending Listing with Mongoose methods
export interface ListingDocument extends Listing {
  save(): Promise<this>;
  isActive(): boolean;
  hasStock(): boolean;
}

export interface ListingModel extends mongoose.Model<ListingDocument> {
  findByCompany(companyId: string): Promise<ListingDocument[]>;
  findActiveByCompany(companyId: string): Promise<ListingDocument[]>;
}

const ListingSchema = new Schema<ListingDocument>(
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
    // Basic info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cardType: {
      type: String,
      enum: ["digital", "physical"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Pricing & Availability
    denominations: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v: number[]) {
          return v && v.length > 0;
        },
        message: "At least one denomination is required",
      },
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      length: 3,
      uppercase: true,
    },
    countries: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one country is required",
      },
    },
    // Images
    imageUrl: {
      type: String,
      default: null,
    },
    brandLogoUrl: {
      type: String,
      default: null,
    },
    // Stock & Status
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "out_of_stock"],
      default: "draft",
      index: true,
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Settings
    minPurchaseAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    maxPurchaseAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    autoFulfill: {
      type: Boolean,
      default: true,
    },
    termsAndConditions: {
      type: String,
      default: null,
      maxlength: 5000,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
      ref: "User",
    },
    updatedBy: {
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
        return ret;
      },
    },
  }
);

// Compound indexes for performance
ListingSchema.index({ companyId: 1, status: 1 });
ListingSchema.index({ companyId: 1, brand: 1 });
ListingSchema.index({ companyId: 1, category: 1 });
ListingSchema.index({ companyId: 1, createdAt: -1 });
ListingSchema.index({ status: 1, totalStock: 1 });

// Instance methods
ListingSchema.methods.isActive = function () {
  return this.status === "active" && this.totalStock > 0;
};

ListingSchema.methods.hasStock = function () {
  return this.totalStock > 0;
};

// Static methods
ListingSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

ListingSchema.statics.findActiveByCompany = function (companyId: string) {
  return this.find({
    companyId,
    status: "active",
    totalStock: { $gt: 0 },
  }).sort({ createdAt: -1 });
};

// Prevent model recompilation in development
const ListingModelInstance: ListingModel =
  (mongoose.models.Listing as ListingModel) ||
  mongoose.model<ListingDocument, ListingModel>("Listing", ListingSchema);

export default ListingModelInstance;
