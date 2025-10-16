/**
 * Webhook Service
 * Handles webhook endpoint management and event delivery
 */

import { nanoid } from "nanoid";
import crypto from "crypto";
import connectDB from "@/lib/db/mongodb";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { Errors } from "@/lib/errors";
import type { WebhookEventTypeType } from "@/types";

interface CreateWebhookInput {
  companyId: string;
  userId: string;
  url: string;
  description?: string;
  events: WebhookEventTypeType[];
}

interface WebhookPayload {
  id: string;
  event: WebhookEventTypeType;
  createdAt: number; // Unix timestamp
  data: Record<string, unknown>;
}

export class WebhookService {
  /**
   * Create a new webhook endpoint
   */
  static async createWebhook(input: CreateWebhookInput) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(
      input.userId,
      input.companyId
    );
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", input.companyId);
    }

    // Validate URL
    try {
      new URL(input.url);
    } catch {
      throw Errors.badRequest("Invalid webhook URL");
    }

    // Generate webhook secret for HMAC signature
    const secret = this.generateWebhookSecret();

    // Create webhook endpoint
    const webhook = await WebhookEndpoint.create({
      id: `whk_${nanoid(16)}`,
      companyId: input.companyId,
      url: input.url,
      description: input.description || null,
      events: input.events,
      secret,
      enabled: true,
      status: "active",
      lastTriggeredAt: null,
      successCount: 0,
      failureCount: 0,
      lastFailureAt: null,
      lastFailureReason: null,
      createdBy: input.userId,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId: input.companyId,
      userId: input.userId,
      action: "webhook.created",
      resourceType: "webhook",
      resourceId: webhook.id,
      metadata: {
        url: input.url,
        events: input.events,
      },
    });

    return webhook;
  }

  /**
   * Generate a secure webhook secret
   */
  private static generateWebhookSecret(): string {
    return `whsec_${nanoid(32)}`;
  }

  /**
   * Update webhook endpoint
   */
  static async updateWebhook(
    companyId: string,
    webhookId: string,
    userId: string,
    updates: {
      url?: string;
      description?: string;
      events?: WebhookEventTypeType[];
      enabled?: boolean;
    }
  ) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Find webhook
    const webhook = await WebhookEndpoint.findOne({ id: webhookId, companyId });
    if (!webhook) {
      throw Errors.notFound("Webhook");
    }

    // Apply updates
    if (updates.url !== undefined) {
      try {
        new URL(updates.url);
        webhook.url = updates.url;
      } catch {
        throw Errors.badRequest("Invalid webhook URL");
      }
    }
    if (updates.description !== undefined) webhook.description = updates.description;
    if (updates.events !== undefined) webhook.events = updates.events;
    if (updates.enabled !== undefined) webhook.enabled = updates.enabled;

    await webhook.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "webhook.updated",
      resourceType: "webhook",
      resourceId: webhook.id,
      metadata: updates,
    });

    return webhook;
  }

  /**
   * Delete webhook endpoint
   */
  static async deleteWebhook(companyId: string, webhookId: string, userId: string) {
    await connectDB();

    // Verify user has admin+ permissions
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.hasMinimumRole("admin")) {
      throw Errors.insufficientPermissions("admin", companyId);
    }

    // Find and delete webhook
    const webhook = await WebhookEndpoint.findOneAndDelete({ id: webhookId, companyId });
    if (!webhook) {
      throw Errors.notFound("Webhook");
    }

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "webhook.deleted",
      resourceType: "webhook",
      resourceId: webhook.id,
      metadata: {
        url: webhook.url,
      },
    });

    return { deleted: true };
  }

  /**
   * List webhooks for a company
   */
  static async listWebhooks(companyId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const webhooks = await WebhookEndpoint.findByCompany(companyId);

    return webhooks;
  }

  /**
   * Get webhook by ID
   */
  static async getWebhook(companyId: string, webhookId: string, userId: string) {
    await connectDB();

    // Verify user has access
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership) {
      throw Errors.companyAccessDenied(companyId);
    }

    const webhook = await WebhookEndpoint.findOne({ id: webhookId, companyId });
    if (!webhook) {
      throw Errors.notFound("Webhook");
    }

    return webhook;
  }

  /**
   * Trigger webhooks for an event
   */
  static async triggerWebhooks(
    companyId: string,
    event: WebhookEventTypeType,
    data: Record<string, unknown>
  ) {
    await connectDB();

    // Find all active webhooks for this event
    const webhooks = await WebhookEndpoint.findByEvent(companyId, event).select("+secret");

    if (webhooks.length === 0) {
      return { delivered: 0, failed: 0 };
    }

    // Prepare payload
    const payload: WebhookPayload = {
      id: `evt_${nanoid(16)}`,
      event,
      createdAt: Math.floor(Date.now() / 1000),
      data,
    };

    // Deliver to each webhook
    const results = await Promise.allSettled(
      webhooks.map((webhook) => this.deliverWebhook(webhook, payload))
    );

    // Count successes and failures
    const delivered = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { delivered, failed };
  }

  /**
   * Deliver webhook to a single endpoint
   */
  private static async deliverWebhook(
    webhook: any,
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<void> {
    const maxAttempts = 3;

    try {
      // Generate HMAC signature
      const signature = this.generateSignature(payload, webhook.secret);

      // Send webhook
      const startTime = Date.now();
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Id": payload.id,
          "User-Agent": "GiftCardMarketplace-Webhooks/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        await webhook.recordSuccess();
        console.log(`Webhook delivered successfully to ${webhook.url}`);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Webhook delivery failed (attempt ${attempt}/${maxAttempts}):`, errorMessage);

      // Record failure
      await webhook.recordFailure(errorMessage);

      // Retry with exponential backoff
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.deliverWebhook(webhook, payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadString);
    return hmac.digest("hex");
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Get available webhook events
   */
  static getAvailableEvents() {
    return [
      { event: "order.created", description: "Order is created" },
      { event: "order.paid", description: "Order payment is completed" },
      { event: "order.fulfilled", description: "Order is fulfilled and codes delivered" },
      { event: "order.failed", description: "Order payment failed" },
      { event: "order.refunded", description: "Order is refunded" },
      { event: "inventory.low", description: "Inventory is running low" },
      { event: "inventory.out", description: "Inventory is out of stock" },
    ];
  }
}
