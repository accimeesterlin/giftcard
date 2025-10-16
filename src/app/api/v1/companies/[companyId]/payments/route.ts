/**
 * GET/POST /api/v1/companies/:companyId/payments
 * List and configure payment providers
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { nanoid } from "nanoid";
import connectDB from "@/lib/db/mongodb";
import PaymentProviderConfig from "@/lib/db/models/PaymentProviderConfig";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { toAppError, Errors } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const configureProviderSchema = z.object({
  provider: z.enum(["stripe", "paypal", "crypto", "pgpay"]),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  accountId: z.string().optional(),
  walletAddress: z.string().optional(),
  testMode: z.boolean().default(true),
  enabled: z.boolean().default(false),
});

/**
 * GET /api/v1/companies/:companyId/payments
 * List payment provider configurations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    await connectDB();

    // Verify user has access to the company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Get all payment provider configurations
    const configs = await PaymentProviderConfig.findByCompany(companyId);

    return NextResponse.json(
      {
        data: configs,
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
 * POST /api/v1/companies/:companyId/payments
 * Configure a payment provider
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Parse and validate request body
    const body = await request.json();
    const input = configureProviderSchema.parse(body);

    // Check if provider is already configured
    let config = await PaymentProviderConfig.findByProvider(companyId, input.provider);

    if (config) {
      // Update existing configuration
      if (input.publicKey) config.publicKey = input.publicKey;
      if (input.secretKey) config.secretKey = input.secretKey;
      if (input.webhookSecret) config.webhookSecret = input.webhookSecret;
      if (input.accountId) config.accountId = input.accountId;
      if (input.walletAddress) config.walletAddress = input.walletAddress;
      config.testMode = input.testMode;
      config.enabled = input.enabled;

      // Set status based on whether credentials are provided
      if (input.publicKey || input.secretKey) {
        config.status = "connected";
      }

      await config.save();
    } else {
      // Create new configuration
      config = await PaymentProviderConfig.create({
        id: `ppc_${nanoid(16)}`,
        companyId,
        provider: input.provider,
        status: input.publicKey || input.secretKey ? "connected" : "disconnected",
        publicKey: input.publicKey || null,
        secretKey: input.secretKey || null,
        webhookSecret: input.webhookSecret || null,
        accountId: input.accountId || null,
        walletAddress: input.walletAddress || null,
        testMode: input.testMode,
        enabled: input.enabled,
        createdBy: userId,
        lastTestedAt: null,
      });
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: `payment.provider.${config.id ? "updated" : "created"}`,
      resourceType: "payment_provider",
      resourceId: config.id,
      metadata: {
        provider: input.provider,
        enabled: input.enabled,
        testMode: input.testMode,
      },
    });

    // Fetch config without sensitive fields
    const safeConfig = await PaymentProviderConfig.findOne({ id: config.id });

    return NextResponse.json(
      {
        data: safeConfig,
        meta: {
          message: "Payment provider configured successfully",
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
