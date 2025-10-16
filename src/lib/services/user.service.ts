/**
 * User Service
 * Business logic for user operations
 */

import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { Errors } from "@/lib/errors";
import type { RegisterUserInput } from "@/lib/validation/schemas";

export class UserService {
  /**
   * Register a new user
   */
  static async register(input: RegisterUserInput) {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });

    if (existingUser) {
      throw Errors.alreadyExists("User", { email: input.email });
    }

    // Hash password
    const passwordHash = await hash(input.password, 12);

    // Create user
    const user = await User.create({
      id: `user_${nanoid(16)}`,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      kycStatus: "unverified",
      emailVerified: null,
      image: null,
    });

    // Don't return password hash
    return user.toSessionUser();
  }

  /**
   * Get user by ID
   */
  static async getById(userId: string) {
    await connectDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      throw Errors.notFound("User", userId);
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string) {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw Errors.notFound("User");
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: {
      name?: string;
      image?: string | null;
    }
  ) {
    await connectDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      throw Errors.notFound("User", userId);
    }

    if (updates.name !== undefined) {
      user.name = updates.name;
    }

    if (updates.image !== undefined) {
      user.image = updates.image;
    }

    await user.save();

    return user;
  }

  /**
   * Verify user email
   */
  static async verifyEmail(userId: string) {
    await connectDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      throw Errors.notFound("User", userId);
    }

    user.emailVerified = new Date();
    await user.save();

    return user;
  }

  /**
   * Submit KYC for user
   */
  static async submitKYC(userId: string, kycData: Record<string, unknown>) {
    await connectDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      throw Errors.notFound("User", userId);
    }

    user.kycStatus = "pending";
    user.kycSubmittedAt = new Date();

    await user.save();

    // TODO: Integrate with KYC provider (e.g., Stripe Identity, Jumio)
    // For now, just mark as pending
    console.log("KYC submitted for user:", userId, kycData);

    return user;
  }
}
