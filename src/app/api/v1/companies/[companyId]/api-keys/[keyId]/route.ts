/**
 * DELETE /api/v1/companies/:companyId/api-keys/:keyId
 * Revoke an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { ApiKeyService } from "@/lib/services/apikey.service";
import { toAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/companies/:companyId/api-keys/:keyId
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; keyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, keyId } = await params;

    const revokedKey = await ApiKeyService.revokeApiKey(companyId, keyId, userId);

    return NextResponse.json(
      {
        data: revokedKey,
        meta: {
          message: "API key revoked successfully",
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
