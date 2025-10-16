"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { PaymentConfigDialog } from "@/components/payment-config-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [selectedProviderConfig, setSelectedProviderConfig] = useState<PaymentProvider | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<PaymentProvider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfigureClick = (provider: ProviderType) => {
    const config = providers.find((p) => p.provider === provider);
    setSelectedProvider(provider);
    setSelectedProviderConfig(config || null);
    setIsConfigDialogOpen(true);
  };

  const handleConfigSuccess = () => {
    setMessage({ type: "success", text: "Payment provider configured successfully!" });
    fetchCompanyAndProviders();
    setSelectedProvider(null);
    setSelectedProviderConfig(null);
  };

  const handleDeleteClick = (config: PaymentProvider) => {
    setProviderToDelete(config);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!company || !providerToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/payments/${providerToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMessage({ type: "success", text: "Payment provider deleted successfully!" });
        fetchCompanyAndProviders();
      } else {
        const result = await response.json();
        setMessage({
          type: "error",
          text: result.error?.message || "Failed to delete payment provider",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({ type: "error", text: "Failed to delete payment provider" });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
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
      fields: ["userId"],
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

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => handleConfigureClick(provider)}
                  >
                    {config ? "Edit" : "Configure"}
                  </Button>
                  {config && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteClick(config)}
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Configuration Dialog */}
      {company && (
        <PaymentConfigDialog
          open={isConfigDialogOpen}
          onOpenChange={setIsConfigDialogOpen}
          provider={selectedProvider}
          companyId={company.id}
          existingConfig={selectedProviderConfig}
          onSuccess={handleConfigSuccess}
        />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment provider configuration? This action
              cannot be undone. Customers will no longer be able to pay using{" "}
              {providerToDelete?.provider}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
