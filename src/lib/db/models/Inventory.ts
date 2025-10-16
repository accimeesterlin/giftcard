/**
 * Inventory Mongoose Model
 * Gift card codes/stock scoped to companies (multi-tenant)
 */

import mongoose, { Schema } from "mongoose";
import { Inventory } from "@/types";

// Define the schema interface extending Inventory with Mongoose methods
export interface InventoryDocument extends Inventory {
  save(): Promise<this>;
  isAvailable(): boolean;
  markAsSold(orderId: string, soldTo: string): Promise<this>;
  markAsInvalid(): Promise<this>;
}

export interface InventoryModel extends mongoose.Model<InventoryDocument> {
  findByListing(listingId: string): Promise<InventoryDocument[]>;
  findAvailableByListing(listingId: string, denomination?: number): Promise<InventoryDocument[]>;
  countAvailableByListing(listingId: string): Promise<number>;
  reserveCode(listingId: string, denomination: number): Promise<InventoryDocument | null>;
}

const InventorySchema = new Schema<InventoryDocument>(
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
    listingId: {
      type: String,
      required: true,
      ref: "Listing",
      index: true,
    },
    // Gift card details
    denomination: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    code: {
      type: String,
      required: true,
      // In production, this should be encrypted
      // For now, we'll store it as-is, but mark for encryption
      select: false, // Don't include in queries by default for security
    },
    pin: {
      type: String,
      default: null,
      select: false, // Don't include in queries by default for security
    },
    serialNumber: {
      type: String,
      default: null,
    },
    // Status & tracking
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "invalid", "expired"],
      default: "available",
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "reloadly", "bulk_upload", "api"],
      required: true,
    },
    // Purchase tracking
    orderId: {
      type: String,
      default: null,
      ref: "Order",
      index: true,
    },
    soldAt: {
      type: Date,
      default: null,
    },
    soldTo: {
      type: String,
      default: null,
    },
    // Expiry
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    // Metadata
    uploadedBy: {
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
        // Never expose sensitive data in JSON
        delete ret.code;
        delete ret.pin;
        return ret;
      },
    },
  }
);

// Compound indexes for performance
InventorySchema.index({ companyId: 1, listingId: 1 });
InventorySchema.index({ listingId: 1, status: 1 });
InventorySchema.index({ listingId: 1, denomination: 1, status: 1 });
InventorySchema.index({ companyId: 1, status: 1 });
InventorySchema.index({ orderId: 1 });
InventorySchema.index({ expiresAt: 1 }); // For cleanup jobs

// Instance methods
InventorySchema.methods.isAvailable = function () {
  if (this.status !== "available") return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

InventorySchema.methods.markAsSold = async function (orderId: string, soldTo: string) {
  this.status = "sold";
  this.orderId = orderId;
  this.soldAt = new Date();
  this.soldTo = soldTo;
  return await this.save();
};

InventorySchema.methods.markAsInvalid = async function () {
  this.status = "invalid";
  return await this.save();
};

// Static methods
InventorySchema.statics.findByListing = function (listingId: string) {
  return this.find({ listingId }).sort({ createdAt: -1 });
};

InventorySchema.statics.findAvailableByListing = function (
  listingId: string,
  denomination?: number
) {
  const query: any = {
    listingId,
    status: "available",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (denomination !== undefined) {
    query.denomination = denomination;
  }

  return this.find(query).sort({ createdAt: 1 }); // FIFO
};

InventorySchema.statics.countAvailableByListing = function (listingId: string) {
  return this.countDocuments({
    listingId,
    status: "available",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

InventorySchema.statics.reserveCode = async function (
  listingId: string,
  denomination: number
) {
  // Find and reserve a code atomically
  const inventory = await this.findOneAndUpdate(
    {
      listingId,
      denomination,
      status: "available",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    },
    {
      $set: { status: "reserved" },
    },
    {
      sort: { createdAt: 1 }, // FIFO
      new: true,
    }
  );

  return inventory;
};

// Prevent model recompilation in development
const InventoryModelInstance: InventoryModel =
  (mongoose.models.Inventory as InventoryModel) ||
  mongoose.model<InventoryDocument, InventoryModel>("Inventory", InventorySchema);

export default InventoryModelInstance;
