/**
 * GET/POST /api/v1/companies/:companyId/webhooks
 * List and create webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { toAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createWebhookSchema = z.object({
  url: z.string().url(),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1),
});

/**
 * GET /api/v1/companies/:companyId/webhooks
 * List webhooks for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    const webhooks = await WebhookService.listWebhooks(companyId, userId);

    return NextResponse.json(
      {
        data: webhooks,
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
 * POST /api/v1/companies/:companyId/webhooks
 * Create a new webhook endpoint
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const input = createWebhookSchema.parse(body);

    const webhook = await WebhookService.createWebhook({
      companyId,
      userId,
      url: input.url,
      description: input.description,
      events: input.events as any,
    });

    return NextResponse.json(
      {
        data: webhook,
        meta: {
          message: "Webhook created successfully",
        },
      },
      {
        status: 201,
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
