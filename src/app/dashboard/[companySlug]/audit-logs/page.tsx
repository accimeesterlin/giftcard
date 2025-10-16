"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search, Loader2, Filter } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ACTION_LABELS: Record<string, string> = {
  "listing.created": "Listing Created",
  "listing.updated": "Listing Updated",
  "listing.deleted": "Listing Deleted",
  "inventory.bulk_uploaded": "Inventory Uploaded",
  "inventory.code_updated": "Code Updated",
  "inventory.code_deleted": "Code Deleted",
  "order.created": "Order Created",
  "order.fulfilled": "Order Fulfilled",
  "order.cancelled": "Order Cancelled",
  "company.updated": "Company Updated",
  "member.invited": "Member Invited",
  "member.removed": "Member Removed",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  fulfilled: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  cancelled: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
};

export default function AuditLogsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchAuditLogs();
  }, [companySlug]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await fetch(`/api/v1/companies/${companyId}/audit-logs`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setLogs(data.data);
      // }

      // Mock data for now
      setLogs([]);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionType = (action: string): string => {
    const parts = action.split(".");
    return parts[parts.length - 1] || "unknown";
  };

  const getActionBadgeColor = (action: string): string => {
    const actionType = getActionType(action);
    return ACTION_COLORS[actionType] || "bg-gray-100 text-gray-700";
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(query) ||
      log.resourceType.toLowerCase().includes(query) ||
      log.resourceId.toLowerCase().includes(query) ||
      log.userEmail?.toLowerCase().includes(query);

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResourceType =
      resourceTypeFilter === "all" || log.resourceType === resourceTypeFilter;

    return matchesSearch && matchesAction && matchesResourceType;
  });

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueResourceTypes = Array.from(new Set(logs.map((log) => log.resourceType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all actions performed in your account
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No audit logs yet</p>
              <p className="text-sm">Activity logs will appear here as actions are performed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resourceType}</div>
                        <div className="text-muted-foreground text-xs">
                          {log.resourceId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.userEmail || log.userId}
                    </TableCell>
                    <TableCell>
                      {log.metadata && (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
