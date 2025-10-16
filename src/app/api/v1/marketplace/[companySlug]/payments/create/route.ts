/**
 * POST /api/v1/marketplace/:companySlug/payments/create
 * Create a payment intent for marketplace purchase
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import Customer from "@/lib/db/models/Customer";
import Listing from "@/lib/db/models/Listing";
import Order from "@/lib/db/models/Order";
import { PGPayService } from "@/lib/services/pgpay.service";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

const createPaymentSchema = z.object({
  provider: z.enum(["pgpay", "stripe", "paypal"]),
  amount: z.number(),
  currency: z.string().default("USD"),
  listingId: z.string(),
  denomination: z.number(),
  quantity: z.number().min(1),
  customerEmail: z.string().email(),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
});

/**
 * POST /api/v1/marketplace/:companySlug/payments/create
 * Create a payment for a marketplace purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;

    await connectDB();

    // Get company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      throw Errors.notFound("Company", companySlug);
    }

    // Parse and validate request body
    const body = await request.json();
    const input = createPaymentSchema.parse(body);

    // Get listing
    const listing = await Listing.findOne({
      id: input.listingId,
      companyId: company.id,
      status: "active",
    });
    if (!listing) {
      throw Errors.notFound("Listing", input.listingId);
    }

    // Validate denomination
    if (!listing.denominations.includes(input.denomination)) {
      throw Errors.badRequest("Invalid denomination for this listing");
    }

    // Get payment provider configuration
    const providerConfig = await PaymentProviderConfig.findOne({
      companyId: company.id,
      provider: input.provider,
      enabled: true,
      status: "connected",
    }).select("+userId"); // Include userId for PGPay

    if (!providerConfig) {
      throw Errors.badRequest(
        `Payment provider ${input.provider} is not configured or enabled for this company`
      );
    }

    // Find or create customer
    let customer = await Customer.findByEmail(company.id, input.customerEmail);
    if (!customer) {
      customer = await Customer.create({
        companyId: company.id,
        email: input.customerEmail.toLowerCase(),
        name: `${input.customerFirstName} ${input.customerLastName}`,
        phone: null,
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchaseAt: null,
        userId: null,
        createdBy: "marketplace", // System-created customer
      });
    }

    // Calculate pricing
    const cardValue = input.denomination * input.quantity;
    const discount = cardValue * (listing.discountPercentage / 100);
    const subtotal = cardValue - discount;
    const sellerFee = subtotal * (listing.sellerFeePercentage / 100) + listing.sellerFeeFixed;
    const total = subtotal + sellerFee;

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const order = await Order.create({
      id: orderId,
      companyId: company.id,
      listingId: listing.id,
      listingTitle: listing.title,
      brand: listing.brand,
      denomination: input.denomination,
      quantity: input.quantity,
      pricePerUnit: input.denomination,
      discountPercentage: listing.discountPercentage,
      subtotal: cardValue,
      discount,
      total,
      currency: input.currency,
      customerEmail: input.customerEmail.toLowerCase(),
      customerName: `${input.customerFirstName} ${input.customerLastName}`,
      customerId: customer.id,
      paymentMethod: input.provider,
      paymentIntentId: null, // Will be set after payment
      paymentStatus: "pending",
      paidAt: null,
      fulfillmentStatus: "pending",
      fulfilledAt: null,
      fulfilledBy: null,
      giftCardCodes: null,
      deliveryMethod: "email",
      deliveryEmail: input.customerEmail.toLowerCase(),
      deliveredAt: null,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
      notes: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Get success and error URLs
    // Note: Don't add query params here - PGPay will append them with '?'
    const baseUrl = request.headers.get("origin") || "http://localhost:3001";
    const successUrl = `${baseUrl}/marketplace/${companySlug}/payment/success`;
    const errorUrl = `${baseUrl}/marketplace/${companySlug}/payment/error`;

    // Handle different payment providers
    if (input.provider === "pgpay") {
      if (!providerConfig.userId) {
        throw Errors.badRequest("PGPay User ID is not configured");
      }

      // Create PGPay payment
      const payment = await PGPayService.createPayment({
        userID: providerConfig.userId,
        amount: total,
        currency: input.currency,
        orderId,
        customerEmail: input.customerEmail,
        customerFirstName: input.customerFirstName,
        customerLastName: input.customerLastName,
        successUrl,
        errorUrl,
      });

      // Update order with payment intent ID
      order.paymentIntentId = payment.token;
      order.paymentStatus = "processing";
      await order.save();

      return NextResponse.json(
        {
          data: {
            provider: "pgpay",
            token: payment.token,
            redirectUrl: payment.redirectUrl,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
          },
          meta: {
            message: "Payment created successfully",
          },
        },
        {
          status: 200,
          headers: {
            "X-API-Version": "v1",
          },
        }
      );
    }

    // Other payment providers can be added here
    throw Errors.badRequest(`Payment provider ${input.provider} is not yet implemented`);
  } catch (error) {
    const appError = toAppError(error);

    return NextResponse.json(
      {
        error: appError.toJSON(),
      },
      {
        status: appError.statusCode,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  }
}
