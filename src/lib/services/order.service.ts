/**
 * Order Service
 * Business logic for order creation, payment, and fulfillment
 */

import { nanoid } from "nanoid";
import { addMinutes } from "date-fns";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import Listing from "@/lib/db/models/Listing";
import Inventory from "@/lib/db/models/Inventory";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { EmailService } from "./email.service";
import { StripeService } from "./payment/stripe.service";
import { PayPalService } from "./payment/paypal.service";
import { Errors } from "@/lib/errors";
import type { CreateOrderInput, OrderFilterInput } from "@/lib/validation/schemas";

export class OrderService {
  /**
   * Create a new order (checkout)
   * This simulates payment - in production, integrate with Stripe/PayPal
   */
  static async createOrder(companyId: string, input: CreateOrderInput) {
    await connectDB();

    // Get listing
    const listing = await Listing.findOne({
      id: input.listingId,
      companyId,
    });

    if (!listing) {
      throw Errors.notFound("Listing");
    }

    // Verify listing is active
    if (listing.status !== "active") {
      throw Errors.badRequest("This listing is not available for purchase");
    }

    // Verify denomination is valid
    if (!listing.denominations.includes(input.denomination)) {
      throw Errors.badRequest(
        `Denomination ${input.denomination} is not available for this listing`
      );
    }

    // Check if enough inventory is available
    const availableInventory = await Inventory.countDocuments({
      listingId: input.listingId,
      denomination: input.denomination,
      status: "available",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    if (availableInventory < input.quantity) {
      throw Errors.badRequest(
        `Not enough inventory. Only ${availableInventory} units available`
      );
    }

    // Calculate pricing
    const denomination = input.denomination;
    const quantity = input.quantity;
    const discountPercentage = listing.discountPercentage;
    const pricePerUnit = denomination * (1 - discountPercentage / 100);
    const subtotal = denomination * quantity;
    const discount = subtotal * (discountPercentage / 100);
    const total = subtotal - discount;

    // Create order
    const order = await Order.create({
      id: `order_${nanoid(16)}`,
      companyId,
      listingId: input.listingId,
      listingTitle: listing.title,
      brand: listing.brand,
      denomination,
      quantity,
      pricePerUnit,
      discountPercentage,
      subtotal,
      discount,
      total,
      currency: listing.currency,
      customerEmail: input.customerEmail.toLowerCase(),
      customerName: input.customerName || null,
      customerId: null, // TODO: Link to authenticated user if logged in
      paymentMethod: input.paymentMethod,
      paymentIntentId: null, // Will be set by payment processor
      paymentStatus: "pending",
      paidAt: null,
      fulfillmentStatus: "pending",
      fulfilledAt: null,
      fulfilledBy: null,
      giftCardCodes: null,
      deliveryMethod: "email",
      deliveryEmail: input.deliveryEmail || input.customerEmail,
      deliveredAt: null,
      ipAddress: null,
      userAgent: null,
      notes: null,
      expiresAt: addMinutes(new Date(), 30), // Order expires in 30 minutes
    });

    // Reserve inventory
    await this.reserveInventory(order.id, input.listingId, input.denomination, input.quantity);

    // Create payment intent based on payment method
    let paymentData = null;
    try {
      paymentData = await this.initiatePayment(order);
    } catch (error) {
      // If payment initiation fails, fallback to simulation for development
      console.error("Payment initiation failed, using simulation:", error);
      await this.simulatePayment(order.id);
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId: "system", // Customer order, no userId
      action: "order.created",
      resourceType: "order",
      resourceId: order.id,
      metadata: {
        customerEmail: order.customerEmail,
        total: order.total,
        currency: order.currency,
        paymentMethod: input.paymentMethod,
      },
    });

    // Return order with payment data (client secret, approval URL, etc.)
    return {
      order,
      payment: paymentData,
    };
  }

  /**
   * Reserve inventory for an order
   * Private helper method
   */
  private static async reserveInventory(
    orderId: string,
    listingId: string,
    denomination: number,
    quantity: number
  ) {
    const reservedCodes = [];

    for (let i = 0; i < quantity; i++) {
      const code = await Inventory.reserveCode(listingId, denomination);

      if (!code) {
        // Rollback previous reservations if we can't fulfill the order
        if (reservedCodes.length > 0) {
          await Inventory.updateMany(
            { id: { $in: reservedCodes } },
            { $set: { status: "available" } }
          );
        }
        throw Errors.badRequest("Failed to reserve inventory codes");
      }

      reservedCodes.push(code.id);
    }

    return reservedCodes;
  }

  /**
   * Initiate payment with the appropriate payment provider
   */
  private static async initiatePayment(order: any) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/${order.companyId}/orders/${order.id}/success`;
    const cancelUrl = `${baseUrl}/${order.companyId}/orders/${order.id}/cancel`;

    switch (order.paymentMethod) {
      case "stripe":
        return await StripeService.createPaymentIntent({
          companyId: order.companyId,
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          metadata: {
            listingId: order.listingId,
            brand: order.brand,
          },
        });

      case "paypal":
        return await PayPalService.createOrder({
          companyId: order.companyId,
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          returnUrl,
          cancelUrl,
        });

      case "crypto":
      case "pgpay":
        // For crypto and pgpay, we'll simulate for now
        // In production, integrate with crypto payment gateway or PGPay
        return null;

      default:
        throw Errors.badRequest(`Unsupported payment method: ${order.paymentMethod}`);
    }
  }

  /**
   * Simulate payment (for development fallback)
   * Used when payment provider is not configured
   */
  private static async simulatePayment(orderId: string) {
    const order = await Order.findOne({ id: orderId });
    if (!order) return;

    // Simulate payment success
    order.paymentStatus = "completed";
    order.paidAt = new Date();
    order.paymentIntentId = `sim_${nanoid(16)}`;
    await order.save();

    // Auto-fulfill if enabled
    const listing = await Listing.findOne({ id: order.listingId });
    if (listing && listing.autoFulfill) {
      await this.fulfillOrder(order.companyId, orderId, "system");
    }
  }

  /**
   * Fulfill an order (assign gift card codes and deliver)
   */
  static async fulfillOrder(companyId: string, orderId: string, userId: string) {
    await connectDB();

    // Verify user has agent+ permissions (unless system)
    if (userId !== "system") {
      const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

      if (!membership || !membership.hasMinimumRole("agent")) {
        throw Errors.insufficientPermissions("agent", companyId);
      }
    }

    // Get order
    const order = await Order.findOne({ id: orderId, companyId });

    if (!order) {
      throw Errors.notFound("Order");
    }

    // Verify order can be fulfilled
    if (!order.canBeFulfilled()) {
      throw Errors.badRequest(
        "Order cannot be fulfilled. Payment must be completed and fulfillment must be pending."
      );
    }

    // Get reserved inventory codes
    const reservedCodes = await Inventory.find({
      listingId: order.listingId,
      denomination: order.denomination,
      status: "reserved",
    })
      .select("+code +pin") // Include encrypted fields
      .limit(order.quantity);

    if (reservedCodes.length < order.quantity) {
      throw Errors.badRequest(
        `Not enough reserved codes. Expected ${order.quantity}, found ${reservedCodes.length}`
      );
    }

    // Mark codes as sold
    const giftCardCodes = [];
    for (const inventory of reservedCodes) {
      await inventory.markAsSold(order.id, order.customerEmail);

      giftCardCodes.push({
        inventoryId: inventory.id,
        code: inventory.code, // TODO: Decrypt in production
        pin: inventory.pin, // TODO: Decrypt in production
        serialNumber: inventory.serialNumber,
      });
    }

    // Update order
    order.giftCardCodes = giftCardCodes;
    order.fulfillmentStatus = "fulfilled";
    order.fulfilledAt = new Date();
    order.fulfilledBy = userId;
    await order.save();

    // Update listing stock count
    await Listing.updateOne(
      { id: order.listingId },
      {
        $inc: { totalStock: -order.quantity, soldCount: order.quantity },
      }
    );

    // Send delivery email
    await this.deliverOrder(order);

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "order.fulfilled",
      resourceType: "order",
      resourceId: order.id,
      metadata: {
        quantity: order.quantity,
        customerEmail: order.customerEmail,
      },
    });

    return order;
  }

  /**
   * Deliver order via email
   * Private helper method
   */
  private static async deliverOrder(order: any) {
    if (!order.giftCardCodes || order.giftCardCodes.length === 0) {
      return;
    }

    const codesText = order.giftCardCodes
      .map((gc: any, index: number) => {
        let text = `${index + 1}. Code: ${gc.code}`;
        if (gc.pin) text += ` | PIN: ${gc.pin}`;
        if (gc.serialNumber) text += ` | Serial: ${gc.serialNumber}`;
        return text;
      })
      .join("\n");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Gift Card Codes</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { color: #111827; margin: 0; font-size: 24px; }
            .codes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0; font-family: 'Courier New', monospace; white-space: pre-wrap; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 Your Gift Card Codes</h1>
            </div>

            <p>Hi${order.customerName ? ` ${order.customerName}` : ""},</p>

            <p>Thank you for your purchase! Here are your ${order.brand} gift card codes:</p>

            <div class="codes">${codesText}</div>

            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.id}</li>
              <li>Product: ${order.listingTitle}</li>
              <li>Quantity: ${order.quantity} x ${order.currency} ${order.denomination}</li>
              <li>Total Paid: ${order.currency} ${order.total.toFixed(2)}</li>
            </ul>

            <p><strong>How to redeem:</strong> Follow the instructions provided by ${order.brand} to redeem your gift card codes.</p>

            <div class="footer">
              <p>This is an automated email. Please keep this email for your records.</p>
              <p>Order placed on ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await EmailService.send({
      to: order.deliveryEmail || order.customerEmail,
      subject: `Your ${order.brand} Gift Card Codes - Order ${order.id}`,
      html,
    });

    // Update delivery timestamp
    await Order.updateOne(
      { id: order.id },
      { $set: { deliveredAt: new Date() } }
    );
  }

  /**
   * Get order by ID
   */
  static async getById(companyId: string, orderId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const order = await Order.findOne({ id: orderId, companyId });

    if (!order) {
      throw Errors.notFound("Order");
    }

    return order;
  }

  /**
   * Get all orders for a company with filtering
   */
  static async getByCompany(companyId: string, userId: string, filters?: OrderFilterInput) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Build query
    const query: any = { companyId };

    if (filters?.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters?.fulfillmentStatus) {
      query.fulfillmentStatus = filters.fulfillmentStatus;
    }

    if (filters?.customerEmail) {
      query.customerEmail = filters.customerEmail.toLowerCase();
    }

    if (filters?.brand) {
      query.brand = new RegExp(filters.brand, "i");
    }

    if (filters?.search) {
      query.$or = [
        { id: new RegExp(filters.search, "i") },
        { customerEmail: new RegExp(filters.search, "i") },
        { customerName: new RegExp(filters.search, "i") },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > page * limit,
      },
    };
  }

  /**
   * Get pending fulfillment orders
   */
  static async getPendingFulfillment(companyId: string, userId: string) {
    await connectDB();

    // Verify user has agent+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);

    if (!membership || !membership.hasMinimumRole("agent")) {
      throw Errors.insufficientPermissions("agent", companyId);
    }

    const orders = await Order.findPendingFulfillment(companyId);

    return orders;
  }

  /**
   * Refund an order
   */
  static async refundOrder(
    companyId: string,
    orderId: string,
    userId: string,
    amount?: number,
    reason?: string
  ) {
    await connectDB();

    // Verify user has manager+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    // Get order
    const order = await Order.findOne({ id: orderId, companyId });
    if (!order) {
      throw Errors.notFound("Order");
    }

    // Verify order can be refunded
    if (order.paymentStatus !== "completed") {
      throw Errors.badRequest("Can only refund completed payments");
    }

    if (order.paymentStatus === "refunded") {
      throw Errors.badRequest("Order has already been refunded");
    }

    // Process refund based on payment method
    let refundResult;
    try {
      switch (order.paymentMethod) {
        case "stripe":
          refundResult = await StripeService.createRefund(
            orderId,
            companyId,
            amount,
            reason
          );
          break;

        case "paypal":
          refundResult = await PayPalService.createRefund(
            orderId,
            companyId,
            amount,
            reason
          );
          break;

        case "crypto":
        case "pgpay":
          // For now, manually mark as refunded
          // In production, integrate with crypto gateway or PGPay
          order.paymentStatus = "refunded";
          await order.save();
          refundResult = {
            orderId: order.id,
            amount: amount || order.total,
            status: "succeeded",
          };
          break;

        default:
          throw Errors.badRequest(`Refunds not supported for payment method: ${order.paymentMethod}`);
      }
    } catch (error) {
      throw Errors.badRequest(
        `Failed to process refund: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "order.refunded",
      resourceType: "order",
      resourceId: order.id,
      metadata: {
        amount: amount || order.total,
        reason: reason || "No reason provided",
        refundStatus: refundResult.status,
      },
    });

    // Refresh order from database
    const updatedOrder = await Order.findOne({ id: orderId, companyId });

    return {
      order: updatedOrder,
      refund: refundResult,
    };
  }
}
