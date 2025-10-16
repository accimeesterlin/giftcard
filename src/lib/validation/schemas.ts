/**
 * Zod validation schemas for API requests and data validation
 * Following AGENTS.md guidelines - all inputs must be validated with Zod
 */

import { z } from "zod";
import {
  CompanyRole,
  KYBStatus,
  MembershipStatus,
  PaymentProvider,
} from "@/types";

// ============================================================================
// Company Schemas
// ============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  legalName: z.string().min(2).max(200).optional(),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  currency: z.string().length(3), // ISO 4217
  timezone: z.string().min(3).max(50),
  supportEmail: z.string().email().optional(),
});

export const updateCompanySchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  logo: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  supportEmail: z.string().email().optional(),
  allowedPaymentMethods: z.array(z.enum([
    PaymentProvider.STRIPE,
    PaymentProvider.PAYPAL,
    PaymentProvider.CRYPTO,
    PaymentProvider.PGPAY,
  ])).optional(),
});

export const companySlugSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

// ============================================================================
// Membership Schemas
// ============================================================================

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    CompanyRole.ADMIN,
    CompanyRole.MANAGER,
    CompanyRole.AGENT,
    CompanyRole.VIEWER,
  ]),
  message: z.string().max(500).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([
    CompanyRole.ADMIN,
    CompanyRole.MANAGER,
    CompanyRole.AGENT,
    CompanyRole.VIEWER,
  ]),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

// ============================================================================
// User Schemas
// ============================================================================

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
  companyName: z.string().min(2).max(100).optional(), // For first company
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().optional().nullable(),
});

// ============================================================================
// KYB/KYC Schemas
// ============================================================================

export const submitKYBSchema = z.object({
  companyId: z.string().min(1),
  businessRegistrationNumber: z.string().min(1).max(100),
  taxId: z.string().min(1).max(100),
  beneficialOwners: z.array(
    z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      ownershipPercentage: z.number().min(0).max(100),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
  ).min(1),
  businessAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
  }),
  documents: z.array(
    z.object({
      type: z.enum(["registration", "tax_certificate", "id", "proof_of_address"]),
      url: z.string().url(),
    })
  ).min(1),
});

export const submitKYCSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ssn: z.string().optional(), // Last 4 digits only
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
  }),
  idDocument: z.object({
    type: z.enum(["passport", "drivers_license", "national_id"]),
    number: z.string().min(1),
    frontImageUrl: z.string().url(),
    backImageUrl: z.string().url().optional(),
  }),
});

// ============================================================================
// Payment Settings Schemas
// ============================================================================

export const connectStripeSchema = z.object({
  authorizationCode: z.string().min(1),
});

export const updatePaymentSettingsSchema = z.object({
  allowedPaymentMethods: z.array(z.enum([
    PaymentProvider.STRIPE,
    PaymentProvider.PAYPAL,
    PaymentProvider.CRYPTO,
    PaymentProvider.PGPAY,
  ])),
});

export const connectReloadlySchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

// ============================================================================
// Listing Schemas (company-scoped)
// ============================================================================

export const createListingSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().min(1).max(100),
  cardType: z.enum(["digital", "physical"]),
  category: z.string().min(1).max(50),
  denominations: z.array(z.number().positive()).min(1),
  discountPercentage: z.number().min(0).max(100).default(0),
  sellerFeePercentage: z.number().min(0).max(100).default(0),
  sellerFeeFixed: z.number().min(0).default(0),
  currency: z.string().length(3).toUpperCase(),
  countries: z.array(z.string().length(2)).min(1),
  imageUrl: z.string().url().optional().nullable(),
  brandLogoUrl: z.string().url().optional().nullable(),
  minPurchaseAmount: z.number().positive().optional().nullable(),
  maxPurchaseAmount: z.number().positive().optional().nullable(),
  autoFulfill: z.boolean().default(true),
  termsAndConditions: z.string().max(5000).optional().nullable(),
});

export const updateListingSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  cardType: z.enum(["digital", "physical"]).optional(),
  category: z.string().min(1).max(50).optional(),
  denominations: z.array(z.number().positive()).min(1).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  sellerFeePercentage: z.number().min(0).max(100).optional(),
  sellerFeeFixed: z.number().min(0).optional(),
  countries: z.array(z.string().length(2)).min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  brandLogoUrl: z.string().url().optional().nullable(),
  status: z.enum(["draft", "active", "inactive", "out_of_stock"]).optional(),
  minPurchaseAmount: z.number().positive().optional().nullable(),
  maxPurchaseAmount: z.number().positive().optional().nullable(),
  autoFulfill: z.boolean().optional(),
  termsAndConditions: z.string().max(5000).optional().nullable(),
});

export const bulkUploadCodesSchema = z.object({
  listingId: z.string().min(1),
  denomination: z.number().positive(),
  codes: z.array(
    z.object({
      code: z.string().min(1).max(100),
      pin: z.string().max(50).optional().nullable(),
      serialNumber: z.string().max(100).optional().nullable(),
      expiresAt: z.string().datetime().optional().nullable(),
    })
  ).min(1).max(1000), // Limit bulk uploads to 1000 at a time
  source: z.enum(["manual", "reloadly", "bulk_upload", "api"]).default("bulk_upload"),
});

export const listingFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["draft", "active", "inactive", "out_of_stock"]).optional(),
  brand: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  cardType: z.enum(["digital", "physical"]).optional(),
  search: z.string().max(100).optional(),
});

// ============================================================================
// Order Schemas
// ============================================================================

export const createOrderSchema = z.object({
  listingId: z.string().min(1),
  denomination: z.number().positive(),
  quantity: z.coerce.number().int().positive().min(1).max(100), // Max 100 cards per order
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(100).optional(),
  paymentMethod: z.enum(["stripe", "paypal", "crypto", "pgpay"]),
  deliveryEmail: z.string().email().optional(), // If different from customerEmail
});

export const fulfillOrderSchema = z.object({
  orderId: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export const orderFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  paymentStatus: z.enum(["pending", "processing", "completed", "failed", "refunded", "disputed"]).optional(),
  fulfillmentStatus: z.enum(["pending", "fulfilled", "failed"]).optional(),
  customerEmail: z.string().email().optional(),
  brand: z.string().max(100).optional(),
  search: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Pagination & Filtering Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const companyFilterSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  status: z.enum([KYBStatus.UNVERIFIED, KYBStatus.PENDING, KYBStatus.VERIFIED, KYBStatus.FAILED]).optional(),
});

export const memberFilterSchema = paginationSchema.extend({
  role: z.enum([
    CompanyRole.OWNER,
    CompanyRole.ADMIN,
    CompanyRole.MANAGER,
    CompanyRole.AGENT,
    CompanyRole.VIEWER,
  ]).optional(),
  status: z.enum([
    MembershipStatus.PENDING,
    MembershipStatus.ACTIVE,
    MembershipStatus.SUSPENDED,
    MembershipStatus.REVOKED,
  ]).optional(),
});

// ============================================================================
// Audit Log Schema
// ============================================================================

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  resourceType: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Customer Schemas
// ============================================================================

export const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export const customerFilterSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type SubmitKYBInput = z.infer<typeof submitKYBSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type BulkUploadCodesInput = z.infer<typeof bulkUploadCodesSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type FulfillOrderInput = z.infer<typeof fulfillOrderSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
