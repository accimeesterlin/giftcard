/**
 * GET /api/v1/companies/:companyId/webhooks/:webhookId/logs - Get webhook logs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { WebhookLogService } from "@/lib/services/webhook-log.service";
import { toAppError } from "@/lib/errors";

/**
 * GET /api/v1/companies/:companyId/webhooks/:webhookId/logs
 * Get webhook logs with pagination and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; webhookId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, webhookId } = await params;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const successParam = searchParams.get("success");
    const event = searchParams.get("event") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Parse success filter (can be "true", "false", or undefined)
    let success: boolean | undefined;
    if (successParam === "true") {
      success = true;
    } else if (successParam === "false") {
      success = false;
    }

    const result = await WebhookLogService.getByWebhook(companyId, webhookId, userId, {
      search,
      success,
      event,
      limit,
      offset,
    });

    return NextResponse.json(result, {
      headers: {
        "X-API-Version": "v1",
      },
    });
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
