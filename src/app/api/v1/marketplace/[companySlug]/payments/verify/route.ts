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

          // Update listing soldCount
          const listing = await Listing.findOne({
            id: order.listingId,
            companyId: company.id,
          });

          if (listing) {
            listing.soldCount += order.quantity;
            await listing.save();
          }

          return NextResponse.json(
            {
              data: {
                orderId: order.id,
                status: "completed",
                amount: order.total,
                currency: order.currency,
                verifiedAt: new Date().toISOString(),
              },
              meta: {
                message: "Payment verified successfully",
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
