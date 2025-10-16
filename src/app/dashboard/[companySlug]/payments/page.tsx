"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const paymentProviderSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  accountId: z.string().optional(),
  testMode: z.boolean(),
  enabled: z.boolean(),
});

type PaymentProviderFormData = z.infer<typeof paymentProviderSchema>;

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface PaymentProvider {
  id: string;
  provider: string;
  status: string;
  publicKey: string | null;
  accountId: string | null;
  testMode: boolean;
  enabled: boolean;
  lastTestedAt: string | null;
}

type ProviderType = "stripe" | "paypal" | "crypto" | "pgpay";

export default function PaymentSettingsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentProviderFormData>({
    resolver: zodResolver(paymentProviderSchema),
  });

  useEffect(() => {
    fetchCompanyAndProviders();
  }, [companySlug]);

  const fetchCompanyAndProviders = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get payment providers
          const providersResponse = await fetch(
            `/api/v1/companies/${foundCompany.id}/payments`
          );
          if (providersResponse.ok) {
            const providersData = await providersResponse.json();
            setProviders(providersData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load payment settings" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PaymentProviderFormData) => {
    if (!company || !selectedProvider) return;

    setIsSaving(selectedProvider);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to save payment provider");
      }

      setMessage({ type: "success", text: "Payment provider configured successfully!" });
      fetchCompanyAndProviders();
      setSelectedProvider(null);
      reset();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save payment provider",
      });
    } finally {
      setIsSaving(null);
    }
  };

  const getProviderStatus = (provider: string) => {
    const config = providers.find((p) => p.provider === provider);
    if (!config) {
      return { status: "disconnected", badge: "Not Configured", variant: "secondary" as const };
    }
    if (config.enabled && config.status === "connected") {
      return { status: "connected", badge: "Active", variant: "default" as const };
    }
    if (config.status === "connected") {
      return { status: "connected", badge: "Configured", variant: "outline" as const };
    }
    return { status: config.status, badge: config.status, variant: "secondary" as const };
  };

  const getProviderIcon = (provider: string) => {
    const status = getProviderStatus(provider).status;
    if (status === "connected") {
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    if (status === "error") {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const providerDetails = {
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
      fields: ["publicKey", "secretKey", "accountId"],
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure payment providers to accept payments for {company.displayName}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Payment Providers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(providerDetails) as ProviderType[]).map((provider) => {
          const details = providerDetails[provider];
          const { badge, variant } = getProviderStatus(provider);
          const config = providers.find((p) => p.provider === provider);

          return (
            <Card
              key={provider}
              className={selectedProvider === provider ? "border-primary" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{details.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {details.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getProviderIcon(provider)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={variant}>{badge}</Badge>
                  {config?.testMode && (
                    <Badge variant="outline" className="text-xs">
                      Test Mode
                    </Badge>
                  )}
                </div>

                {config && config.status === "connected" && (
                  <div className="text-sm space-y-1">
                    {config.publicKey && (
                      <p className="text-muted-foreground">
                        Public Key: {config.publicKey.slice(0, 20)}...
                      </p>
                    )}
                    {config.accountId && (
                      <p className="text-muted-foreground">
                        Account ID: {config.accountId}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant={selectedProvider === provider ? "secondary" : "default"}
                  className="w-full"
                  onClick={() =>
                    setSelectedProvider(selectedProvider === provider ? null : provider)
                  }
                >
                  {selectedProvider === provider ? "Cancel" : "Configure"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Form */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Configure {providerDetails[selectedProvider].name}</CardTitle>
            <CardDescription>
              Enter your {providerDetails[selectedProvider].name} credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Public Key / Client ID */}
              {providerDetails[selectedProvider].fields.includes("publicKey") && (
                <div className="space-y-2">
                  <Label htmlFor="publicKey">
                    {selectedProvider === "stripe" ? "Publishable Key" : "Client ID"}
                  </Label>
                  <Input
                    id="publicKey"
                    {...register("publicKey")}
                    placeholder={
                      selectedProvider === "stripe"
                        ? "pk_test_..."
                        : selectedProvider === "paypal"
                          ? "AYSq3..."
                          : "Your client ID"
                    }
                  />
                  {errors.publicKey && (
                    <p className="text-sm text-destructive">{errors.publicKey.message}</p>
                  )}
                </div>
              )}

              {/* Secret Key */}
              {providerDetails[selectedProvider].fields.includes("secretKey") && (
                <div className="space-y-2">
                  <Label htmlFor="secretKey">
                    {selectedProvider === "stripe" ? "Secret Key" : "Client Secret"}
                  </Label>
                  <Input
                    id="secretKey"
                    type="password"
                    {...register("secretKey")}
                    placeholder={
                      selectedProvider === "stripe"
                        ? "sk_test_..."
                        : selectedProvider === "paypal"
                          ? "EHk9..."
                          : "Your client secret"
                    }
                  />
                  {errors.secretKey && (
                    <p className="text-sm text-destructive">{errors.secretKey.message}</p>
                  )}
                </div>
              )}

              {/* Webhook Secret */}
              {providerDetails[selectedProvider].fields.includes("webhookSecret") && (
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    {...register("webhookSecret")}
                    placeholder="whsec_..."
                  />
                  {errors.webhookSecret && (
                    <p className="text-sm text-destructive">{errors.webhookSecret.message}</p>
                  )}
                </div>
              )}

              {/* Account ID */}
              {providerDetails[selectedProvider].fields.includes("accountId") && (
                <div className="space-y-2">
                  <Label htmlFor="accountId">Merchant/Account ID (Optional)</Label>
                  <Input
                    id="accountId"
                    {...register("accountId")}
                    placeholder="Your merchant ID"
                  />
                  {errors.accountId && (
                    <p className="text-sm text-destructive">{errors.accountId.message}</p>
                  )}
                </div>
              )}

              {/* Wallet Address (for crypto) */}
              {providerDetails[selectedProvider].fields.includes("walletAddress") && (
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    {...register("accountId")} // Reuse accountId field
                    placeholder="0x..."
                  />
                  {errors.accountId && (
                    <p className="text-sm text-destructive">{errors.accountId.message}</p>
                  )}
                </div>
              )}

              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="testMode">Test Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use test credentials (recommended for development)
                  </p>
                </div>
                <Switch id="testMode" {...register("testMode")} defaultChecked />
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to use this payment method
                  </p>
                </div>
                <Switch id="enabled" {...register("enabled")} />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSaving === selectedProvider}
                  className="flex-1"
                >
                  {isSaving === selectedProvider ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Payment Provider Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            <strong>Note:</strong> This is a development environment. In production, credentials
            would be encrypted and securely stored.
          </p>
          <p>
            <strong>Webhook URLs:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              Stripe: <code>https://yourdomain.com/api/v1/webhooks/stripe</code>
            </li>
            <li>
              PayPal: <code>https://yourdomain.com/api/v1/webhooks/paypal</code>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
