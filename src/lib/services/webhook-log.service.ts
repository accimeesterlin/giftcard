import { connectDB } from "@/lib/db/mongodb";
import { WebhookLog } from "@/lib/db/models/WebhookLog";
import WebhookEndpoint from "@/lib/db/models/WebhookEndpoint";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import { Errors } from "@/lib/errors";

export interface WebhookLogFilters {
  search?: string;
  success?: boolean;
  event?: string;
  limit?: number;
  offset?: number;
}

export class WebhookLogService {
  /**
   * Get webhook logs for a specific webhook endpoint with pagination and filters
   */
  static async getByWebhook(
    companyId: string,
    webhookId: string,
    userId: string,
    filters: WebhookLogFilters = {}
  ) {
    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Verify webhook belongs to this company
    const webhook = await WebhookEndpoint.findOne({ id: webhookId, companyId });
    if (!webhook) {
      throw Errors.notFound("Webhook", webhookId);
    }

    const { search, success, event, limit = 50, offset = 0 } = filters;

    // Build query
    const query: any = { webhookId };

    if (success !== undefined) {
      query.success = success;
    }

    if (event) {
      query.event = event;
    }

    if (search) {
      query.$or = [
        { event: { $regex: search, $options: "i" } },
        { errorMessage: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await WebhookLog.countDocuments(query);

    // Get logs with pagination
    const logs = await WebhookLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return {
      data: logs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    };
  }

  /**
   * Get all webhook logs for a company with pagination and filters
   */
  static async getByCompany(
    companyId: string,
    userId: string,
    filters: WebhookLogFilters = {}
  ) {
    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    const { search, success, event, limit = 50, offset = 0 } = filters;

    // Build query
    const query: any = { companyId };

    if (success !== undefined) {
      query.success = success;
    }

    if (event) {
      query.event = event;
    }

    if (search) {
      query.$or = [
        { event: { $regex: search, $options: "i" } },
        { errorMessage: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await WebhookLog.countDocuments(query);

    // Get logs with pagination
    const logs = await WebhookLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return {
      data: logs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    };
  }

  /**
   * Get a single webhook log by ID
   */
  static async getById(companyId: string, logId: string, userId: string) {
    await connectDB();

    // Verify user has access to this company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    const log = await WebhookLog.findOne({ id: logId, companyId });
    if (!log) {
      throw Errors.notFound("Webhook Log", logId);
    }

    return log;
  }

  /**
   * Create a webhook log entry (used internally by webhook service)
   */
  static async create(data: {
    webhookId: string;
    companyId: string;
    event: string;
    url: string;
    method?: string;
    requestHeaders: Record<string, string>;
    requestBody: any;
    responseStatus?: number | null;
    responseHeaders?: Record<string, string> | null;
    responseBody?: any;
    success: boolean;
    errorMessage?: string | null;
    duration: number;
  }) {
    await connectDB();

    const log = await WebhookLog.create({
      webhookId: data.webhookId,
      companyId: data.companyId,
      event: data.event,
      url: data.url,
      method: data.method || "POST",
      requestHeaders: data.requestHeaders,
      requestBody: data.requestBody,
      responseStatus: data.responseStatus || null,
      responseHeaders: data.responseHeaders || null,
      responseBody: data.responseBody || null,
      success: data.success,
      errorMessage: data.errorMessage || null,
      duration: data.duration,
    });

    return log;
  }

  /**
   * Delete old webhook logs (cleanup job)
   */
  static async deleteOlderThan(days: number) {
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await WebhookLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }
}
