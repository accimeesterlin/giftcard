/**
 * Customer Service
 * Business logic for customer operations
 */

import connectDB from "@/lib/db/mongodb";
import Customer from "@/lib/db/models/Customer";
import CompanyMembership from "@/lib/db/models/CompanyMembership";
import AuditLog from "@/lib/db/models/AuditLog";
import { Errors } from "@/lib/errors";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validation/schemas";
import { WebhookService } from "./webhook.service";

export class CustomerService {
  /**
   * Create a new customer for a company
   */
  static async create(
    companyId: string,
    userId: string,
    input: CreateCustomerInput
  ) {
    await connectDB();

    // Verify user has access to company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    // Check if customer with this email already exists for this company
    const existing = await Customer.findByEmail(companyId, input.email);
    if (existing) {
      throw Errors.conflict("Customer", "email", input.email);
    }

    // Create customer
    const customer = await Customer.create({
      companyId,
      email: input.email.toLowerCase(),
      name: input.name || null,
      phone: input.phone || null,
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchaseAt: null,
      userId: null,
      createdBy: userId,
    });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "customer.created",
      resourceType: "customer",
      resourceId: customer.id,
      metadata: {
        email: customer.email,
        name: customer.name,
      },
    });

    // Trigger webhooks
    await WebhookService.triggerWebhooks(companyId, "customer.created", {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });

    return customer;
  }

  /**
   * Get all customers for a company
   */
  static async getByCompany(companyId: string, userId: string) {
    await connectDB();

    // Verify user has access to company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    const customers = await Customer.findByCompany(companyId);
    return customers;
  }

  /**
   * Get customer by ID
   */
  static async getById(companyId: string, customerId: string, userId: string) {
    await connectDB();

    // Verify user has access to company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    const customer = await Customer.findOne({ id: customerId, companyId });
    if (!customer) {
      throw Errors.notFound("Customer");
    }

    return customer;
  }

  /**
   * Update customer
   */
  static async update(
    companyId: string,
    customerId: string,
    userId: string,
    updates: UpdateCustomerInput
  ) {
    await connectDB();

    // Verify user has access to company
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    const customer = await Customer.findOne({ id: customerId, companyId });
    if (!customer) {
      throw Errors.notFound("Customer");
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      changes.name = { from: customer.name, to: updates.name };
      customer.name = updates.name;
    }

    if (updates.phone !== undefined) {
      changes.phone = { from: customer.phone, to: updates.phone };
      customer.phone = updates.phone;
    }

    await customer.save();

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "customer.updated",
      resourceType: "customer",
      resourceId: customer.id,
      changes,
    });

    // Trigger webhooks
    await WebhookService.triggerWebhooks(companyId, "customer.updated", {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        updatedAt: customer.updatedAt,
      },
      changes,
    });

    return customer;
  }

  /**
   * Delete customer
   */
  static async delete(companyId: string, customerId: string, userId: string) {
    await connectDB();

    // Verify user has access to company with minimum manager role
    const membership = await CompanyMembership.findByUserAndCompany(userId, companyId);
    if (!membership || !membership.isActive()) {
      throw Errors.companyAccessDenied(companyId);
    }

    if (!membership.hasMinimumRole("manager")) {
      throw Errors.insufficientPermissions("manager", companyId);
    }

    const customer = await Customer.findOne({ id: customerId, companyId });
    if (!customer) {
      throw Errors.notFound("Customer");
    }

    await Customer.deleteOne({ id: customerId, companyId });

    // Create audit log
    await AuditLog.createLog({
      companyId,
      userId,
      action: "customer.deleted",
      resourceType: "customer",
      resourceId: customer.id,
      metadata: {
        email: customer.email,
        name: customer.name,
      },
    });

    // Trigger webhooks
    await WebhookService.triggerWebhooks(companyId, "customer.deleted", {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });

    return { success: true };
  }
}
