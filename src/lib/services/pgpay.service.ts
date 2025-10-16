/**
 * PGPay Payment Service
 * Handles PGPay payment creation and verification
 */

import { Errors } from "@/lib/errors";

const PGPAY_BASE_URL = "https://sandbox.pgecom.com/api/pgpay";

interface CreatePaymentParams {
  userID: string;
  amount: number;
  currency?: string;
  orderId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  successUrl?: string;
  errorUrl?: string;
}

interface CreatePaymentResponse {
  token: string;
  redirectUrl: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}

interface VerifyPaymentParams {
  pgPayToken: string;
}

interface VerifyPaymentResponse {
  orderId: string;
  status: string;
  amount: number;
  paymentStatus: string;
  transactionType: string;
  currency?: string;
  customerEmail?: string;
  createdAt?: string;
}

export class PGPayService {
  /**
   * Create a PGPay payment
   * Returns payment token and redirect URL
   */
  static async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    try {
      const response = await fetch(`${PGPAY_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: params.userID,
          amount: params.amount,
          currency: params.currency || "USD",
          orderId: params.orderId,
          customerEmail: params.customerEmail,
          customerFirstName: params.customerFirstName,
          customerLastName: params.customerLastName,
          successUrl: params.successUrl,
          errorUrl: params.errorUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Errors.badRequest(
          errorData.message || `PGPay API error: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        token: data.token,
        redirectUrl: data.redirectUrl,
        orderId: data.orderId || params.orderId || "",
        amount: data.amount || params.amount,
        currency: data.currency || params.currency || "USD",
        status: data.status || "pending",
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("fetch")) {
        throw Errors.externalServiceError("PGPay", "Failed to connect to PGPay service");
      }
      throw error;
    }
  }

  /**
   * Verify a PGPay payment using the token
   * Returns payment verification details
   */
  static async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
    try {
      const response = await fetch(`${PGPAY_BASE_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pgPayToken: params.pgPayToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases
        if (response.status === 400) {
          throw Errors.badRequest(
            errorData.message || "Invalid payment token or order already verified"
          );
        }

        throw Errors.badRequest(
          errorData.message || `PGPay verification failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        orderId: data.orderId,
        status: data.status,
        amount: data.amount,
        paymentStatus: data.paymentStatus,
        transactionType: data.transactionType,
        currency: data.currency,
        customerEmail: data.customerEmail,
        createdAt: data.createdAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("fetch")) {
        throw Errors.externalServiceError("PGPay", "Failed to connect to PGPay service");
      }
      throw error;
    }
  }

  /**
   * Get PGPay redirect URL for a payment token
   */
  static getPaymentUrl(token: string): string {
    return `https://sandbox.pgecom.com/pay/${token}`;
  }
}
