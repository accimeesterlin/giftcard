/**
 * PayPal Payment Service
 * Handles PayPal order creation, capture, and webhooks
 */

import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import PaymentIntent from "@/lib/db/models/PaymentIntent";
import Order from "@/lib/db/models/Order";
import Listing from "@/lib/db/models/Listing";
import { Errors } from "@/lib/errors";

// PayPal SDK would be imported in production
// import paypal from "@paypal/checkout-server-sdk";

interface CreatePayPalOrderInput {
  companyId: string;
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    payer?: {
      email_address?: string;
      name?: {
        given_name?: string;
        surname?: string;
      };
    };
  };
}

export class PayPalService {
  /**
   * Create a PayPal order
   * In production, this would use the actual PayPal SDK
   */
  static async createOrder(input: CreatePayPalOrderInput) {
    await connectDB();

    // Get PayPal configuration for the company
    const paypalConfig = await PaymentProviderConfig.findOne({
      companyId: input.companyId,
      provider: "paypal",
      enabled: true,
      status: "connected",
    }).select("+secretKey");

    if (!paypalConfig) {
      throw Errors.badRequest(
        "PayPal is not configured for this company. Please configure PayPal in settings."
      );
    }

    // Get order to verify
    const order = await Order.findOne({ id: input.orderId, companyId: input.companyId });
    if (!order) {
      throw Errors.notFound("Order");
    }

    // In production, initialize PayPal SDK with credentials
    /*
    const environment = paypalConfig.testMode
      ? new paypal.core.SandboxEnvironment(paypalConfig.publicKey, paypalConfig.secretKey)
      : new paypal.core.LiveEnvironment(paypalConfig.publicKey, paypalConfig.secretKey);
    const client = new paypal.core.PayPalHttpClient(environment);
    */

    try {
      // For development, simulate PayPal order creation
      const simulatedPayPalOrder = {
        id: `PAYPAL_${nanoid(16)}`, // Simulated PayPal order ID
        status: "CREATED",
        links: [
          {
            rel: "approve",
            href: `https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_${nanoid(16)}`,
          },
          {
            rel: "capture",
            href: `https://api.sandbox.paypal.com/v2/checkout/orders/PAYPAL_${nanoid(16)}/capture`,
          },
        ],
      };

      // In production, create actual PayPal order:
      /*
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: input.currency,
              value: input.amount.toFixed(2),
            },
            description: `Order ${input.orderId}`,
            custom_id: input.orderId,
          },
        ],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          brand_name: "Gift Card Marketplace",
          user_action: "PAY_NOW",
        },
      });

      const response = await client.execute(request);
      const paypalOrder = response.result;
      */

      // Create PaymentIntent record in database
      const paymentIntent = await PaymentIntent.create({
        id: `intent_${nanoid(16)}`,
        orderId: input.orderId,
        companyId: input.companyId,
        provider: "paypal",
        amount: input.amount,
        currency: input.currency,
        providerIntentId: simulatedPayPalOrder.id,
        providerStatus: simulatedPayPalOrder.status,
        customerEmail: input.customerEmail,
        customerName: input.customerName || null,
        status: "pending",
        metadata: {},
        errorMessage: null,
        successUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
      });

      // Update order with payment intent ID
      order.paymentIntentId = simulatedPayPalOrder.id;
      order.paymentStatus = "processing";
      await order.save();

      // Find approval URL
      const approvalUrl = simulatedPayPalOrder.links.find((link) => link.rel === "approve")?.href;

      return {
        paymentIntent,
        orderId: simulatedPayPalOrder.id,
        approvalUrl,
      };
    } catch (error) {
      throw Errors.badRequest(
        `Failed to create PayPal order: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Capture a PayPal order (complete the payment)
   * Called after customer approves the payment
   */
  static async captureOrder(paypalOrderId: string) {
    await connectDB();

    const paymentIntent = await PaymentIntent.findByProviderIntentId(paypalOrderId);
    if (!paymentIntent) {
      throw Errors.notFound("Payment intent");
    }

    // In production, capture the PayPal order:
    /*
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    const response = await client.execute(request);
    const capturedOrder = response.result;
    */

    // Simulate successful capture
    paymentIntent.status = "succeeded";
    paymentIntent.providerStatus = "COMPLETED";
    paymentIntent.completedAt = new Date();
    await paymentIntent.save();

    // Update order
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "completed";
      order.paidAt = new Date();
      await order.save();
    }

    return paymentIntent;
  }

  /**
   * Handle PayPal webhook events
   */
  static async handleWebhook(event: PayPalWebhookEvent, headers: Record<string, string>) {
    await connectDB();

    // In production, verify webhook signature:
    /*
    const paypal = require('@paypal/checkout-server-sdk');
    const isValid = await paypal.webhooks.verifyWebhookSignature({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: event,
    });

    if (!isValid) {
      throw Errors.unauthorized("Invalid webhook signature");
    }
    */

    // Handle different event types
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
        await this.handleOrderApproved(event.resource);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        await this.handleCaptureCompleted(event.resource);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        await this.handleCaptureDenied(event.resource);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await this.handleRefund(event.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return { received: true };
  }

  /**
   * Handle order approved (customer clicked pay)
   */
  private static async handleOrderApproved(paypalOrder: PayPalWebhookEvent["resource"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(paypalOrder.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for PayPal ID: ${paypalOrder.id}`);
      return;
    }

    // Update payment intent status
    paymentIntent.providerStatus = paypalOrder.status;
    await paymentIntent.save();

    console.log(`PayPal order ${paypalOrder.id} approved. Ready for capture.`);
  }

  /**
   * Handle payment capture completed
   */
  private static async handleCaptureCompleted(paypalCapture: PayPalWebhookEvent["resource"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(paypalCapture.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for PayPal capture: ${paypalCapture.id}`);
      return;
    }

    // Update payment intent
    paymentIntent.status = "succeeded";
    paymentIntent.providerStatus = paypalCapture.status;
    paymentIntent.completedAt = new Date();
    await paymentIntent.save();

    // Update order
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "completed";
      order.paidAt = new Date();
      await order.save();

      // Get listing to check autoFulfill setting
      const listing = await Listing.findOne({
        id: order.listingId,
        companyId: order.companyId,
      });

      // Auto-fulfill if enabled
      if (listing && listing.autoFulfill) {
        try {
          // Use dynamic import to avoid circular dependency
          const { OrderService } = await import("@/lib/services/order.service");
          await OrderService.fulfillOrder(order.companyId, order.id, "system");
          console.log(`✅ Order ${order.id} auto-fulfilled and email sent`);
        } catch (fulfillError) {
          console.error(`❌ Failed to auto-fulfill order ${order.id}:`, fulfillError);
          // Don't throw error - payment was successful, fulfillment can be done manually
        }
      } else {
        console.log(`Order ${order.id} payment completed via PayPal. Ready for manual fulfillment.`);
      }
    }
  }

  /**
   * Handle payment capture denied
   */
  private static async handleCaptureDenied(paypalCapture: PayPalWebhookEvent["resource"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(paypalCapture.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for PayPal capture: ${paypalCapture.id}`);
      return;
    }

    // Update payment intent
    paymentIntent.status = "failed";
    paymentIntent.providerStatus = paypalCapture.status;
    paymentIntent.completedAt = new Date();
    paymentIntent.errorMessage = "Payment capture denied";
    await paymentIntent.save();

    // Update order
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
    }
  }

  /**
   * Handle refund
   */
  private static async handleRefund(paypalRefund: PayPalWebhookEvent["resource"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(paypalRefund.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for refund: ${paypalRefund.id}`);
      return;
    }

    // Update order
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "refunded";
      await order.save();
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(orderId: string, companyId: string, amount?: number, reason?: string) {
    await connectDB();

    // Get order
    const order = await Order.findOne({ id: orderId, companyId });
    if (!order) {
      throw Errors.notFound("Order");
    }

    if (order.paymentStatus !== "completed") {
      throw Errors.badRequest("Can only refund completed payments");
    }

    // Get payment intent
    const paymentIntent = await PaymentIntent.findByOrder(orderId);
    if (!paymentIntent || !paymentIntent.isSucceeded()) {
      throw Errors.badRequest("No successful payment found for this order");
    }

    // Get PayPal configuration
    const paypalConfig = await PaymentProviderConfig.findOne({
      companyId,
      provider: "paypal",
      enabled: true,
    }).select("+secretKey");

    if (!paypalConfig) {
      throw Errors.badRequest("PayPal is not configured for this company");
    }

    // In production, create PayPal refund:
    /*
    const request = new paypal.payments.CapturesRefundRequest(paymentIntent.providerIntentId);
    request.requestBody({
      amount: amount ? {
        currency_code: order.currency,
        value: amount.toFixed(2),
      } : undefined,
      note_to_payer: reason || "Refund for your order",
    });

    const response = await client.execute(request);
    const refund = response.result;
    */

    // Simulate refund for development
    order.paymentStatus = "refunded";
    await order.save();

    return {
      orderId: order.id,
      amount: amount || order.total,
      status: "succeeded",
    };
  }

  /**
   * Get PayPal account status for a company
   */
  static async getAccountStatus(companyId: string) {
    await connectDB();

    const paypalConfig = await PaymentProviderConfig.findByProvider(companyId, "paypal");

    if (!paypalConfig) {
      return {
        connected: false,
        status: "disconnected",
        testMode: true,
      };
    }

    return {
      connected: paypalConfig.isConnected(),
      status: paypalConfig.status,
      testMode: paypalConfig.testMode,
      merchantId: paypalConfig.accountId,
      lastTestedAt: paypalConfig.lastTestedAt,
    };
  }
}
