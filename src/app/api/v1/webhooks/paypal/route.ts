/**
 * POST /api/v1/webhooks/paypal
 * Handle PayPal webhook events
 */

import { NextRequest, NextResponse } from "next/server";
import { PayPalService } from "@/lib/services/payment/paypal.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/paypal
 * Receive and process PayPal webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get PayPal webhook headers for signature verification
    const headers = {
      "paypal-auth-algo": request.headers.get("paypal-auth-algo") || "",
      "paypal-cert-url": request.headers.get("paypal-cert-url") || "",
      "paypal-transmission-id": request.headers.get("paypal-transmission-id") || "",
      "paypal-transmission-sig": request.headers.get("paypal-transmission-sig") || "",
      "paypal-transmission-time": request.headers.get("paypal-transmission-time") || "",
    };

    // Get raw body
    const body = await request.text();
    const event = JSON.parse(body);

    // Handle the webhook event
    await PayPalService.handleWebhook(event, headers);

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
