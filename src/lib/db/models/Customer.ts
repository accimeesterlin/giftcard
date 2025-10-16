/**
 * Customer Mongoose Model
 * Handles customer information and purchase history for each company
 */

import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import type { CustomerDocument, CustomerModel } from "./types";

const CustomerSchema = new Schema<CustomerDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `customer_${nanoid(16)}`,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastPurchaseAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
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
CustomerSchema.index({ companyId: 1, email: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, createdAt: -1 });
CustomerSchema.index({ companyId: 1, totalSpent: -1 });

// Static methods
CustomerSchema.statics.findByEmail = function (companyId: string, email: string) {
  return this.findOne({ companyId, email: email.toLowerCase() });
};

CustomerSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

// Prevent model recompilation in development
const CustomerModelInstance: CustomerModel =
  (mongoose.models.Customer as CustomerModel) ||
  mongoose.model<CustomerDocument, CustomerModel>("Customer", CustomerSchema);

export default CustomerModelInstance;
