/**
 * POST /api/v1/webhooks/stripe
 * Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from "next/server";
import { StripeService } from "@/lib/services/payment/stripe.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/stripe
 * Receive and process Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: { code: "MISSING_SIGNATURE", message: "Stripe signature is required" } },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const event = JSON.parse(body);

    // Get webhook secret from environment or company config
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    // Handle the webhook event
    await StripeService.handleWebhook(event, signature, webhookSecret);

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
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
