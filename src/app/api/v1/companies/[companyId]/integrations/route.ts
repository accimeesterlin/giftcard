import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Integration from "@/lib/db/models/Integration";
import Company from "@/lib/db/models/Company";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { createIntegrationSchema } from "@/lib/validation/schemas";
import { toAppError, Errors } from "@/lib/errors";

// Encryption helpers
const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// GET /api/v1/companies/:companyId/integrations - List integrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId } = await params;

    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Fetch integrations
    const integrations = await Integration.find({ companyId }).sort({ createdAt: -1 });

    // Decrypt sensitive data for response
    const integrationsWithDecryptedConfig = integrations.map((integration) => {
      const config = { ...integration.config };

      // Decrypt sensitive fields but mask them for security
      Object.keys(config).forEach((key) => {
        if (key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')) {
          try {
            // Only show last 4 characters for security
            const decrypted = decrypt(config[key]);
            config[key] = `***${decrypted.slice(-4)}`;
          } catch (e) {
            // If decryption fails, it might not be encrypted
            config[key] = `***${config[key].slice(-4)}`;
          }
        }
      });

      return {
        id: integration.id,
        companyId: integration.companyId,
        provider: integration.provider,
        type: integration.type,
        config,
        enabled: integration.enabled,
        lastSyncedAt: integration.lastSyncedAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    });

    return NextResponse.json(
      {
        data: integrationsWithDecryptedConfig,
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

// POST /api/v1/companies/:companyId/integrations - Create integration
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

    const body = await request.json();

    // Validate request body
    const validatedData = createIntegrationSchema.parse(body);
    const { provider, type, config } = validatedData;

    // Check if integration already exists
    const existingIntegration = await Integration.findOne({
      companyId,
      provider,
    });

    if (existingIntegration) {
      return NextResponse.json(
        { error: "Integration with this provider already exists" },
        { status: 409 }
      );
    }

    // Encrypt sensitive fields in config
    const encryptedConfig = { ...config };
    Object.keys(encryptedConfig).forEach((key) => {
      if (key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')) {
        encryptedConfig[key] = encrypt(encryptedConfig[key]);
      }
    });

    // Create integration
    const integration = await Integration.create({
      id: nanoid(),
      companyId,
      provider,
      type,
      config: encryptedConfig,
      enabled: true,
    });

    return NextResponse.json(
      {
        data: {
          id: integration.id,
          companyId: integration.companyId,
          provider: integration.provider,
          type: integration.type,
          enabled: integration.enabled,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        },
        meta: {
          message: "Integration created successfully",
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
