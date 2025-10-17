import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  id: string;
  companyId: string;
  provider: string;
  type: "email" | "payment" | "analytics" | "other";
  config: Record<string, any>;
  enabled: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: [
        // Email providers
        "zeptomail",
        "sendgrid",
        "mailgun",
        "mailchimp",
        "resend",
        "postmark",
        // Can add more providers as needed
      ],
    },
    type: {
      type: String,
      required: true,
      enum: ["email", "payment", "analytics", "other"],
      default: "email",
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique provider per company
IntegrationSchema.index({ companyId: 1, provider: 1 }, { unique: true });

// Static methods
IntegrationSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

IntegrationSchema.statics.findByProvider = function (
  companyId: string,
  provider: string
) {
  return this.findOne({ companyId, provider });
};

IntegrationSchema.statics.findActiveByType = function (
  companyId: string,
  type: string
) {
  return this.find({ companyId, type, enabled: true });
};

// Instance methods
IntegrationSchema.methods.enable = async function () {
  this.enabled = true;
  return this.save();
};

IntegrationSchema.methods.disable = async function () {
  this.enabled = false;
  return this.save();
};

IntegrationSchema.methods.updateConfig = async function (
  config: Record<string, any>
) {
  this.config = { ...this.config, ...config };
  return this.save();
};

const Integration =
  mongoose.models.Integration ||
  mongoose.model<IIntegration>("Integration", IntegrationSchema);

export default Integration;
