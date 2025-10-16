/**
 * POST /api/v1/companies/:companyId/webhooks/:webhookId/test
 * Send a test event to a webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/companies/:companyId/webhooks/:webhookId/test
 * Send a test webhook event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; webhookId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, webhookId } = await params;

    // Get the webhook
    const webhook = await WebhookService.getWebhook(companyId, webhookId, userId);

    // Trigger a test event (using the first event in the webhook's list)
    const testEvent = webhook.events[0] || "order.created";

    const testData = {
      test: true,
      message: "This is a test webhook event",
      orderId: "order_test_123",
      total: 100,
      currency: "USD",
      timestamp: new Date().toISOString(),
    };

    await WebhookService.triggerWebhooks(companyId, testEvent as any, testData);

    return NextResponse.json(
      {
        meta: {
          message: `Test event sent to webhook: ${testEvent}`,
        },
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
