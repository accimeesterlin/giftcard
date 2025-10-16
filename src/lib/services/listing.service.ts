/**
 * Listing Service
 * Business logic for gift card listings and inventory (company-scoped)
 */

import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import Listing from "@/lib/db/models/Listing";
import Inventory from "@/lib/db/models/Inventory";
import Company from "@/lib/db/models/Company";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { Errors } from "@/lib/errors";
import type {
  CreateListingInput,
  UpdateListingInput,
  BulkUploadCodesInput,
  ListingFilterInput,
} from "@/lib/validation/schemas";

export class ListingService {
  /**
   * Create a new listing
   */
  static async create(companyId: string, userId: string, input: CreateListingInput) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Verify company exists
    const company = await Company.findOne({ id: companyId });
    if (!company) {
      throw Errors.companyNotFound(companyId);
    }

    // Create listing
    const listing = await Listing.create({
      id: `listing_${nanoid(16)}`,
      companyId,
      title: input.title,
      description: input.description || null,
      brand: input.brand,
      cardType: input.cardType,
      category: input.category,
      denominations: input.denominations,
      discountPercentage: input.discountPercentage || 0,
      sellerFeePercentage: input.sellerFeePercentage || 0,
      sellerFeeFixed: input.sellerFeeFixed || 0,
      currency: input.currency.toUpperCase(),
      countries: input.countries,
      imageUrl: input.imageUrl || null,
      brandLogoUrl: input.brandLogoUrl || null,
      status: "draft",
      totalStock: 0,
      soldCount: 0,
      minPurchaseAmount: input.minPurchaseAmount || null,
      maxPurchaseAmount: input.maxPurchaseAmount || null,
      autoFulfill: input.autoFulfill !== undefined ? input.autoFulfill : true,
      termsAndConditions: input.termsAndConditions || null,
      createdBy: userId,
      updatedBy: null,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "listing.created",
      resourceType: "listing",
      resourceId: listing.id,
      metadata: {
        brand: listing.brand,
        title: listing.title,
      },
    });

    return listing;
  }

  /**
   * Update a listing
   */
  static async update(
    companyId: string,
    listingId: string,
    userId: string,
    updates: UpdateListingInput
  ) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get listing
    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};

    // Apply updates
    if (updates.title !== undefined) {
      changes.title = { from: listing.title, to: updates.title };
      listing.title = updates.title;
    }

    if (updates.description !== undefined) {
      changes.description = { from: listing.description, to: updates.description };
      listing.description = updates.description;
    }

    if (updates.cardType !== undefined) {
      changes.cardType = { from: listing.cardType, to: updates.cardType };
      listing.cardType = updates.cardType;
    }

    if (updates.category !== undefined) {
      changes.category = { from: listing.category, to: updates.category };
      listing.category = updates.category;
    }

    if (updates.denominations !== undefined) {
      changes.denominations = { from: listing.denominations, to: updates.denominations };
      listing.denominations = updates.denominations;
    }

    if (updates.discountPercentage !== undefined) {
      changes.discountPercentage = {
        from: listing.discountPercentage,
        to: updates.discountPercentage,
      };
      listing.discountPercentage = updates.discountPercentage;
    }

    if (updates.sellerFeePercentage !== undefined) {
      changes.sellerFeePercentage = {
        from: listing.sellerFeePercentage,
        to: updates.sellerFeePercentage,
      };
      listing.sellerFeePercentage = updates.sellerFeePercentage;
    }

    if (updates.sellerFeeFixed !== undefined) {
      changes.sellerFeeFixed = {
        from: listing.sellerFeeFixed,
        to: updates.sellerFeeFixed,
      };
      listing.sellerFeeFixed = updates.sellerFeeFixed;
    }

    if (updates.countries !== undefined) {
      changes.countries = { from: listing.countries, to: updates.countries };
      listing.countries = updates.countries;
    }

    if (updates.imageUrl !== undefined) {
      changes.imageUrl = { from: listing.imageUrl, to: updates.imageUrl };
      listing.imageUrl = updates.imageUrl;
    }

    if (updates.brandLogoUrl !== undefined) {
      changes.brandLogoUrl = { from: listing.brandLogoUrl, to: updates.brandLogoUrl };
      listing.brandLogoUrl = updates.brandLogoUrl;
    }

    if (updates.status !== undefined) {
      changes.status = { from: listing.status, to: updates.status };
      listing.status = updates.status;
    }

    if (updates.minPurchaseAmount !== undefined) {
      changes.minPurchaseAmount = {
        from: listing.minPurchaseAmount,
        to: updates.minPurchaseAmount,
      };
      listing.minPurchaseAmount = updates.minPurchaseAmount;
    }

    if (updates.maxPurchaseAmount !== undefined) {
      changes.maxPurchaseAmount = {
        from: listing.maxPurchaseAmount,
        to: updates.maxPurchaseAmount,
      };
      listing.maxPurchaseAmount = updates.maxPurchaseAmount;
    }

    if (updates.autoFulfill !== undefined) {
      changes.autoFulfill = { from: listing.autoFulfill, to: updates.autoFulfill };
      listing.autoFulfill = updates.autoFulfill;
    }

    if (updates.termsAndConditions !== undefined) {
      changes.termsAndConditions = {
        from: listing.termsAndConditions,
        to: updates.termsAndConditions,
      };
      listing.termsAndConditions = updates.termsAndConditions;
    }

    listing.updatedBy = userId;
    await listing.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "listing.updated",
      resourceType: "listing",
      resourceId: listing.id,
      changes,
    });

    return listing;
  }

  /**
   * Get listing by ID
   */
  static async getById(companyId: string, listingId: string) {
    await connectDB();

    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    return listing;
  }

  /**
   * Get all listings for a company with filtering
   */
  static async getByCompany(
    companyId: string,
    userId: string,
    filters?: ListingFilterInput
  ) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Build query
    const query: any = { companyId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.brand) {
      query.brand = new RegExp(filters.brand, "i");
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.cardType) {
      query.cardType = filters.cardType;
    }

    if (filters?.search) {
      query.$or = [
        { title: new RegExp(filters.search, "i") },
        { brand: new RegExp(filters.search, "i") },
        { description: new RegExp(filters.search, "i") },
      ];
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    return {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > page * limit,
      },
    };
  }

  /**
   * Delete a listing
   */
  static async delete(companyId: string, listingId: string, userId: string) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get listing
    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Check if there's inventory
    const inventoryCount = await Inventory.countDocuments({ listingId, status: "available" });

    if (inventoryCount > 0) {
      throw Errors.badRequest(
        "Cannot delete listing with available inventory. Please remove inventory first."
      );
    }

    // Delete listing
    await Listing.deleteOne({ id: listingId });

    // Delete any sold/invalid inventory
    await Inventory.deleteMany({ listingId });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "listing.deleted",
      resourceType: "listing",
      resourceId: listing.id,
      metadata: {
        brand: listing.brand,
        title: listing.title,
      },
    });

    return { success: true };
  }

  /**
   * Add inventory codes to a listing (bulk upload)
   */
  static async addInventory(companyId: string, userId: string, input: BulkUploadCodesInput) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get listing
    const listing = await Listing.findOne({ id: input.listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Verify denomination is valid
    if (!listing.denominations.includes(input.denomination)) {
      throw Errors.badRequest(
        `Denomination ${input.denomination} is not valid for this listing`
      );
    }

    // Create inventory items
    const inventoryItems = await Promise.all(
      input.codes.map(async (codeData) => {
        return await Inventory.create({
          id: `inv_${nanoid(16)}`,
          companyId,
          listingId: input.listingId,
          denomination: input.denomination,
          code: codeData.code, // TODO: Encrypt in production
          pin: codeData.pin || null, // TODO: Encrypt in production
          serialNumber: codeData.serialNumber || null,
          status: "available",
          source: input.source,
          orderId: null,
          soldAt: null,
          soldTo: null,
          expiresAt: codeData.expiresAt ? new Date(codeData.expiresAt) : null,
          uploadedBy: userId,
        });
      })
    );

    // Update listing stock count
    listing.totalStock += inventoryItems.length;
    // Note: We don't automatically change listing status when adding inventory
    // Let the seller manually activate the listing when ready
    await listing.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "inventory.bulk_uploaded",
      resourceType: "inventory",
      resourceId: input.listingId,
      metadata: {
        listingId: input.listingId,
        denomination: input.denomination,
        count: inventoryItems.length,
        source: input.source,
      },
    });

    return {
      uploaded: inventoryItems.length,
      listing: listing,
    };
  }

  /**
   * Get inventory for a listing
   */
  static async getInventory(companyId: string, listingId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Verify listing exists and belongs to company
    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Get inventory summary (grouped by denomination and status)
    const inventory = await Inventory.aggregate([
      { $match: { listingId } },
      {
        $group: {
          _id: { denomination: "$denomination", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.denomination",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      listing,
      inventory: inventory.map((item) => ({
        denomination: item._id,
        total: item.total,
        byStatus: item.statuses.reduce(
          (acc: Record<string, number>, s: { status: string; count: number }) => {
            acc[s.status] = s.count;
            return acc;
          },
          {}
        ),
      })),
    };
  }

  /**
   * Get inventory summary for a listing (simplified for UI)
   */
  static async getInventorySummary(companyId: string, listingId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Verify listing exists and belongs to company
    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Get inventory summary grouped by denomination
    const inventory = await Inventory.aggregate([
      { $match: { listingId } },
      {
        $group: {
          _id: { denomination: "$denomination", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.denomination",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Transform to simple summary format
    return inventory.map((item) => {
      const statusMap = item.statuses.reduce(
        (acc: Record<string, number>, s: { status: string; count: number }) => {
          acc[s.status] = s.count;
          return acc;
        },
        {}
      );

      return {
        denomination: item._id,
        available: statusMap.available || 0,
        sold: statusMap.sold || 0,
        reserved: statusMap.reserved || 0,
        total: Object.values(statusMap).reduce((sum: number, count: any) => sum + count, 0),
      };
    });
  }

  /**
   * Get codes by denomination
   */
  static async getCodesByDenomination(
    companyId: string,
    listingId: string,
    denomination: number,
    userId: string,
    options?: { search?: string; page?: number; limit?: number }
  ) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Verify listing exists and belongs to company
    const listing = await Listing.findOne({ id: listingId, companyId });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Build query
    const query: any = {
      listingId,
      denomination,
    };

    // Add search filter if provided
    if (options?.search) {
      query.$or = [
        { code: new RegExp(options.search, "i") },
        { pin: new RegExp(options.search, "i") },
        { serialNumber: new RegExp(options.search, "i") },
      ];
    }

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    // Get codes with code and pin fields explicitly selected
    // Use .lean() to get plain objects and bypass toJSON transform that deletes sensitive fields
    const [codes, total] = await Promise.all([
      Inventory.find(query)
        .select("+code +pin") // Explicitly select fields that have select: false
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Get plain objects instead of Mongoose documents
      Inventory.countDocuments(query),
    ]);

    // Map to clean response format with needed fields
    const cleanedCodes = codes.map((code: any) => ({
      id: code.id,
      code: code.code,
      pin: code.pin,
      serialNumber: code.serialNumber,
      status: code.status,
      soldAt: code.soldAt,
      expiresAt: code.expiresAt,
      createdAt: code.createdAt,
    }));

    return {
      data: cleanedCodes,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > page * limit,
      },
    };
  }

  /**
   * Update a specific code
   */
  static async updateCode(
    companyId: string,
    listingId: string,
    codeId: string,
    updates: { code?: string; pin?: string | null; serialNumber?: string | null },
    userId: string
  ) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get code with code and pin fields explicitly selected
    const code = await Inventory.findOne({ id: codeId, listingId, companyId }).select(
      "+code +pin"
    );

    if (!code) {
      throw Errors.notFound("Code");
    }

    // Only allow editing available codes
    if (code.status !== "available") {
      throw Errors.badRequest("Only available codes can be edited");
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};

    // Apply updates
    if (updates.code !== undefined) {
      changes.code = { from: code.code, to: updates.code };
      code.code = updates.code;
    }

    if (updates.pin !== undefined) {
      changes.pin = { from: code.pin, to: updates.pin };
      code.pin = updates.pin;
    }

    if (updates.serialNumber !== undefined) {
      changes.serialNumber = { from: code.serialNumber, to: updates.serialNumber };
      code.serialNumber = updates.serialNumber;
    }

    await code.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "inventory.code_updated",
      resourceType: "inventory",
      resourceId: code.id,
      changes,
      metadata: {
        listingId,
        denomination: code.denomination,
      },
    });

    // Return plain object with sensitive fields included
    return {
      id: code.id,
      code: code.code,
      pin: code.pin,
      serialNumber: code.serialNumber,
      status: code.status,
      soldAt: code.soldAt,
      expiresAt: code.expiresAt,
      createdAt: code.createdAt,
    };
  }

  /**
   * Delete a specific code
   */
  static async deleteCode(
    companyId: string,
    listingId: string,
    codeId: string,
    userId: string
  ) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get code with code field explicitly selected for audit log
    const code = await Inventory.findOne({ id: codeId, listingId, companyId }).select("+code");

    if (!code) {
      throw Errors.notFound("Code");
    }

    // Only allow deleting available codes
    if (code.status !== "available") {
      throw Errors.badRequest("Only available codes can be deleted");
    }

    // Delete code
    await Inventory.deleteOne({ id: codeId });

    // Update listing stock count
    const listing = await Listing.findOne({ id: listingId, companyId });
    if (listing) {
      listing.totalStock = Math.max(0, listing.totalStock - 1);
      if (listing.totalStock === 0) {
        listing.status = "out_of_stock";
      }
      await listing.save();
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "inventory.code_deleted",
      resourceType: "inventory",
      resourceId: code.id,
      metadata: {
        listingId,
        denomination: code.denomination,
        code: code.code,
      },
    });

    return { success: true };
  }
}
