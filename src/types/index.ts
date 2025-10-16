/**
 * Core type definitions for the gift card marketplace
 * Following AGENTS.md guidelines for multi-tenancy and TypeScript strict mode
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export const CompanyRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
  VIEWER: "viewer",
} as const;

export type CompanyRoleType = (typeof CompanyRole)[keyof typeof CompanyRole];

export const MembershipStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REVOKED: "revoked",
} as const;

export type MembershipStatusType = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const KYBStatus = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  VERIFIED: "verified",
  FAILED: "failed",
} as const;

export type KYBStatusType = (typeof KYBStatus)[keyof typeof KYBStatus];

export const PaymentProvider = {
  STRIPE: "stripe",
  PAYPAL: "paypal",
  CRYPTO: "crypto",
  PGPAY: "pgpay",
} as const;

export type PaymentProviderType = (typeof PaymentProvider)[keyof typeof PaymentProvider];

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string | null;
  image: string | null;
  passwordHash: string | null;
  kycStatus: KYBStatusType;
  kycSubmittedAt: Date | null;
  kycVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession extends Omit<User, "passwordHash"> {
  currentCompanyId: string | null;
}

// ============================================================================
// Company Types
// ============================================================================

export interface Company {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  displayName: string;
  logo: string | null;
  bio: string | null;
  country: string;
  currency: string;
  timezone: string;
  supportEmail: string;

  // KYB/Verification
  kybStatus: KYBStatusType;
  kybSubmittedAt: Date | null;
  kybVerifiedAt: Date | null;

  // Payment settings
  allowedPaymentMethods: PaymentProviderType[];
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  paypalMerchantId: string | null;
  cryptoWalletAddress: string | null;
  pgpayMerchantId: string | null;

  // Trust & Risk
  trustTier: "new" | "standard" | "trusted";
  payoutHoldDays: number;
  dailyGmvLimit: number | null;

  // Subscription (optional for SaaS model)
  subscriptionTier: string | null;
  subscriptionStatus: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export interface CompanySettings {
  companyId: string;
  defaultCurrency: string;
  allowedBrands: string[];
  regionPreferences: string[];
  reloadlyEnabled: boolean;
  reloadlyClientId: string | null;
  reloadlyStatus: "disconnected" | "connected" | "error";
  webhookUrl: string | null;
  webhookSecret: string | null;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================================================
// Membership Types
// ============================================================================

export interface CompanyMembership {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRoleType;
  status: MembershipStatusType;

  // Invitation tracking
  invitedBy: string | null; // User ID
  invitedAt: Date | null;
  acceptedAt: Date | null;
  invitationToken: string | null;
  invitationExpiresAt: Date | null;

  // Access control
  permissions: string[]; // Custom permissions beyond role

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ============================================================================
// Permission Helper Types
// ============================================================================

export interface PermissionContext {
  userId: string;
  companyId: string;
  role: CompanyRoleType;
  permissions: string[];
}

export type PermissionCheck = (context: PermissionContext) => boolean;

// ============================================================================
// Listing & Inventory Types
// ============================================================================

export const ListingStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
  OUT_OF_STOCK: "out_of_stock",
} as const;

export type ListingStatusType = (typeof ListingStatus)[keyof typeof ListingStatus];

export const CardType = {
  DIGITAL: "digital",
  PHYSICAL: "physical",
} as const;

export type CardTypeType = (typeof CardType)[keyof typeof CardType];

export interface Listing {
  id: string;
  companyId: string; // Multi-tenant isolation

  // Basic info
  title: string;
  description: string | null;
  brand: string; // e.g., "Amazon", "iTunes", "Netflix"
  cardType: CardTypeType;
  category: string; // e.g., "Entertainment", "Shopping", "Gaming"

  // Pricing & Availability
  denominations: number[]; // Available values, e.g., [10, 25, 50, 100]
  discountPercentage: number; // Discount offered, e.g., 5 means 5% off
  currency: string; // ISO currency code
  countries: string[]; // ISO country codes where available

  // Images
  imageUrl: string | null;
  brandLogoUrl: string | null;

  // Stock & Status
  status: ListingStatusType;
  totalStock: number; // Total inventory count
  soldCount: number; // Number sold

  // Settings
  minPurchaseAmount: number | null;
  maxPurchaseAmount: number | null;
  autoFulfill: boolean; // Auto-send code on purchase
  termsAndConditions: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  updatedBy: string | null;
}

export const InventoryStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
  INVALID: "invalid",
  EXPIRED: "expired",
} as const;

export type InventoryStatusType = (typeof InventoryStatus)[keyof typeof InventoryStatus];

export const InventorySource = {
  MANUAL: "manual", // Manually uploaded
  RELOADLY: "reloadly", // From Reloadly API
  BULK_UPLOAD: "bulk_upload", // CSV/Excel upload
  API: "api", // From external API
} as const;

export type InventorySourceType = (typeof InventorySource)[keyof typeof InventorySource];

export interface Inventory {
  id: string;
  companyId: string; // Multi-tenant isolation
  listingId: string; // Reference to Listing

  // Gift card details
  denomination: number; // Face value
  code: string; // Gift card code (encrypted)
  pin: string | null; // PIN if required (encrypted)
  serialNumber: string | null;

  // Status & tracking
  status: InventoryStatusType;
  source: InventorySourceType;

  // Purchase tracking
  orderId: string | null; // Set when sold
  soldAt: Date | null;
  soldTo: string | null; // User ID or email

  // Expiry
  expiresAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string; // User ID
}
