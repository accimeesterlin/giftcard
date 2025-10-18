/**
 * Stripe Payment Service
 * Handles Stripe payment intents, confirmations, and webhooks
 */

import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import PaymentIntent from "@/lib/db/models/PaymentIntent";
import Order from "@/lib/db/models/Order";
import Listing from "@/lib/db/models/Listing";
import { Errors } from "@/lib/errors";

// Stripe SDK would be imported in production
// import Stripe from "stripe";

interface CreatePaymentIntentInput {
  companyId: string;
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      customer_email?: string;
      metadata?: Record<string, unknown>;
    };
  };
}

export class StripeService {
  /**
   * Create a Stripe payment intent
   * In production, this would use the actual Stripe SDK
   */
  static async createPaymentIntent(input: CreatePaymentIntentInput) {
    await connectDB();

    // Get Stripe configuration for the company
    const stripeConfig = await PaymentProviderConfig.findOne({
      companyId: input.companyId,
      provider: "stripe",
      enabled: true,
      status: "connected",
    }).select("+secretKey");

    if (!stripeConfig) {
      throw Errors.badRequest(
        "Stripe is not configured for this company. Please configure Stripe in settings."
      );
    }

    // Get order to verify
    const order = await Order.findOne({ id: input.orderId, companyId: input.companyId });
    if (!order) {
      throw Errors.notFound("Order");
    }

    // In production, initialize Stripe with secret key
    // const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: "2023-10-16" });

    try {
      // For development, simulate Stripe payment intent creation
      const simulatedStripeIntent = {
        id: `pi_${nanoid(24)}`, // Simulated Stripe payment intent ID
        status: "requires_payment_method",
        amount: Math.round(input.amount * 100), // Stripe uses cents
        currency: input.currency.toLowerCase(),
        customer_email: input.customerEmail,
        client_secret: `pi_${nanoid(24)}_secret_${nanoid(32)}`,
      };

      // In production, create actual Stripe payment intent:
      /*
      const stripeIntent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: input.currency.toLowerCase(),
        receipt_email: input.customerEmail,
        metadata: {
          orderId: input.orderId,
          companyId: input.companyId,
          ...input.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      */

      // Create PaymentIntent record in database
      const paymentIntent = await PaymentIntent.create({
        id: `intent_${nanoid(16)}`,
        orderId: input.orderId,
        companyId: input.companyId,
        provider: "stripe",
        amount: input.amount,
        currency: input.currency,
        providerIntentId: simulatedStripeIntent.id,
        providerStatus: simulatedStripeIntent.status,
        customerEmail: input.customerEmail,
        customerName: input.customerName || null,
        status: "pending",
        metadata: input.metadata || {},
        errorMessage: null,
        successUrl: null,
        cancelUrl: null,
      });

      // Update order with payment intent ID
      order.paymentIntentId = simulatedStripeIntent.id;
      order.paymentStatus = "processing";
      await order.save();

      return {
        paymentIntent,
        clientSecret: simulatedStripeIntent.client_secret,
        publishableKey: stripeConfig.publicKey,
      };
    } catch (error) {
      throw Errors.badRequest(
        `Failed to create Stripe payment intent: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Confirm a Stripe payment (for development/testing)
   * In production, payments are confirmed via Stripe.js on the frontend
   */
  static async confirmPayment(paymentIntentId: string) {
    await connectDB();

    const paymentIntent = await PaymentIntent.findByProviderIntentId(paymentIntentId);
    if (!paymentIntent) {
      throw Errors.notFound("Payment intent");
    }

    // In production, use Stripe SDK to confirm:
    // const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    // const confirmed = await stripe.paymentIntents.confirm(paymentIntentId);

    // Simulate successful payment
    paymentIntent.status = "succeeded";
    paymentIntent.providerStatus = "succeeded";
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
   * Handle Stripe webhook events
   * This is called when Stripe sends webhook notifications
   */
  static async handleWebhook(event: StripeWebhookEvent, signature: string, webhookSecret: string) {
    await connectDB();

    // In production, verify webhook signature:
    /*
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err) {
      throw Errors.unauthorized("Invalid webhook signature");
    }
    */

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await this.handlePaymentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        await this.handlePaymentCanceled(event.data.object);
        break;

      case "charge.refunded":
        await this.handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(stripePaymentIntent: StripeWebhookEvent["data"]["object"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(stripePaymentIntent.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for Stripe ID: ${stripePaymentIntent.id}`);
      return;
    }

    // Update payment intent
    paymentIntent.status = "succeeded";
    paymentIntent.providerStatus = stripePaymentIntent.status;
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
        console.log(`Order ${order.id} payment succeeded. Ready for manual fulfillment.`);
      }
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(stripePaymentIntent: StripeWebhookEvent["data"]["object"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(stripePaymentIntent.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for Stripe ID: ${stripePaymentIntent.id}`);
      return;
    }

    // Update payment intent
    paymentIntent.status = "failed";
    paymentIntent.providerStatus = stripePaymentIntent.status;
    paymentIntent.completedAt = new Date();
    paymentIntent.errorMessage = "Payment failed";
    await paymentIntent.save();

    // Update order
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
    }
  }

  /**
   * Handle canceled payment
   */
  private static async handlePaymentCanceled(stripePaymentIntent: StripeWebhookEvent["data"]["object"]) {
    const paymentIntent = await PaymentIntent.findByProviderIntentId(stripePaymentIntent.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for Stripe ID: ${stripePaymentIntent.id}`);
      return;
    }

    // Update payment intent
    paymentIntent.status = "canceled";
    paymentIntent.providerStatus = stripePaymentIntent.status;
    paymentIntent.completedAt = new Date();
    await paymentIntent.save();

    // Update order - could release reserved inventory here
    const order = await Order.findOne({ id: paymentIntent.orderId });
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
    }
  }

  /**
   * Handle refund
   */
  private static async handleRefund(stripeRefund: StripeWebhookEvent["data"]["object"]) {
    // Find payment intent associated with this refund
    const paymentIntent = await PaymentIntent.findByProviderIntentId(stripeRefund.id);
    if (!paymentIntent) {
      console.error(`Payment intent not found for refund: ${stripeRefund.id}`);
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

    // Get Stripe configuration
    const stripeConfig = await PaymentProviderConfig.findOne({
      companyId,
      provider: "stripe",
      enabled: true,
    }).select("+secretKey");

    if (!stripeConfig) {
      throw Errors.badRequest("Stripe is not configured for this company");
    }

    // In production, create Stripe refund:
    /*
    const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: "2023-10-16" });
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.providerIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: reason || "requested_by_customer",
    });
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
   * Get Stripe account status for a company
   */
  static async getAccountStatus(companyId: string) {
    await connectDB();

    const stripeConfig = await PaymentProviderConfig.findByProvider(companyId, "stripe");

    if (!stripeConfig) {
      return {
        connected: false,
        status: "disconnected",
        testMode: true,
      };
    }

    return {
      connected: stripeConfig.isConnected(),
      status: stripeConfig.status,
      testMode: stripeConfig.testMode,
      accountId: stripeConfig.accountId,
      lastTestedAt: stripeConfig.lastTestedAt,
    };
  }
}
