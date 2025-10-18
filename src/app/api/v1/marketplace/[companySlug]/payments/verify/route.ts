/**
 * POST /api/v1/marketplace/:companySlug/payments/verify
 * Verify a payment and update order status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db/mongodb";
import Company from "@/lib/db/models/Company";
import Order from "@/lib/db/models/Order";
import Customer from "@/lib/db/models/Customer";
import Listing from "@/lib/db/models/Listing";
import { PGPayService } from "@/lib/services/pgpay.service";
import { OrderService } from "@/lib/services/order.service";
import { toAppError, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  token: z.string().optional(),
  status: z.string().optional(),
});

/**
 * POST /api/v1/marketplace/:companySlug/payments/verify
 * Verify payment and update order status
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
    const input = verifyPaymentSchema.parse(body);

    // Get order
    const order = await Order.findOne({
      id: input.orderId,
      companyId: company.id,
    });

    if (!order) {
      throw Errors.notFound("Order", input.orderId);
    }

    // If already completed, return success
    if (order.paymentStatus === "completed") {
      return NextResponse.json(
        {
          data: {
            orderId: order.id,
            status: "completed",
            alreadyProcessed: true,
          },
          meta: {
            message: "Payment already verified",
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

    // Verify payment based on provider
    if (order.paymentMethod === "pgpay") {
      if (!input.token) {
        throw Errors.badRequest("Payment token is required for verification");
      }

      try {
        // Verify payment with PGPay
        const verification = await PGPayService.verifyPayment({
          pgPayToken: input.token,
        });

        // Check if payment was successful
        if (verification.paymentStatus === "completed" || verification.status === "completed") {
          // Update order status
          order.paymentStatus = "completed";
          order.paidAt = new Date();
          await order.save();

          // Update customer stats
          const customer = await Customer.findOne({
            id: order.customerId,
            companyId: company.id,
          });

          if (customer) {
            customer.totalPurchases += 1;
            customer.totalSpent += order.total;
            customer.lastPurchaseAt = new Date();
            await customer.save();
          }

          // Get listing to check autoFulfill setting
          const listing = await Listing.findOne({
            id: order.listingId,
            companyId: company.id,
          });

          console.log(`📦 Listing autoFulfill status: ${listing?.autoFulfill}`);

          // Auto-fulfill if enabled
          let fulfillmentStatus = {
            attempted: false,
            succeeded: false,
            error: null as string | null,
          };

          if (listing && listing.autoFulfill) {
            fulfillmentStatus.attempted = true;
            console.log(`🔄 Attempting to auto-fulfill order ${order.id}...`);

            try {
              await OrderService.fulfillOrder(company.id, order.id, "system");
              fulfillmentStatus.succeeded = true;
              console.log(`✅ Order ${order.id} auto-fulfilled and email sent successfully`);
            } catch (fulfillError) {
              const errorMessage = fulfillError instanceof Error ? fulfillError.message : "Unknown error";
              fulfillmentStatus.error = errorMessage;
              console.error(`❌ Failed to auto-fulfill order ${order.id}:`, fulfillError);
              console.error(`Error details:`, errorMessage);
              // Don't throw error - payment was successful, fulfillment can be done manually
            }
          } else {
            console.log(`⏭️  Auto-fulfill skipped. Listing autoFulfill: ${listing?.autoFulfill}`);
          }

          return NextResponse.json(
            {
              data: {
                orderId: order.id,
                status: "completed",
                amount: order.total,
                currency: order.currency,
                verifiedAt: new Date().toISOString(),
                fulfilled: fulfillmentStatus.succeeded,
                autoFulfillAttempted: fulfillmentStatus.attempted,
                fulfillmentError: fulfillmentStatus.error,
              },
              meta: {
                message: fulfillmentStatus.succeeded
                  ? "Payment verified and order fulfilled successfully"
                  : fulfillmentStatus.error
                  ? `Payment verified successfully, but auto-fulfillment failed: ${fulfillmentStatus.error}`
                  : "Payment verified successfully",
              },
            },
            {
              status: 200,
              headers: {
                "X-API-Version": "v1",
              },
            }
          );
        } else {
          // Payment failed
          order.paymentStatus = "failed";
          await order.save();

          throw Errors.badRequest("Payment verification failed");
        }
      } catch (error) {
        // If verification fails, mark order as failed
        order.paymentStatus = "failed";
        await order.save();

        throw error;
      }
    }

    // Other payment providers can be added here
    throw Errors.badRequest(`Payment verification for ${order.paymentMethod} is not yet implemented`);
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
