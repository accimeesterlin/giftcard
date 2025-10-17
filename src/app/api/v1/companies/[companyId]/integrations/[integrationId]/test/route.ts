import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Integration from "@/lib/db/models/Integration";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { toAppError, Errors } from "@/lib/errors";
import crypto from "crypto";

// Encryption helpers (same as in main integration routes)
const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('base64');
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be set in environment variables');
  }
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
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

// POST /api/v1/companies/:companyId/integrations/:integrationId/test - Test integration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; integrationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { companyId, integrationId } = await params;
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Test email address is required",
          },
        },
        { status: 400 }
      );
    }

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

    // Test the integration based on provider type
    let testResult: any = {
      success: false,
      message: "",
      details: {},
    };

    if (integration.type === "email") {
      // Test email integration
      testResult = await testEmailIntegration(integration, testEmail);
    } else {
      testResult = {
        success: false,
        message: `Testing for ${integration.type} integrations is not yet implemented`,
        details: {},
      };
    }

    return NextResponse.json(
      {
        data: testResult,
        meta: {
          message: testResult.success
            ? "Integration test successful"
            : "Integration test failed",
        },
      },
      {
        status: testResult.success ? 200 : 400,
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

// Helper function to test email integrations
async function testEmailIntegration(integration: any, testEmail: string) {
  try {
    const { provider, config } = integration;

    // Decrypt sensitive config fields
    const decryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')) {
          try {
            decryptedConfig[key] = decrypt(value as string);
          } catch (e) {
            decryptedConfig[key] = value as string;
          }
        } else {
          decryptedConfig[key] = value as string;
        }
      }
    }

    // Basic validation - check if required config fields exist
    const requiredFields: Record<string, string[]> = {
      zeptomail: ["apiKey", "fromEmail", "fromName"],
      sendgrid: ["apiKey", "fromEmail", "fromName"],
      mailgun: ["apiKey", "domain", "fromEmail", "fromName"],
      mailchimp: ["apiKey", "fromEmail", "fromName"],
      resend: ["apiKey", "fromEmail", "fromName"],
      postmark: ["serverToken", "fromEmail", "fromName"],
    };

    const fields = requiredFields[provider] || [];
    const missingFields = fields.filter((field) => !decryptedConfig[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required configuration fields: ${missingFields.join(", ")}`,
        details: { missingFields },
      };
    }

    // Send actual test email based on provider
    let emailResult;
    switch (provider) {
      case "zeptomail":
        emailResult = await sendTestEmailZeptoMail(decryptedConfig, testEmail);
        break;
      case "sendgrid":
        emailResult = await sendTestEmailSendGrid(decryptedConfig, testEmail);
        break;
      case "resend":
        emailResult = await sendTestEmailResend(decryptedConfig, testEmail);
        break;
      default:
        return {
          success: false,
          message: `Email sending for ${provider} is not yet implemented. Please use ZeptoMail, SendGrid, or Resend for now.`,
          details: { provider },
        };
    }

    return emailResult;
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

// SendGrid email sender
async function sendTestEmailSendGrid(config: Record<string, string>, testEmail: string) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: testEmail }],
            subject: "Test Email from GiftCard Marketplace",
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Test Email Successful! 🎉</h2>
                <p>This is a test email from your GiftCard Marketplace integration.</p>
                <p><strong>Provider:</strong> SendGrid</p>
                <p><strong>From:</strong> ${config.fromName} (${config.fromEmail})</p>
                <p>If you received this email, your integration is working correctly!</p>
                <hr style="margin: 20px 0;" />
                <p style="color: #666; font-size: 12px;">This is an automated test message from GiftCard Marketplace.</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errorData}`);
    }

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail} via SendGrid!`,
      details: {
        provider: "SendGrid",
        recipient: testEmail,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `SendGrid error: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

// Resend email sender
async function sendTestEmailResend(config: Record<string, string>, testEmail: string) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: [testEmail],
        subject: "Test Email from GiftCard Marketplace",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Email Successful! 🎉</h2>
            <p>This is a test email from your GiftCard Marketplace integration.</p>
            <p><strong>Provider:</strong> Resend</p>
            <p><strong>From:</strong> ${config.fromName} (${config.fromEmail})</p>
            <p>If you received this email, your integration is working correctly!</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This is an automated test message from GiftCard Marketplace.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail} via Resend!`,
      details: {
        provider: "Resend",
        recipient: testEmail,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        emailId: data.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Resend error: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

// ZeptoMail email sender
async function sendTestEmailZeptoMail(config: Record<string, string>, testEmail: string) {
  try {
    const response = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": config.apiKey,
      },
      body: JSON.stringify({
        from: {
          address: config.fromEmail,
          name: config.fromName,
        },
        to: [
          {
            email_address: {
              address: testEmail,
            },
          },
        ],
        subject: "Test Email from GiftCard Marketplace",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Email Successful! 🎉</h2>
            <p>This is a test email from your GiftCard Marketplace integration.</p>
            <p><strong>Provider:</strong> ZeptoMail</p>
            <p><strong>From:</strong> ${config.fromName} (${config.fromEmail})</p>
            <p>If you received this email, your integration is working correctly!</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This is an automated test message from GiftCard Marketplace.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ZeptoMail API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail} via ZeptoMail!`,
      details: {
        provider: "ZeptoMail",
        recipient: testEmail,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        messageId: data.data?.[0]?.message_id || data.message_id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `ZeptoMail error: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}
