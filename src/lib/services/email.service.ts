/**
 * Email Service
 * Sends transactional emails using configured email integrations or nodemailer fallback
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import crypto from "crypto";
import connectDB from "@/lib/db/mongodb";
import Integration from "@/lib/db/models/Integration";
import { escapeHtml } from "@/lib/utils/html-escape";

// Email transporter (configured from env)
let transporter: Transporter | null = null;

// Encryption helpers
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY;

  if (!ENCRYPTION_KEY) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be set in environment variables");
  }

  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // For development, use ethereal.email (fake SMTP)
  // For production, configure real SMTP in env
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development mode - log emails to console
    console.warn("⚠️ SMTP not configured - emails will be logged to console");
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter as Transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send an email using the company's primary email integration
   * Falls back to SMTP if no integration is configured
   */
  static async sendViaIntegration({
    companyId,
    to,
    subject,
    html,
  }: {
    companyId: string;
    to: string;
    subject: string;
    html: string;
  }) {
    console.log(
      `📧 sendViaIntegration called for company: ${companyId}, to: ${to}, subject: ${subject}`
    );
    await connectDB();

    try {
      // Get primary email integration for the company
      const integration = await Integration.findOne({
        companyId,
        type: "email",
        primary: true,
        enabled: true,
      });

      console.log(
        `📧 Integration found:`,
        integration
          ? {
              id: integration.id,
              provider: integration.provider,
              primary: integration.primary,
              enabled: integration.enabled,
            }
          : "null"
      );

      if (!integration) {
        console.warn("⚠️ No primary email integration found");

        // Check for ZeptoMail environment variables as first fallback
        if (process.env.ZEPTOMAIL_API_KEY) {
          console.log("📧 Using ZeptoMail from environment variables");
          const zeptoConfig = {
            apiKey: process.env.ZEPTOMAIL_API_KEY,
            fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@example.com",
            fromName: process.env.ZEPTOMAIL_FROM_NAME || "Seller Gift",
          };
          return await this.sendViaZeptoMail(zeptoConfig, to, subject, html);
        }

        console.warn("⚠️ Falling back to SMTP");
        return await this.send({ to, subject, html });
      }

      // Decrypt sensitive config fields
      const decryptedConfig: Record<string, string> = {};
      for (const [key, value] of Object.entries(integration.config)) {
        if (typeof value === "string") {
          if (
            key.toLowerCase().includes("key") ||
            key.toLowerCase().includes("token") ||
            key.toLowerCase().includes("secret") ||
            key.toLowerCase().includes("password")
          ) {
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

      // Send email via the configured provider
      console.log(`📧 Sending email via provider: ${integration.provider}`);
      let result;
      switch (integration.provider) {
        case "zeptomail":
          result = await this.sendViaZeptoMail(decryptedConfig, to, subject, html);
          break;
        case "sendgrid":
          result = await this.sendViaSendGrid(decryptedConfig, to, subject, html);
          break;
        case "resend":
          result = await this.sendViaResend(decryptedConfig, to, subject, html);
          break;
        default:
          console.warn(`⚠️ Unsupported provider: ${integration.provider}, falling back to SMTP`);
          result = await this.send({ to, subject, html });
      }
      console.log(`✅ Email sent successfully via ${integration.provider}`);
      return result;
    } catch (error) {
      console.error("❌ Failed to send email via integration:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      // Fallback to SMTP
      console.warn("⚠️ Falling back to SMTP");
      return await this.send({ to, subject, html });
    }
  }

  /**
   * Send email via ZeptoMail
   */
  private static async sendViaZeptoMail(
    config: Record<string, string>,
    to: string,
    subject: string,
    html: string
  ) {
    const response = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.apiKey,
      },
      body: JSON.stringify({
        from: {
          address: config.fromEmail,
          name: config.fromName,
        },
        to: [
          {
            email_address: {
              address: to,
            },
          },
        ],
        subject,
        htmlbody: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ZeptoMail API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("📧 Email sent via ZeptoMail:", {
      to,
      subject,
      messageId: data.data?.[0]?.message_id,
    });
    return data;
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(
    config: Record<string, string>,
    to: string,
    subject: string,
    html: string
  ) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject,
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errorData}`);
    }

    console.log("📧 Email sent via SendGrid:", { to, subject });
    return { success: true };
  }

  /**
   * Send email via Resend
   */
  private static async sendViaResend(
    config: Record<string, string>,
    to: string,
    subject: string,
    html: string
  ) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("📧 Email sent via Resend:", { to, subject, emailId: data.id });
    return data;
  }

  /**
   * Send an email using SMTP (fallback method)
   * Checks for ZeptoMail environment variables first before using SMTP
   */
  static async send({ to, subject, html, text }: SendEmailOptions) {
    // Try ZeptoMail from environment variables first
    if (process.env.ZEPTOMAIL_API_KEY) {
      console.log("📧 Using ZeptoMail from environment variables");
      const zeptoConfig = {
        apiKey: process.env.ZEPTOMAIL_API_KEY,
        fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@example.com",
        fromName: process.env.ZEPTOMAIL_FROM_NAME || "Seller Gift",
      };
      return await this.sendViaZeptoMail(zeptoConfig, to, subject, html);
    }

    // Fall back to SMTP
    const transport = getTransporter();

    try {
      const info = await transport.sendMail({
        from: process.env.SMTP_FROM || '"Seller Giftplace" <noreply@example.com>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      });

      console.log("📧 Email sent:", { to, subject, messageId: info.messageId });

      // In development, log the email content
      if (!process.env.SMTP_HOST) {
        console.log("📧 Email content:", html);
      }

      return info;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      throw error;
    }
  }

  /**
   * Send team invitation email
   */
  static async sendTeamInvitation({
    companyId,
    to,
    inviterName,
    companyName,
    role,
    invitationUrl,
  }: {
    companyId: string;
    to: string;
    inviterName: string;
    companyName: string;
    role: string;
    invitationUrl: string;
  }) {
    // Escape all user-controlled inputs to prevent HTML injection
    const escapedInviterName = escapeHtml(inviterName);
    const escapedCompanyName = escapeHtml(companyName);
    const escapedRole = escapeHtml(role);
    const subject = `You've been invited to join ${escapedCompanyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(subject)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { color: #111827; margin: 0; font-size: 24px; }
            .content { margin-bottom: 32px; }
            .content p { margin: 16px 0; }
            .role-badge { display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; }
            .button { display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0; }
            .button:hover { background: #1f2937; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
            .info-box { background: #f9fafb; border-left: 4px solid #111827; padding: 16px; margin: 24px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Team Invitation</h1>
            </div>

            <div class="content">
              <p><strong>${escapedInviterName}</strong> has invited you to join <strong>${escapedCompanyName}</strong> on Seller Giftplace.</p>

              <div class="info-box">
                <p style="margin: 0;"><strong>Your role:</strong> <span class="role-badge">${escapedRole}</span></p>
              </div>

              <p>As a ${escapedRole}, you'll be able to:</p>
              <ul>
                ${this.getRoleDescription(role)}
              </ul>

              <p style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
              </p>

              <p style="font-size: 14px; color: #6b7280;">
                This invitation will expire in 7 days. If you don't want to join this company, you can safely ignore this email.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated email from Seller Giftplace.</p>
              <p>If you have any questions, please contact the person who invited you.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use company email integration if available, fallback to SMTP
    await this.sendViaIntegration({ companyId, to, subject, html });
  }

  /**
   * Get role description for email
   */
  private static getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      owner:
        "<li>Full control over the company</li><li>Manage all settings and team members</li><li>Access all features</li>",
      admin:
        "<li>Edit company settings</li><li>Manage team members</li><li>Manage listings and orders</li>",
      manager:
        "<li>Create and manage listings</li><li>Manage inventory and orders</li><li>View analytics</li>",
      agent: "<li>Fulfill orders</li><li>Provide customer support</li><li>View listings</li>",
      viewer: "<li>View company data</li><li>Read-only access</li>",
    };

    return descriptions[role] || "<li>Collaborate with the team</li>";
  }

  /**
   * Send membership revoked email
   */
  static async sendMembershipRevoked({
    companyId,
    to,
    companyName,
  }: {
    companyId: string;
    to: string;
    companyName: string;
  }) {
    // Escape user-controlled input
    const escapedCompanyName = escapeHtml(companyName);
    const subject = `Your access to ${escapedCompanyName} has been revoked`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Access Revoked</h1>
            <p>Your access to <strong>${escapedCompanyName}</strong> has been revoked by an administrator.</p>
            <p>You will no longer be able to access this company's data or perform any actions on their behalf.</p>
            <p>If you believe this was done in error, please contact the company administrator.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">Seller Giftplace</p>
          </div>
        </body>
      </html>
    `;

    // Use company email integration if available, fallback to SMTP
    await this.sendViaIntegration({ companyId, to, subject, html });
  }

  /**
   * Send invitation accepted notification to inviter
   */
  static async sendInvitationAcceptedToInviter({
    companyId,
    to,
    inviteeName,
    inviteeEmail,
    companyName,
    role,
  }: {
    companyId: string;
    to: string;
    inviteeName: string;
    inviteeEmail: string;
    companyName: string;
    role: string;
  }) {
    // Escape all user-controlled inputs
    const escapedInviteeName = escapeHtml(inviteeName);
    const escapedInviteeEmail = escapeHtml(inviteeEmail);
    const escapedCompanyName = escapeHtml(companyName);
    const escapedRole = escapeHtml(role);
    const subject = `${escapedInviteeName} accepted your invitation to ${escapedCompanyName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { color: #111827; margin: 0; font-size: 24px; }
            .content { margin-bottom: 32px; }
            .content p { margin: 16px 0; }
            .info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; }
            .role-badge { display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Invitation Accepted</h1>
            </div>

            <div class="content">
              <p><strong>${escapedInviteeName}</strong> (${escapedInviteeEmail}) has accepted your invitation to join <strong>${escapedCompanyName}</strong>.</p>

              <div class="info-box">
                <p style="margin: 0;"><strong>Role assigned:</strong> <span class="role-badge">${escapedRole}</span></p>
              </div>

              <p>They now have access to the company and can start collaborating with your team.</p>
            </div>

            <div class="footer">
              <p>This is an automated email from Seller Giftplace.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use company email integration if available, fallback to SMTP
    await this.sendViaIntegration({ companyId, to, subject, html });
  }

  /**
   * Send welcome email to new member after accepting invitation
   */
  static async sendWelcomeToNewMember({
    companyId,
    to,
    memberName,
    companyName,
    companySlug,
    role,
  }: {
    companyId: string;
    to: string;
    memberName: string;
    companyName: string;
    companySlug: string;
    role: string;
  }) {
    // Escape all user-controlled inputs
    const escapedMemberName = escapeHtml(memberName);
    const escapedCompanyName = escapeHtml(companyName);
    const escapedRole = escapeHtml(role);
    const subject = `Welcome to ${escapedCompanyName}!`;
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/${escapeHtml(companySlug)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { color: #111827; margin: 0; font-size: 24px; }
            .content { margin-bottom: 32px; }
            .content p { margin: 16px 0; }
            .role-badge { display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; }
            .button { display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0; }
            .button:hover { background: #1f2937; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Aboard!</h1>
            </div>

            <div class="content">
              <p>Hi ${escapedMemberName},</p>

              <p>Welcome to <strong>${escapedCompanyName}</strong>! You're now part of the team with the role of <span class="role-badge">${escapedRole}</span>.</p>

              <p>You can access the company dashboard to start collaborating with your team:</p>

              <p style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </p>

              <p>If you have any questions, feel free to reach out to your team administrator.</p>
            </div>

            <div class="footer">
              <p>This is an automated email from Seller Giftplace.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use company email integration if available, fallback to SMTP
    await this.sendViaIntegration({ companyId, to, subject, html });
  }
}
