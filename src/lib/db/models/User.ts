/**
 * User Mongoose Model
 * Handles authentication and global user settings
 */

import mongoose, { Schema } from "mongoose";
import { User } from "@/types";
import type { UserDocument, UserModel } from "./types";

const UserSchema = new Schema<UserDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false, // Don't include in queries by default
    },
    kycStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "failed"],
      default: "unverified",
    },
    kycSubmittedAt: {
      type: Date,
      default: null,
    },
    kycVerifiedAt: {
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
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for user's companies (populated from memberships)
UserSchema.virtual("memberships", {
  ref: "CompanyMembership",
  localField: "id",
  foreignField: "userId",
});

// Instance methods
UserSchema.methods.toSessionUser = function () {
  return {
    id: this.id,
    email: this.email,
    emailVerified: this.emailVerified,
    name: this.name,
    image: this.image,
    kycStatus: this.kycStatus,
    kycSubmittedAt: this.kycSubmittedAt,
    kycVerifiedAt: this.kycVerifiedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Prevent model recompilation in development
const UserModelInstance: UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<UserDocument, UserModel>("User", UserSchema);

export default UserModelInstance;
