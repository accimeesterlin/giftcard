import { Schema, model, models, Document } from "mongoose";
import { nanoid } from "nanoid";

export interface WebhookLogDocument extends Document {
  id: string;
  webhookId: string;
  companyId: string;
  event: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseStatus: number | null;
  responseHeaders: Record<string, string> | null;
  responseBody: any;
  success: boolean;
  errorMessage: string | null;
  duration: number; // in milliseconds
  createdAt: Date;
  updatedAt: Date;
}

const WebhookLogSchema = new Schema<WebhookLogDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `whl_${nanoid(16)}`,
    },
    webhookId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      default: "POST",
    },
    requestHeaders: {
      type: Map,
      of: String,
      default: {},
    },
    requestBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseHeaders: {
      type: Map,
      of: String,
      default: null,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient querying
WebhookLogSchema.index({ companyId: 1, createdAt: -1 });
WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });
WebhookLogSchema.index({ companyId: 1, success: 1, createdAt: -1 });
WebhookLogSchema.index({ webhookId: 1, event: 1, createdAt: -1 });

// TTL index to automatically delete old logs after 90 days
WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static methods
WebhookLogSchema.statics.findByWebhook = function (webhookId: string, limit = 100) {
  return this.find({ webhookId }).sort({ createdAt: -1 }).limit(limit);
};

WebhookLogSchema.statics.findByCompany = function (companyId: string, limit = 100) {
  return this.find({ companyId }).sort({ createdAt: -1 }).limit(limit);
};

export const WebhookLog =
  models.WebhookLog || model<WebhookLogDocument>("WebhookLog", WebhookLogSchema);
