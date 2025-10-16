/**
 * Email Service
 * Sends transactional emails using nodemailer
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email transporter (configured from env)
let transporter: Transporter | null = null;

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
   * Send an email
   */
  static async send({ to, subject, html, text }: SendEmailOptions) {
    const transport = getTransporter();

    try {
      const info = await transport.sendMail({
        from: process.env.SMTP_FROM || '"GiftCard Marketplace" <noreply@example.com>',
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
    to,
    inviterName,
    companyName,
    role,
    invitationUrl,
  }: {
    to: string;
    inviterName: string;
    companyName: string;
    role: string;
    invitationUrl: string;
  }) {
    const subject = `You've been invited to join ${companyName}`;

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
            .info-box { background: #f9fafb; border-left: 4px solid #111827; padding: 16px; margin: 24px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Team Invitation</h1>
            </div>

            <div class="content">
              <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on GiftCard Marketplace.</p>

              <div class="info-box">
                <p style="margin: 0;"><strong>Your role:</strong> <span class="role-badge">${role}</span></p>
              </div>

              <p>As a ${role}, you'll be able to:</p>
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
              <p>This is an automated email from GiftCard Marketplace.</p>
              <p>If you have any questions, please contact the person who invited you.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({ to, subject, html });
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
      agent:
        "<li>Fulfill orders</li><li>Provide customer support</li><li>View listings</li>",
      viewer: "<li>View company data</li><li>Read-only access</li>",
    };

    return descriptions[role] || "<li>Collaborate with the team</li>";
  }

  /**
   * Send membership revoked email
   */
  static async sendMembershipRevoked({
    to,
    companyName,
  }: {
    to: string;
    companyName: string;
  }) {
    const subject = `Your access to ${companyName} has been revoked`;

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
            <p>Your access to <strong>${companyName}</strong> has been revoked by an administrator.</p>
            <p>You will no longer be able to access this company's data or perform any actions on their behalf.</p>
            <p>If you believe this was done in error, please contact the company administrator.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">GiftCard Marketplace</p>
          </div>
        </body>
      </html>
    `;

    await this.send({ to, subject, html });
  }
}
