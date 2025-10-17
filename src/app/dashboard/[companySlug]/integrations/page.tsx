"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Mail, CheckCircle, XCircle, Settings, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
}

interface Integration {
  id: string;
  companyId: string;
  provider: string;
  config: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: "zeptomail",
    name: "ZeptoMail",
    description: "Transactional email service by Zoho with high deliverability",
    icon: "📧",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Your ZeptoMail API key", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Reliable email delivery platform by Twilio",
    icon: "✉️",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Your SendGrid API key", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Powerful email automation platform for developers",
    icon: "🚀",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Your Mailgun API key", required: true },
      { name: "domain", label: "Domain", type: "text", placeholder: "mg.yourdomain.com", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp Transactional",
    description: "Marketing and transactional email service (formerly Mandrill)",
    icon: "🐵",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Your Mailchimp API key", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API for developers",
    icon: "📮",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Your Resend API key", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
  {
    id: "postmark",
    name: "Postmark",
    description: "Fast and reliable transactional email delivery",
    icon: "📬",
    fields: [
      { name: "serverToken", label: "Server Token", type: "password", placeholder: "Your Postmark server token", required: true },
      { name: "fromEmail", label: "From Email", type: "email", placeholder: "noreply@yourdomain.com", required: true },
      { name: "fromName", label: "From Name", type: "text", placeholder: "Your Company Name", required: true },
    ],
  },
];

export default function IntegrationsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [companyId, setCompanyId] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Fetch company ID from slug
  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const response = await fetch(`/api/v1/companies/slug/${companySlug}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch company");
        }
        const data = await response.json();
        setCompanyId(data.company.id);
      } catch (error) {
        console.error("Error fetching company:", error);
        setError(error instanceof Error ? error.message : "Failed to load company information");
      }
    };

    if (companySlug) {
      fetchCompanyId();
    }
  }, [companySlug]);

  // Fetch integrations from API
  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!companyId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/companies/${companyId}/integrations`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch integrations");
        }

        const data = await response.json();
        setIntegrations(data.data || []);
      } catch (error) {
        console.error("Error fetching integrations:", error);
        setError(error instanceof Error ? error.message : "Failed to load integrations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, [companyId]);

  const handleConfigureProvider = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    setError(""); // Clear any previous errors

    // Load existing integration data if available
    const existingIntegration = getIntegration(provider.id);
    if (existingIntegration) {
      setFormData(existingIntegration.config);
    } else {
      setFormData({});
    }

    setIsDialogOpen(true);
  };

  const handleSaveIntegration = async () => {
    if (!selectedProvider || !companyId) return;

    // Validate required fields
    const missingFields = selectedProvider.fields
      .filter((field) => field.required && !formData[field.name])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const existingIntegration = getIntegration(selectedProvider.id);

      let response;
      if (existingIntegration) {
        // Update existing integration
        response = await fetch(
          `/api/v1/companies/${companyId}/integrations/${existingIntegration.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              config: formData,
            }),
          }
        );
      } else {
        // Create new integration
        response = await fetch(`/api/v1/companies/${companyId}/integrations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: selectedProvider.id,
            type: "email",
            config: formData,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save integration");
      }

      // Refresh integrations list
      const integrationsResponse = await fetch(
        `/api/v1/companies/${companyId}/integrations`
      );
      if (integrationsResponse.ok) {
        const data = await integrationsResponse.json();
        setIntegrations(data.data || []);
      }

      setIsDialogOpen(false);
      setSelectedProvider(null);
      setFormData({});
    } catch (error) {
      console.error("Failed to save integration:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save integration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isIntegrationConfigured = (providerId: string) => {
    return integrations.some((integration) => integration.provider === providerId);
  };

  const getIntegration = (providerId: string) => {
    return integrations.find((integration) => integration.provider === providerId);
  };

  const handleToggleIntegration = async (integrationId: string, currentStatus: boolean) => {
    if (!companyId) return;

    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/integrations/${integrationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: !currentStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle integration");
      }

      // Refresh integrations list
      const integrationsResponse = await fetch(
        `/api/v1/companies/${companyId}/integrations`
      );
      if (integrationsResponse.ok) {
        const data = await integrationsResponse.json();
        setIntegrations(data.data || []);
      }
    } catch (error) {
      console.error("Failed to toggle integration:", error);
      setError(
        error instanceof Error ? error.message : "Failed to toggle integration"
      );
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!companyId) return;
    if (!confirm("Are you sure you want to delete this integration?")) return;

    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/integrations/${integrationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete integration");
      }

      // Refresh integrations list
      const integrationsResponse = await fetch(
        `/api/v1/companies/${companyId}/integrations`
      );
      if (integrationsResponse.ok) {
        const data = await integrationsResponse.json();
        setIntegrations(data.data || []);
      }
    } catch (error) {
      console.error("Failed to delete integration:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete integration"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect third-party services to enhance your marketplace functionality
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Providers Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Email Providers</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure email services for sending transactional emails like order confirmations and gift card deliveries
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EMAIL_PROVIDERS.map((provider) => {
            const integration = getIntegration(provider.id);
            const isConfigured = isIntegrationConfigured(provider.id);

            return (
              <Card key={provider.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{provider.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                    </div>
                    {isConfigured && (
                      <Badge variant={integration?.enabled ? "default" : "secondary"} className="ml-2">
                        {integration?.enabled ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-2">{provider.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleConfigureProvider(provider)}
                      variant={isConfigured ? "outline" : "default"}
                      className="w-full"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {isConfigured ? "Manage" : "Configure"}
                    </Button>

                    {isConfigured && integration && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleIntegration(integration.id, integration.enabled)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {integration.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteIntegration(integration.id)}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && (
                <>
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  Configure {selectedProvider.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {selectedProvider?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveIntegration} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
