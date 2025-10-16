/**
 * Custom error handling
 * Following AGENTS.md: Use AppError(code, httpStatus, message, details?) only
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

// Common error factory functions
export const Errors = {
  // Authentication & Authorization
  unauthorized(message = "Unauthorized", details?: Record<string, unknown>) {
    return new AppError("UNAUTHORIZED", 401, message, details);
  },

  forbidden(message = "Forbidden", details?: Record<string, unknown>) {
    return new AppError("FORBIDDEN", 403, message, details);
  },

  notAuthenticated(message = "Authentication required") {
    return new AppError("NOT_AUTHENTICATED", 401, message);
  },

  // Multi-tenancy errors
  companyNotFound(companyId: string) {
    return new AppError("COMPANY_NOT_FOUND", 404, "Company not found", { companyId });
  },

  companyAccessDenied(companyId: string) {
    return new AppError(
      "COMPANY_ACCESS_DENIED",
      403,
      "You do not have access to this company",
      { companyId }
    );
  },

  insufficientPermissions(required: string, companyId: string) {
    return new AppError("INSUFFICIENT_PERMISSIONS", 403, "Insufficient permissions", {
      required,
      companyId,
    });
  },

  membershipNotFound() {
    return new AppError("MEMBERSHIP_NOT_FOUND", 404, "Membership not found");
  },

  // Resource errors
  notFound(resource: string, id?: string) {
    return new AppError("NOT_FOUND", 404, `${resource} not found`, id ? { id } : undefined);
  },

  alreadyExists(resource: string, details?: Record<string, unknown>) {
    return new AppError("ALREADY_EXISTS", 409, `${resource} already exists`, details);
  },

  // Validation errors
  validationError(message: string, details?: Record<string, unknown>) {
    return new AppError("VALIDATION_ERROR", 400, message, details);
  },

  badRequest(message: string, details?: Record<string, unknown>) {
    return new AppError("BAD_REQUEST", 400, message, details);
  },

  // Business logic errors
  kybRequired(companyId: string) {
    return new AppError(
      "KYB_REQUIRED",
      403,
      "Business verification required for this operation",
      { companyId }
    );
  },

  kycRequired() {
    return new AppError("KYC_REQUIRED", 403, "Identity verification required for this operation");
  },

  payoutBlocked(reason: string, companyId: string) {
    return new AppError("PAYOUT_BLOCKED", 403, "Payout blocked", { reason, companyId });
  },

  dailyLimitExceeded(companyId: string, limit: number) {
    return new AppError("DAILY_LIMIT_EXCEEDED", 429, "Daily GMV limit exceeded", {
      companyId,
      limit,
    });
  },

  // Payment errors
  paymentFailed(message: string, details?: Record<string, unknown>) {
    return new AppError("PAYMENT_FAILED", 402, message, details);
  },

  providerError(provider: string, message: string) {
    return new AppError("PROVIDER_ERROR", 502, `${provider} error: ${message}`, { provider });
  },

  // System errors
  internalError(message = "Internal server error", details?: Record<string, unknown>) {
    return new AppError("INTERNAL_ERROR", 500, message, details);
  },

  serviceUnavailable(service: string) {
    return new AppError("SERVICE_UNAVAILABLE", 503, `${service} is currently unavailable`, {
      service,
    });
  },

  // Rate limiting
  tooManyRequests(message = "Too many requests", details?: Record<string, unknown>) {
    return new AppError("TOO_MANY_REQUESTS", 429, message, details);
  },

  // Invitation errors
  invitationExpired() {
    return new AppError("INVITATION_EXPIRED", 410, "Invitation has expired");
  },

  invitationInvalid() {
    return new AppError("INVITATION_INVALID", 400, "Invalid invitation token");
  },
};

/**
 * Convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", 500, error.message, {
      originalError: error.name,
    });
  }

  return new AppError("INTERNAL_ERROR", 500, "An unexpected error occurred");
}
