"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Search, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface WebhookLog {
  id: string;
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
  duration: number;
  createdAt: string;
}

interface WebhookLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
  companyId: string;
  isEmbedded?: boolean;
}

export function WebhookLogsDialog({
  open,
  onOpenChange,
  webhookId,
  companyId,
  isEmbedded = false,
}: WebhookLogsDialogProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const limit = 20;

  useEffect(() => {
    if ((open || isEmbedded) && webhookId) {
      fetchLogs();
    }
  }, [open, isEmbedded, webhookId, searchQuery, successFilter, offset]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (successFilter !== "all") {
        params.append("success", successFilter);
      }

      const response = await fetch(
        `/api/v1/companies/${companyId}/webhooks/${webhookId}/logs?${params.toString()}`
      );

      if (response.ok) {
        const result = await response.json();
        setLogs(result.data);
        setTotal(result.meta.total);
        setHasMore(result.meta.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch webhook logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0); // Reset to first page
  };

  const handleFilterChange = (value: string) => {
    setSuccessFilter(value);
    setOffset(0); // Reset to first page
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const getStatusBadge = (log: WebhookLog) => {
    if (log.success) {
      return (
        <Badge variant="default" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Success
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  };

  const content = (
    <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by event, error message, or URL..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={successFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Success Only</SelectItem>
                <SelectItem value="false">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No logs yet</p>
              <p className="text-sm">Webhook delivery logs will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                return (
                  <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleRow(log.id)}>
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(log)}
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {log.event}
                                </code>
                                {log.responseStatus && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.responseStatus}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm:ss a")} • {log.duration}ms
                              </p>
                              {log.errorMessage && (
                                <p className="text-sm text-destructive mt-1">{log.errorMessage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t p-4 space-y-4 bg-muted/20">
                          {/* Request Details */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Request</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {log.method}
                                </Badge>
                                <code className="text-xs bg-background px-2 py-1 rounded">
                                  {log.url}
                                </code>
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer font-medium mb-1">Request Headers</summary>
                                <pre className="bg-background p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.requestHeaders, null, 2)}
                                </pre>
                              </details>
                              <details className="text-xs">
                                <summary className="cursor-pointer font-medium mb-1">Request Body</summary>
                                <pre className="bg-background p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.requestBody, null, 2)}
                                </pre>
                              </details>
                            </div>
                          </div>

                          {/* Response Details */}
                          {log.responseStatus && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Response</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">Status:</span>
                                  <Badge
                                    variant={log.success ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {log.responseStatus}
                                  </Badge>
                                </div>
                                {log.responseHeaders && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer font-medium mb-1">
                                      Response Headers
                                    </summary>
                                    <pre className="bg-background p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.responseHeaders, null, 2)}
                                    </pre>
                                  </details>
                                )}
                                {log.responseBody && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer font-medium mb-1">
                                      Response Body
                                    </summary>
                                    <pre className="bg-background p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.responseBody, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
  );

  if (isEmbedded) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhook Logs</h2>
          <p className="text-muted-foreground mt-1">
            View detailed logs of webhook deliveries and responses
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Logs</DialogTitle>
          <DialogDescription>
            View detailed logs of webhook deliveries and responses
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
