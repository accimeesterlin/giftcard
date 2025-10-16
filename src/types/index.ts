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
  sellerFeePercentage: number; // Percentage fee charged by seller, e.g., 2 means 2% markup
  sellerFeeFixed: number; // Fixed fee amount charged by seller
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

// ============================================================================
// Order Types
// ============================================================================

export const OrderStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  DISPUTED: "disputed",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const FulfillmentStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  FAILED: "failed",
} as const;

export type FulfillmentStatusType = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];

export const PaymentMethod = {
  STRIPE: "stripe",
  PAYPAL: "paypal",
  CRYPTO: "crypto",
  PGPAY: "pgpay",
} as const;

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface Order {
  id: string;
  companyId: string; // Multi-tenant isolation

  // Listing reference
  listingId: string;
  listingTitle: string; // Cached for display
  brand: string; // Cached for display

  // Purchase details
  denomination: number;
  quantity: number;
  pricePerUnit: number; // Final price after discount
  discountPercentage: number; // Applied discount
  subtotal: number; // denomination * quantity
  discount: number; // Calculated discount amount
  total: number; // Amount customer paid

  currency: string;

  // Customer info
  customerEmail: string;
  customerName: string | null;
  customerId: string | null; // User ID if registered

  // Payment
  paymentMethod: PaymentMethodType;
  paymentIntentId: string | null; // Stripe/PayPal transaction ID
  paymentStatus: OrderStatusType;
  paidAt: Date | null;

  // Fulfillment
  fulfillmentStatus: FulfillmentStatusType;
  fulfilledAt: Date | null;
  fulfilledBy: string | null; // User ID of agent/manager who fulfilled
  giftCardCodes: Array<{
    inventoryId: string;
    code: string; // Decrypted for delivery
    pin: string | null;
    serialNumber: string | null;
  }> | null;

  // Delivery
  deliveryMethod: "email" | "api" | "manual";
  deliveryEmail: string | null;
  deliveredAt: Date | null;

  // Metadata
  ipAddress: string | null;
  userAgent: string | null;
  notes: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null; // For pending payments
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string;
  companyId: string; // Multi-tenant isolation

  // Basic info
  email: string;
  name: string | null;
  phone: string | null;

  // Purchase stats
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;

  // User link
  userId: string | null; // Link to registered user if applicable

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID who added the customer
}

// ============================================================================
// Payment Provider Types
// ============================================================================

export const PaymentProviderStatus = {
  DISCONNECTED: "disconnected",
  CONNECTED: "connected",
  PENDING: "pending",
  ERROR: "error",
} as const;

export type PaymentProviderStatusType = (typeof PaymentProviderStatus)[keyof typeof PaymentProviderStatus];

export interface PaymentProviderConfig {
  id: string;
  companyId: string;
  provider: PaymentProviderType;
  status: PaymentProviderStatusType;

  // Provider-specific credentials (encrypted)
  publicKey: string | null; // Stripe publishable key, PayPal client ID
  secretKey: string | null; // Stripe secret key, PayPal client secret (encrypted)
  webhookSecret: string | null; // For webhook signature verification (encrypted)

  // Provider-specific settings
  accountId: string | null; // Stripe Connect account ID, PayPal merchant ID
  walletAddress: string | null; // For crypto payments

  // Configuration
  testMode: boolean;
  enabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  lastTestedAt: Date | null;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  companyId: string;
  provider: PaymentProviderType;

  // Amount details
  amount: number;
  currency: string;

  // Provider reference
  providerIntentId: string; // Stripe payment intent ID, PayPal order ID
  providerStatus: string; // Provider-specific status

  // Customer info
  customerEmail: string;
  customerName: string | null;

  // Status
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";

  // URLs (for redirect-based flows)
  successUrl: string | null;
  cancelUrl: string | null;

  // Metadata
  metadata: Record<string, unknown>;
  errorMessage: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface PaymentRefund {
  id: string;
  orderId: string;
  paymentIntentId: string;
  companyId: string;
  provider: PaymentProviderType;

  // Refund details
  amount: number;
  currency: string;
  reason: string | null;

  // Provider reference
  providerRefundId: string; // Stripe refund ID, PayPal refund ID
  providerStatus: string;

  // Status
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";

  // Initiated by
  requestedBy: string; // User ID

  // Metadata
  metadata: Record<string, unknown>;
  errorMessage: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

// ============================================================================
// API Key & Webhook Types
// ============================================================================

export const ApiKeyStatus = {
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired",
} as const;

export type ApiKeyStatusType = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];

export interface ApiKey {
  id: string;
  companyId: string;
  name: string; // User-friendly name for the key
  description: string | null;

  // Key details
  keyPrefix: string; // First 8 chars of key for display (e.g., "gck_live_")
  keyHash: string; // Hashed API key (never store plain text)
  lastUsedAt: Date | null;

  // Permissions & Scopes
  scopes: string[]; // e.g., ["orders:read", "orders:write", "inventory:read"]
  environment: "test" | "live";

  // Rate limiting
  rateLimit: number; // Requests per minute
  rateLimitWindow: number; // Window in seconds

  // Status
  status: ApiKeyStatusType;
  expiresAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  revokedAt: Date | null;
  revokedBy: string | null;
}

export const WebhookEventType = {
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  ORDER_FULFILLED: "order.fulfilled",
  ORDER_FAILED: "order.failed",
  ORDER_REFUNDED: "order.refunded",
  INVENTORY_LOW: "inventory.low",
  INVENTORY_OUT: "inventory.out",
} as const;

export type WebhookEventTypeType = (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const WebhookStatus = {
  ACTIVE: "active",
  DISABLED: "disabled",
  FAILED: "failed",
} as const;

export type WebhookStatusType = (typeof WebhookStatus)[keyof typeof WebhookStatus];

export interface WebhookEndpoint {
  id: string;
  companyId: string;
  url: string;
  description: string | null;

  // Configuration
  events: WebhookEventTypeType[]; // Events to subscribe to
  secret: string; // For HMAC signature verification
  enabled: boolean;
  status: WebhookStatusType;

  // Stats
  lastTriggeredAt: Date | null;
  successCount: number;
  failureCount: number;
  lastFailureAt: Date | null;
  lastFailureReason: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

export interface WebhookDelivery {
  id: string;
  webhookEndpointId: string;
  companyId: string;

  // Event details
  event: WebhookEventTypeType;
  payload: Record<string, unknown>;

  // Delivery details
  url: string;
  httpMethod: "POST";
  headers: Record<string, string>;

  // Response
  statusCode: number | null;
  responseBody: string | null;
  responseTime: number | null; // milliseconds

  // Status
  status: "pending" | "success" | "failed" | "retrying";
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date | null;

  // Error tracking
  errorMessage: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
}
