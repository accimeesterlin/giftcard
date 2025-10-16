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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Webhook, Copy, Trash2, Edit2, Send, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const createWebhookSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1, "At least one event is required"),
});

const updateWebhookSchema = z.object({
  url: z.string().url("Please enter a valid URL").optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1, "At least one event is required").optional(),
  enabled: z.boolean().optional(),
});

type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;
type UpdateWebhookFormData = z.infer<typeof updateWebhookSchema>;

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  secret: string;
  enabled: boolean;
  status: string;
  successCount: number;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  createdAt: string;
}

interface AvailableEvent {
  event: string;
  description: string;
}

export default function WebhooksPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    setValue: setValueCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      events: [],
    },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    watch: watchUpdate,
    setValue: setValueUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateWebhookFormData>({
    resolver: zodResolver(updateWebhookSchema),
  });

  const selectedCreateEvents = watchCreate("events") || [];
  const selectedUpdateEvents = watchUpdate("events") || [];

  useEffect(() => {
    fetchData();
    loadAvailableEvents();
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

          // Get webhooks
          const webhooksResponse = await fetch(`/api/v1/companies/${foundCompany.id}/webhooks`);
          if (webhooksResponse.ok) {
            const webhooksData = await webhooksResponse.json();
            setWebhooks(webhooksData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load webhooks" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableEvents = () => {
    // These should match WebhookService webhook events
    setAvailableEvents([
      { event: "order.created", description: "Order has been created" },
      { event: "order.paid", description: "Order payment successful" },
      { event: "order.fulfilled", description: "Order has been fulfilled" },
      { event: "order.failed", description: "Order has failed" },
      { event: "order.refunded", description: "Order has been refunded" },
      { event: "inventory.low", description: "Inventory is running low" },
      { event: "inventory.out", description: "Inventory is out of stock" },
    ]);
  };

  const onSubmitCreate = async (data: CreateWebhookFormData) => {
    if (!company) return;

    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create webhook");
      }

      setMessage({ type: "success", text: "Webhook created successfully" });
      setShowCreateDialog(false);
      resetCreate();
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create webhook",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const onSubmitUpdate = async (data: UpdateWebhookFormData) => {
    if (!company || !editingWebhook) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/webhooks/${editingWebhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to update webhook");
      }

      setMessage({ type: "success", text: "Webhook updated successfully" });
      setShowEditDialog(false);
      setEditingWebhook(null);
      resetUpdate();
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update webhook",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = (webhook: WebhookEndpoint) => {
    setEditingWebhook(webhook);
    resetUpdate({
      url: webhook.url,
      description: webhook.description || "",
      events: webhook.events,
      enabled: webhook.enabled,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (webhookId: string) => {
    setWebhookToDelete(webhookId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!company || !webhookToDelete) return;

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/webhooks/${webhookToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete webhook");
      }

      setMessage({ type: "success", text: "Webhook deleted successfully" });
      fetchData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete webhook",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setWebhookToDelete(null);
    }
  };

  const handleTest = async (webhookId: string) => {
    if (!company) return;

    setIsTesting(webhookId);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/webhooks/${webhookId}/test`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send test webhook");
      }

      setMessage({ type: "success", text: "Test webhook sent successfully" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send test webhook",
      });
    } finally {
      setIsTesting(null);
    }
  };

  const toggleCreateEvent = (event: string) => {
    const current = selectedCreateEvents;
    if (current.includes(event)) {
      setValueCreate(
        "events",
        current.filter((e) => e !== event)
      );
    } else {
      setValueCreate("events", [...current, event]);
    }
  };

  const toggleUpdateEvent = (event: string) => {
    const current = selectedUpdateEvents;
    if (current.includes(event)) {
      setValueUpdate(
        "events",
        current.filter((e) => e !== event)
      );
    } else {
      setValueUpdate("events", [...current, event]);
    }
  };

  const toggleSecretVisibility = (webhookId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(webhookId)) {
      newVisible.delete(webhookId);
    } else {
      newVisible.add(webhookId);
    }
    setVisibleSecrets(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard!" });
  };

  const getStatusBadge = (webhook: WebhookEndpoint) => {
    if (!webhook.enabled) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          DISABLED
        </Badge>
      );
    }

    if (webhook.status === "failed") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          FAILED
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        ACTIVE
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
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Receive real-time notifications when events happen in {company.displayName}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} variant="default">
          <Webhook className="mr-2 h-4 w-4" />
          Create Webhook
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
          <CardTitle>Webhook Endpoints ({webhooks.length})</CardTitle>
          <CardDescription>
            Configure webhook endpoints to receive event notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Success/Failure</TableHead>
                <TableHead>Last Delivery</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No webhooks yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm break-all max-w-xs">{webhook.url}</div>
                        {webhook.description && (
                          <div className="text-sm text-muted-foreground">{webhook.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {visibleSecrets.has(webhook.id)
                              ? webhook.secret
                              : "•".repeat(20)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {visibleSecrets.has(webhook.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(webhook.secret)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600 dark:text-green-400">
                          ✓ {webhook.successCount}
                        </div>
                        <div className="text-destructive">✗ {webhook.failureCount}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {webhook.lastSuccessAt ? (
                        <div>
                          <div className="text-green-600 dark:text-green-400">
                            {format(new Date(webhook.lastSuccessAt), "MMM d, HH:mm")}
                          </div>
                        </div>
                      ) : webhook.lastFailureAt ? (
                        <div className="text-destructive">
                          {format(new Date(webhook.lastFailureAt), "MMM d, HH:mm")}
                        </div>
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTest(webhook.id)}
                          disabled={isTesting === webhook.id}
                          title="Send test event"
                        >
                          {isTesting === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(webhook)}
                          title="Edit webhook"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(webhook.id)}
                          title="Delete webhook"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Create a new webhook endpoint to receive real-time event notifications
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="create-url">Webhook URL *</Label>
              <Input
                id="create-url"
                {...registerCreate("url")}
                placeholder="https://example.com/webhooks"
              />
              {errorsCreate.url && (
                <p className="text-sm text-destructive">{errorsCreate.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                {...registerCreate("description")}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Events * (Select at least one)</Label>
              {errorsCreate.events && (
                <p className="text-sm text-destructive">{errorsCreate.events.message}</p>
              )}
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {availableEvents.map((event) => (
                  <div key={event.event} className="flex items-start space-x-2">
                    <Checkbox
                      id={`create-${event.event}`}
                      checked={selectedCreateEvents.includes(event.event)}
                      onCheckedChange={() => toggleCreateEvent(event.event)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`create-${event.event}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <code className="text-xs">{event.event}</code>
                      </label>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                  "Create Webhook"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update webhook endpoint configuration</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="update-url">Webhook URL *</Label>
              <Input
                id="update-url"
                {...registerUpdate("url")}
                placeholder="https://example.com/webhooks"
              />
              {errorsUpdate.url && (
                <p className="text-sm text-destructive">{errorsUpdate.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-description">Description</Label>
              <Input
                id="update-description"
                {...registerUpdate("description")}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Events * (Select at least one)</Label>
              {errorsUpdate.events && (
                <p className="text-sm text-destructive">{errorsUpdate.events.message}</p>
              )}
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {availableEvents.map((event) => (
                  <div key={event.event} className="flex items-start space-x-2">
                    <Checkbox
                      id={`update-${event.event}`}
                      checked={selectedUpdateEvents.includes(event.event)}
                      onCheckedChange={() => toggleUpdateEvent(event.event)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`update-${event.event}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <code className="text-xs">{event.event}</code>
                      </label>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-md p-4">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Receive webhook events at this endpoint
                </p>
              </div>
              <Switch
                id="enabled"
                checked={watchUpdate("enabled")}
                onCheckedChange={(checked) => setValueUpdate("enabled", checked)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingWebhook(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Webhook"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone and will
              stop receiving events at this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
