/**
 * API Key Service
 * Handles API key generation, validation, and management
 */

import { nanoid } from "nanoid";
import crypto from "crypto";
import connectDB from "@/lib/db/mongodb";
import ApiKey from "@/lib/db/models/ApiKey";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { Errors } from "@/lib/errors";

interface CreateApiKeyInput {
  companyId: string;
  userId: string;
  name: string;
  description?: string;
  scopes: string[];
  environment: "test" | "live";
  expiresAt?: Date | null;
  rateLimit?: number;
}

export class ApiKeyService {
  /**
   * Generate a new API key
   * Format: gck_{environment}_{random}
   */
  static async createApiKey(input: CreateApiKeyInput) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(
      input.userId,
      input.companyId
    );
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", input.companyId);
    }

    // Generate API key
    const environment = input.environment === "live" ? "live" : "test";
    const randomPart = nanoid(32); // 32 characters
    const apiKey = `gck_${environment}_${randomPart}`;

    // Hash the API key for storage
    const keyHash = this.hashApiKey(apiKey);

    // Extract prefix for display (first 12 characters)
    const keyPrefix = apiKey.substring(0, 12);

    // Create API key record
    const apiKeyRecord = await ApiKey.create({
      id: `key_${nanoid(16)}`,
      companyId: input.companyId,
      name: input.name,
      description: input.description || null,
      keyPrefix,
      keyHash,
      lastUsedAt: null,
      scopes: input.scopes,
      environment: input.environment,
      rateLimit: input.rateLimit || 60,
      rateLimitWindow: 60,
      status: "active",
      expiresAt: input.expiresAt || null,
      createdBy: input.userId,
      revokedAt: null,
      revokedBy: null,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId: input.companyId,
      userId: input.userId,
      action: "apikey.created",
      resourceType: "apikey",
      resourceId: apiKeyRecord.id,
      metadata: {
        name: input.name,
        environment: input.environment,
        scopes: input.scopes,
      },
    });

    // Return the plain API key (only time it's shown)
    return {
      apiKey, // Plain text key - show to user immediately
      apiKeyRecord, // Database record (without plain key)
    };
  }

  /**
   * Hash an API key for secure storage
   */
  private static hashApiKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
  }

  /**
   * Validate an API key and return the associated record
   */
  static async validateApiKey(apiKey: string) {
    await connectDB();

    // Hash the provided key
    const keyHash = this.hashApiKey(apiKey);

    // Find the API key record
    const apiKeyRecord = await ApiKey.findByKeyHash(keyHash);

    if (!apiKeyRecord) {
      throw Errors.unauthorized("Invalid API key");
    }

    // Check if key is active
    if (!apiKeyRecord.isActive()) {
      if (apiKeyRecord.status === "revoked") {
        throw Errors.unauthorized("API key has been revoked");
      }
      if (apiKeyRecord.isExpired()) {
        throw Errors.unauthorized("API key has expired");
      }
      throw Errors.unauthorized("API key is inactive");
    }

    // Update last used timestamp
    apiKeyRecord.lastUsedAt = new Date();
    await apiKeyRecord.save();

    return apiKeyRecord;
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(companyId: string, apiKeyId: string, userId: string) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Find the API key
    const apiKeyRecord = await ApiKey.findOne({ id: apiKeyId, companyId });
    if (!apiKeyRecord) {
      throw Errors.notFound("API key");
    }

    if (apiKeyRecord.status === "revoked") {
      throw Errors.badRequest("API key is already revoked");
    }

    // Revoke the key
    apiKeyRecord.status = "revoked";
    apiKeyRecord.revokedAt = new Date();
    apiKeyRecord.revokedBy = userId;
    await apiKeyRecord.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "apikey.revoked",
      resourceType: "apikey",
      resourceId: apiKeyRecord.id,
      metadata: {
        name: apiKeyRecord.name,
        revokedAt: apiKeyRecord.revokedAt,
      },
    });

    return apiKeyRecord;
  }

  /**
   * Delete an API key (only revoked keys can be deleted)
   */
  static async deleteApiKey(companyId: string, apiKeyId: string, userId: string) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Find the API key
    const apiKeyRecord = await ApiKey.findOne({ id: apiKeyId, companyId });
    if (!apiKeyRecord) {
      throw Errors.notFound("API key");
    }

    // Only allow deletion of revoked keys
    if (apiKeyRecord.status !== "revoked") {
      throw Errors.badRequest("Only revoked API keys can be deleted. Please revoke the key first.");
    }

    // Create audit log before deletion
    await AuditLog.createLog({
      companyId,
      userId,
      action: "apikey.deleted",
      resourceType: "apikey",
      resourceId: apiKeyRecord.id,
      metadata: {
        name: apiKeyRecord.name,
        keyPrefix: apiKeyRecord.keyPrefix,
        deletedAt: new Date(),
      },
    });

    // Delete the key
    await ApiKey.deleteOne({ id: apiKeyId, companyId });

    return { success: true, message: "API key deleted successfully" };
  }

  /**
   * List API keys for a company
   */
  static async listApiKeys(companyId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const apiKeys = await ApiKey.findByCompany(companyId);

    return apiKeys;
  }

  /**
   * Get API key by ID
   */
  static async getApiKey(companyId: string, apiKeyId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const apiKey = await ApiKey.findOne({ id: apiKeyId, companyId });
    if (!apiKey) {
      throw Errors.notFound("API key");
    }

    return apiKey;
  }

  /**
   * Check if API key has required scope
   */
  static hasRequiredScope(apiKey: { scopes: string[] }, requiredScope: string): boolean {
    // Check for wildcard scope
    if (apiKey.scopes.includes("*")) {
      return true;
    }

    // Check for exact scope match
    if (apiKey.scopes.includes(requiredScope)) {
      return true;
    }

    // Check for resource-level wildcard (e.g., "orders:*" matches "orders:read")
    const [resource, action] = requiredScope.split(":");
    const resourceWildcard = `${resource}:*`;
    if (apiKey.scopes.includes(resourceWildcard)) {
      return true;
    }

    return false;
  }

  /**
   * Get available scopes
   */
  static getAvailableScopes() {
    return [
      // Orders
      { scope: "orders:read", description: "Read orders" },
      { scope: "orders:write", description: "Create orders" },
      { scope: "orders:fulfill", description: "Fulfill orders" },
      { scope: "orders:refund", description: "Refund orders" },

      // Inventory
      { scope: "inventory:read", description: "Read inventory" },
      { scope: "inventory:write", description: "Add inventory" },

      // Listings
      { scope: "listings:read", description: "Read listings" },
      { scope: "listings:write", description: "Create and update listings" },

      // Customers
      { scope: "customers:read", description: "Read customers" },
      { scope: "customers:write", description: "Create and update customers" },

      // Webhooks
      { scope: "webhooks:read", description: "Read webhook configurations" },
      { scope: "webhooks:write", description: "Manage webhooks" },

      // Full access
      { scope: "*", description: "Full API access (use with caution)" },
    ];
  }
}
