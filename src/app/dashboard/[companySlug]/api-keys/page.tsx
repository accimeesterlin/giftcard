"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Key, Copy, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  environment: z.enum(["test", "live"]),
  rateLimit: z.coerce.number().int().positive().optional(),
});

type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scopes: string[];
  environment: string;
  status: string;
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface AvailableScope {
  scope: string;
  description: string;
}

export default function ApiKeysPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [availableScopes, setAvailableScopes] = useState<AvailableScope[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      environment: "test",
      scopes: [],
      rateLimit: 60,
    },
  });

  const selectedScopes = watch("scopes") || [];

  useEffect(() => {
    fetchData();
    loadAvailableScopes();
  }, [companySlug]);

  const fetchData = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get API keys
          const keysResponse = await fetch(`/api/v1/companies/${foundCompany.id}/api-keys`);
          if (keysResponse.ok) {
            const keysData = await keysResponse.json();
            setApiKeys(keysData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load API keys" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableScopes = () => {
    // These should match ApiKeyService.getAvailableScopes()
    setAvailableScopes([
      { scope: "orders:read", description: "Read orders" },
      { scope: "orders:write", description: "Create orders" },
      { scope: "orders:fulfill", description: "Fulfill orders" },
      { scope: "orders:refund", description: "Refund orders" },
      { scope: "inventory:read", description: "Read inventory" },
      { scope: "inventory:write", description: "Add inventory" },
      { scope: "listings:read", description: "Read listings" },
      { scope: "listings:write", description: "Create and update listings" },
      { scope: "webhooks:read", description: "Read webhook configurations" },
      { scope: "webhooks:write", description: "Manage webhooks" },
      { scope: "*", description: "Full API access (use with caution)" },
    ]);
  };

  const onSubmit = async (data: CreateApiKeyFormData) => {
    if (!company) return;

    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create API key");
      }

      // Show the new API key in a dialog (only shown once!)
      setNewApiKey(result.data.apiKey);
      setShowKeyDialog(true);
      setShowCreateDialog(false);
      reset();
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create API key",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!company || !confirm("Are you sure you want to revoke this API key? This cannot be undone."))
      return;

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to revoke API key");
      }

      setMessage({ type: "success", text: "API key revoked successfully" });
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to revoke API key",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard!" });
  };

  const toggleScope = (scope: string) => {
    const current = selectedScopes;
    if (current.includes(scope)) {
      setValue(
        "scopes",
        current.filter((s) => s !== scope)
      );
    } else {
      setValue("scopes", [...current, scope]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: any; icon: any }> = {
      active: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      revoked: {
        variant: "secondary",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      expired: {
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
    };

    const config = styles[status] || styles.active;

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.toUpperCase()}
      </Badge>
    );
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
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Manage API keys for programmatic access to {company.displayName}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Key className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>API Keys ({apiKeys.length})</CardTitle>
          <CardDescription>
            Use API keys to authenticate API requests from your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{key.name}</div>
                        {key.description && (
                          <div className="text-sm text-muted-foreground">{key.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm font-mono">{key.keyPrefix}...</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{key.environment.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {key.scopes.length} scope{key.scopes.length !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsedAt
                        ? format(new Date(key.lastUsedAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {key.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access. The key will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="My API Key" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Environment *</Label>
              <RadioGroup defaultValue="test">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="test"
                    id="test"
                    {...register("environment")}
                  />
                  <Label htmlFor="test" className="font-normal">
                    Test - For development and testing
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="live"
                    id="live"
                    {...register("environment")}
                  />
                  <Label htmlFor="live" className="font-normal">
                    Live - For production use
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Scopes * (Select at least one)</Label>
              {errors.scopes && <p className="text-sm text-destructive">{errors.scopes.message}</p>}
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {availableScopes.map((scope) => (
                  <div key={scope.scope} className="flex items-start space-x-2">
                    <Checkbox
                      id={scope.scope}
                      checked={selectedScopes.includes(scope.scope)}
                      onCheckedChange={() => toggleScope(scope.scope)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={scope.scope}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <code className="text-xs">{scope.scope}</code>
                      </label>
                      <p className="text-xs text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
              <Input
                id="rateLimit"
                type="number"
                {...register("rateLimit")}
                placeholder="60"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create API Key"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show New API Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created!</DialogTitle>
            <DialogDescription>
              Please save this API key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <code className="text-sm font-mono break-all">{newApiKey}</code>
            </div>
            <Button
              onClick={() => newApiKey && copyToClipboard(newApiKey)}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>I've Saved the Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
