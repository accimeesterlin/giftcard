/**
 * GET/PATCH/DELETE /api/v1/companies/:companyId/webhooks/:webhookId
 * Manage individual webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { toAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1).optional(),
  enabled: z.boolean().optional(),
});

/**
 * GET /api/v1/companies/:companyId/webhooks/:webhookId
 * Get a specific webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; webhookId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, webhookId } = await params;

    const webhook = await WebhookService.getWebhook(companyId, webhookId, userId);

    return NextResponse.json(
      {
        data: webhook,
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

/**
 * PATCH /api/v1/companies/:companyId/webhooks/:webhookId
 * Update a webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; webhookId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, webhookId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = updateWebhookSchema.parse(body);

    const webhook = await WebhookService.updateWebhook(
      companyId,
      webhookId,
      userId,
      input as any
    );

    return NextResponse.json(
      {
        data: webhook,
        meta: {
          message: "Webhook updated successfully",
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

/**
 * DELETE /api/v1/companies/:companyId/webhooks/:webhookId
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; webhookId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, webhookId } = await params;

    await WebhookService.deleteWebhook(companyId, webhookId, userId);

    return NextResponse.json(
      {
        meta: {
          message: "Webhook deleted successfully",
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
