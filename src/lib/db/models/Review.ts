/**
 * Review Mongoose Model
 * Customer reviews for gift card listings
 */

import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface Review {
  id: string;
  orderId: string;
  listingId: string;
  companyId: string;
  customerEmail: string;
  customerName: string | null;
  rating: number; // 1-5
  comment: string | null;
  reviewToken: string; // One-time token for submitting review
  tokenUsed: boolean;
  tokenExpiresAt: Date;
  verified: boolean; // True if review is from a verified purchase
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDocument extends Review {
  save(): Promise<this>;
  isTokenValid(): boolean;
  markTokenAsUsed(): Promise<this>;
}

export interface ReviewModel extends mongoose.Model<ReviewDocument> {
  findByListing(listingId: string): Promise<ReviewDocument[]>;
  findByOrder(orderId: string): Promise<ReviewDocument | null>;
  findByToken(token: string): Promise<ReviewDocument | null>;
  getAverageRating(listingId: string): Promise<{ average: number; count: number }>;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `review_${uuidv4()}`,
    },
    orderId: {
      type: String,
      required: true,
      ref: "Order",
      index: true,
    },
    listingId: {
      type: String,
      required: true,
      ref: "Listing",
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      ref: "Company",
      index: true,
    },
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    reviewToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `revtok_${uuidv4().replace(/-/g, "")}`,
    },
    tokenUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
      // Default to 30 days from now
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    verified: {
      type: Boolean,
      default: true, // All reviews from our system are verified purchases
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.reviewToken; // Don't expose token in JSON
        return ret;
      },
    },
  }
);

// Compound indexes
ReviewSchema.index({ listingId: 1, createdAt: -1 });
ReviewSchema.index({ companyId: 1, createdAt: -1 });
ReviewSchema.index({ orderId: 1 }, { unique: true }); // One review per order
ReviewSchema.index({ reviewToken: 1, tokenUsed: 1 });

// Instance methods
ReviewSchema.methods.isTokenValid = function () {
  return !this.tokenUsed && this.tokenExpiresAt > new Date();
};

ReviewSchema.methods.markTokenAsUsed = function () {
  this.tokenUsed = true;
  return this.save();
};

// Static methods
ReviewSchema.statics.findByListing = function (listingId: string) {
  return this.find({ listingId }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByOrder = function (orderId: string) {
  return this.findOne({ orderId });
};

ReviewSchema.statics.findByToken = function (token: string) {
  return this.findOne({ reviewToken: token });
};

ReviewSchema.statics.getAverageRating = async function (listingId: string) {
  const result = await this.aggregate([
    { $match: { listingId } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { average: 0, count: 0 };
  }

  return {
    average: Math.round(result[0].average * 10) / 10, // Round to 1 decimal
    count: result[0].count,
  };
};

// Prevent model recompilation in development
const ReviewModelInstance: ReviewModel =
  (mongoose.models.Review as ReviewModel) ||
  mongoose.model<ReviewDocument, ReviewModel>("Review", ReviewSchema);

export default ReviewModelInstance;
