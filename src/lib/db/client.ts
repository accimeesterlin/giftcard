/**
 * DynamoDB client configuration
 * Single table design with GSIs for multi-tenant access patterns
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  }),
  // For local development with DynamoDB Local
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

// Create Document client for easier usage
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "giftcard-marketplace";

// Export command types for use in repositories
export { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchGetCommand, BatchWriteCommand, TransactWriteCommand };

/**
 * Single table design key patterns:
 *
 * Entities:
 * - User: PK=USER#{userId}, SK=PROFILE
 * - Company: PK=COMPANY#{companyId}, SK=PROFILE
 * - Membership: PK=USER#{userId}, SK=MEMBERSHIP#{companyId}
 * - CompanyMembership: PK=COMPANY#{companyId}, SK=MEMBER#{userId}
 * - Listing: PK=COMPANY#{companyId}, SK=LISTING#{listingId}
 * - Order: PK=COMPANY#{companyId}, SK=ORDER#{orderId}
 * - AuditLog: PK=COMPANY#{companyId}, SK=AUDIT#{timestamp}#{id}
 *
 * GSI1 (for lookups by email, slug, etc.):
 * - PK: GSI1PK=EMAIL#{email}, SK: GSI1SK=USER
 * - PK: GSI1PK=SLUG#{slug}, SK: GSI1SK=COMPANY
 * - PK: GSI1PK=TOKEN#{invitationToken}, SK: GSI1SK=MEMBERSHIP
 *
 * GSI2 (for company-scoped queries):
 * - PK: GSI2PK=COMPANY#{companyId}#{entityType}, SK: GSI2SK=timestamp/id
 */

export const KeyPatterns = {
  user: {
    pk: (userId: string) => `USER#${userId}`,
    sk: () => "PROFILE",
  },
  company: {
    pk: (companyId: string) => `COMPANY#${companyId}`,
    sk: () => "PROFILE",
  },
  membership: {
    // User perspective
    userPk: (userId: string) => `USER#${userId}`,
    userSk: (companyId: string) => `MEMBERSHIP#${companyId}`,
    // Company perspective
    companyPk: (companyId: string) => `COMPANY#${companyId}`,
    companySk: (userId: string) => `MEMBER#${userId}`,
  },
  listing: {
    pk: (companyId: string) => `COMPANY#${companyId}`,
    sk: (listingId: string) => `LISTING#${listingId}`,
  },
  order: {
    pk: (companyId: string) => `COMPANY#${companyId}`,
    sk: (orderId: string) => `ORDER#${orderId}`,
  },
  auditLog: {
    pk: (companyId: string) => `COMPANY#${companyId}`,
    sk: (timestamp: number, id: string) => `AUDIT#${timestamp}#${id}`,
  },
  gsi1: {
    email: (email: string) => ({
      GSI1PK: `EMAIL#${email.toLowerCase()}`,
      GSI1SK: "USER",
    }),
    slug: (slug: string) => ({
      GSI1PK: `SLUG#${slug.toLowerCase()}`,
      GSI1SK: "COMPANY",
    }),
    token: (token: string) => ({
      GSI1PK: `TOKEN#${token}`,
      GSI1SK: "MEMBERSHIP",
    }),
  },
};
