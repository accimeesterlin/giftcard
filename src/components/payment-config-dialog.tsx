"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const paymentProviderSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  accountId: z.string().optional(),
  userId: z.string().optional(),
  testMode: z.boolean(),
  enabled: z.boolean(),
});

type PaymentProviderFormData = z.infer<typeof paymentProviderSchema>;

type ProviderType = "stripe" | "paypal" | "crypto" | "pgpay";

interface PaymentProvider {
  id: string;
  provider: string;
  status: string;
  publicKey: string | null;
  accountId: string | null;
  userId?: string | null;
  testMode: boolean;
  enabled: boolean;
  lastTestedAt: string | null;
}

interface PaymentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ProviderType | null;
  companyId: string;
  existingConfig?: PaymentProvider | null;
  onSuccess: () => void;
}

const providerDetails: Record<ProviderType, { name: string; description: string; fields: string[] }> = {
  stripe: {
    name: "Stripe",
    description: "Accept credit cards, debit cards, and digital wallets",
    fields: ["publicKey", "secretKey", "webhookSecret"],
  },
  paypal: {
    name: "PayPal",
    description: "Accept PayPal and credit card payments",
    fields: ["publicKey", "secretKey", "webhookSecret"],
  },
  crypto: {
    name: "Crypto Payments",
    description: "Accept Bitcoin, Ethereum, and other cryptocurrencies",
    fields: ["walletAddress"],
  },
  pgpay: {
    name: "PGPay",
    description: "Regional payment gateway",
    fields: ["userId"],
  },
};

export function PaymentConfigDialog({
  open,
  onOpenChange,
  provider,
  companyId,
  existingConfig,
  onSuccess,
}: PaymentConfigDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentProviderFormData>({
    resolver: zodResolver(paymentProviderSchema),
    defaultValues: {
      testMode: true,
      enabled: false,
    },
  });

  const testMode = watch("testMode");
  const enabled = watch("enabled");

  useEffect(() => {
    if (open && existingConfig) {
      // Populate form with existing config when editing
      reset({
        publicKey: existingConfig.publicKey || "",
        secretKey: "", // Never populate secret key for security
        webhookSecret: "", // Never populate webhook secret for security
        accountId: existingConfig.accountId || "",
        userId: existingConfig.userId || "",
        testMode: existingConfig.testMode,
        enabled: existingConfig.enabled,
      });
    } else if (!open) {
      // Reset form when dialog closes
      reset({
        publicKey: "",
        secretKey: "",
        webhookSecret: "",
        accountId: "",
        userId: "",
        testMode: true,
        enabled: false,
      });
      setMessage(null);
    }
  }, [open, existingConfig, reset]);

  const onSubmit = async (data: PaymentProviderFormData) => {
    if (!provider) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${companyId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to save payment provider");
      }

      setMessage({ type: "success", text: "Payment provider configured successfully!" });

      // Close dialog and notify parent after a short delay
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save payment provider",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!provider) return null;

  const details = providerDetails[provider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingConfig ? "Edit" : "Configure"} {details.name}</DialogTitle>
          <DialogDescription>
            {details.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {message && (
            <div
              className={`p-3 rounded-md text-sm mb-4 ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            {/* PGPay UserID Field */}
            {details.fields.includes("userId") && (
              <div className="space-y-2">
                <Label htmlFor="userId">
                  User ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="userId"
                  {...register("userId", { required: "User ID is required for PGPay" })}
                  placeholder="e.g., 5f56dfa3-a415-4818-8275-44fc63ece3fd"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Your PGPay User ID (receiver of funds)
                </p>
                {errors.userId && (
                  <p className="text-xs text-destructive">{errors.userId.message}</p>
                )}
              </div>
            )}

            {/* Public Key / Client ID */}
            {details.fields.includes("publicKey") && (
              <div className="space-y-2">
                <Label htmlFor="publicKey">
                  {provider === "stripe" ? "Publishable Key" : "Client ID"}
                </Label>
                <Input
                  id="publicKey"
                  {...register("publicKey")}
                  placeholder={
                    provider === "stripe"
                      ? "pk_test_..."
                      : provider === "paypal"
                        ? "AYSq3..."
                        : "Your client ID"
                  }
                  disabled={isSaving}
                />
                {errors.publicKey && (
                  <p className="text-xs text-destructive">{errors.publicKey.message}</p>
                )}
              </div>
            )}

            {/* Secret Key */}
            {details.fields.includes("secretKey") && (
              <div className="space-y-2">
                <Label htmlFor="secretKey">
                  {provider === "stripe" ? "Secret Key" : "Client Secret"}
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  {...register("secretKey")}
                  placeholder={
                    provider === "stripe"
                      ? "sk_test_..."
                      : provider === "paypal"
                        ? "EHk9..."
                        : "Your client secret"
                  }
                  disabled={isSaving}
                />
                {errors.secretKey && (
                  <p className="text-xs text-destructive">{errors.secretKey.message}</p>
                )}
              </div>
            )}

            {/* Webhook Secret */}
            {details.fields.includes("webhookSecret") && (
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  {...register("webhookSecret")}
                  placeholder="whsec_..."
                  disabled={isSaving}
                />
                {errors.webhookSecret && (
                  <p className="text-xs text-destructive">{errors.webhookSecret.message}</p>
                )}
              </div>
            )}

            {/* Wallet Address (for crypto) */}
            {details.fields.includes("walletAddress") && (
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  {...register("accountId")}
                  placeholder="0x..."
                  disabled={isSaving}
                />
                {errors.accountId && (
                  <p className="text-xs text-destructive">{errors.accountId.message}</p>
                )}
              </div>
            )}

            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="testMode">Test Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use test credentials (recommended for development)
                </p>
              </div>
              <Switch
                id="testMode"
                checked={testMode}
                onCheckedChange={(checked) => setValue("testMode", checked)}
                disabled={isSaving}
              />
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Provider</Label>
                <p className="text-xs text-muted-foreground">
                  Allow customers to use this payment method
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={(checked) => setValue("enabled", checked)}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
