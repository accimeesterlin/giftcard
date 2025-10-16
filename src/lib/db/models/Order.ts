/**
 * Order Mongoose Model
 * Gift card purchase orders scoped to companies (multi-tenant)
 */

import mongoose, { Schema } from "mongoose";
import { Order } from "@/types";

// Define the schema interface extending Order with Mongoose methods
export interface OrderDocument extends Order {
  save(): Promise<this>;
  isPaid(): boolean;
  isFulfilled(): boolean;
  canBeFulfilled(): boolean;
  canBeRefunded(): boolean;
}

export interface OrderModel extends mongoose.Model<OrderDocument> {
  findByCompany(companyId: string): Promise<OrderDocument[]>;
  findByCustomerEmail(email: string): Promise<OrderDocument[]>;
  findPendingFulfillment(companyId: string): Promise<OrderDocument[]>;
}

const OrderSchema = new Schema<OrderDocument>(
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
    // Listing reference
    listingId: {
      type: String,
      required: true,
      ref: "Listing",
      index: true,
    },
    listingTitle: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      index: true,
    },
    // Purchase details
    denomination: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      length: 3,
      uppercase: true,
    },
    // Customer info
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    customerName: {
      type: String,
      default: null,
    },
    customerId: {
      type: String,
      default: null,
      ref: "User",
      index: true,
    },
    // Payment
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "crypto", "pgpay"],
      required: true,
    },
    paymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "disputed"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Fulfillment
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "fulfilled", "failed"],
      default: "pending",
      index: true,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    fulfilledBy: {
      type: String,
      default: null,
      ref: "User",
    },
    giftCardCodes: {
      type: [
        {
          inventoryId: { type: String, required: true },
          code: { type: String, required: true },
          pin: { type: String, default: null },
          serialNumber: { type: String, default: null },
        },
      ],
      default: null,
    },
    // Delivery
    deliveryMethod: {
      type: String,
      enum: ["email", "api", "manual"],
      default: "email",
    },
    deliveryEmail: {
      type: String,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // Metadata
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    // Timestamps
    expiresAt: {
      type: Date,
      default: null,
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

// Compound indexes for performance
OrderSchema.index({ companyId: 1, createdAt: -1 });
OrderSchema.index({ companyId: 1, paymentStatus: 1 });
OrderSchema.index({ companyId: 1, fulfillmentStatus: 1 });
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ listingId: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

// Instance methods
OrderSchema.methods.isPaid = function () {
  return this.paymentStatus === "completed";
};

OrderSchema.methods.isFulfilled = function () {
  return this.fulfillmentStatus === "fulfilled";
};

OrderSchema.methods.canBeFulfilled = function () {
  return (
    this.paymentStatus === "completed" &&
    this.fulfillmentStatus === "pending"
  );
};

OrderSchema.methods.canBeRefunded = function () {
  return (
    this.paymentStatus === "completed" &&
    this.fulfillmentStatus !== "fulfilled"
  );
};

// Static methods
OrderSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByCustomerEmail = function (email: string) {
  return this.find({ customerEmail: email.toLowerCase() }).sort({ createdAt: -1 });
};

OrderSchema.statics.findPendingFulfillment = function (companyId: string) {
  return this.find({
    companyId,
    paymentStatus: "completed",
    fulfillmentStatus: "pending",
  }).sort({ createdAt: 1 }); // FIFO for fulfillment
};

// Prevent model recompilation in development
const OrderModelInstance: OrderModel =
  (mongoose.models.Order as OrderModel) ||
  mongoose.model<OrderDocument, OrderModel>("Order", OrderSchema);

export default OrderModelInstance;
