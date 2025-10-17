import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Integration from "@/lib/db/models/Integration";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import crypto from "crypto";
import { updateIntegrationSchema } from "@/lib/validation/schemas";
import { toAppError, Errors } from "@/lib/errors";

// Encryption helpers
const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('base64');
const ALGORITHM = 'aes-256-gcm';

// Derive a proper 32-byte key from the encryption key string
function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be set in environment variables');
  }

  // Create a SHA-256 hash of the key to ensure it's always 32 bytes
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

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

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// GET /api/v1/companies/:companyId/integrations/:integrationId - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; integrationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, integrationId } = await params;

    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Fetch integration
    const integration = await Integration.findOne({ id: integrationId, companyId });

    if (!integration) {
      throw Errors.notFound("Integration", integrationId);
    }

    // Decrypt sensitive data but keep them masked
    const config = { ...integration.config };
    Object.keys(config).forEach((key) => {
      if (key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')) {
        try {
          const decrypted = decrypt(config[key]);
          config[key] = `***${decrypted.slice(-4)}`;
        } catch (e) {
          config[key] = `***${config[key].slice(-4)}`;
        }
      }
    });

    return NextResponse.json(
      {
        data: {
          id: integration.id,
          companyId: integration.companyId,
          provider: integration.provider,
          type: integration.type,
          config,
          enabled: integration.enabled,
          primary: integration.primary,
          lastSyncedAt: integration.lastSyncedAt,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
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

// PATCH /api/v1/companies/:companyId/integrations/:integrationId - Update integration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; integrationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, integrationId } = await params;

    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateIntegrationSchema.parse(body);
    const { config, enabled, primary } = validatedData;

    // Fetch integration
    const integration = await Integration.findOne({ id: integrationId, companyId });

    if (!integration) {
      throw Errors.notFound("Integration", integrationId);
    }

    // Update config if provided
    if (config) {
      const encryptedConfig = { ...config };
      Object.keys(encryptedConfig).forEach((key) => {
        if (key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')) {
          // Only encrypt if it's not already masked (doesn't start with ***)
          if (!encryptedConfig[key].startsWith('***')) {
            encryptedConfig[key] = encrypt(encryptedConfig[key]);
          } else {
            // Keep the existing encrypted value
            encryptedConfig[key] = integration.config[key];
          }
        }
      });
      integration.config = encryptedConfig;
    }

    // Update enabled status if provided
    if (typeof enabled === "boolean") {
      integration.enabled = enabled;
    }

    // Update primary status if provided
    if (typeof primary === "boolean") {
      if (primary) {
        // Use the setPrimary method to ensure only one primary per type
        await integration.setPrimary();
      } else {
        integration.primary = false;
        await integration.save();
      }
    } else {
      await integration.save();
    }

    return NextResponse.json(
      {
        data: {
          id: integration.id,
          companyId: integration.companyId,
          provider: integration.provider,
          type: integration.type,
          enabled: integration.enabled,
          primary: integration.primary,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        },
        meta: {
          message: "Integration updated successfully",
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

// DELETE /api/v1/companies/:companyId/integrations/:integrationId - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; integrationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, integrationId } = await params;

    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Delete integration
    const result = await Integration.deleteOne({ id: integrationId, companyId });

    if (result.deletedCount === 0) {
      throw Errors.notFound("Integration", integrationId);
    }

    return NextResponse.json(
      {
        meta: {
          message: "Integration deleted successfully",
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
