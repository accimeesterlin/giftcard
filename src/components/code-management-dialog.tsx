"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Edit2, Trash2, X, Check, Eye, EyeOff, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Code {
  id: string;
  code: string;
  pin: string | null;
  serialNumber: string | null;
  status: string;
  soldAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

interface CodeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  listingId: string;
  denomination: number;
  currency: string;
  onSuccess: () => void;
}

export function CodeManagementDialog({
  open,
  onOpenChange,
  companyId,
  listingId,
  denomination,
  currency,
  onSuccess,
}: CodeManagementDialogProps) {
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ code: "", pin: "", serialNumber: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setCurrentPage(1);
      fetchCodes();
    }
  }, [open, denomination]);

  useEffect(() => {
    if (open) {
      fetchCodes();
    }
  }, [searchQuery, currentPage]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(
        `/api/v1/companies/${companyId}/listings/${listingId}/codes/by-denomination/${denomination}?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setCodes(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error);
      setMessage({ type: "error", text: "Failed to load codes" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (code: Code) => {
    setEditingCode(code.id);
    setEditForm({
      code: code.code,
      pin: code.pin || "",
      serialNumber: code.serialNumber || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditForm({ code: "", pin: "", serialNumber: "" });
  };

  const handleSaveEdit = async (codeId: string) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/listings/${listingId}/codes/${codeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editForm.code,
            pin: editForm.pin || null,
            serialNumber: editForm.serialNumber || null,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to update code");
      }

      setMessage({ type: "success", text: "Code updated successfully" });
      setEditingCode(null);
      fetchCodes();
      onSuccess();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update code",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (codeId: string) => {
    setCodeToDelete(codeId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!codeToDelete) return;

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/listings/${listingId}/codes/${codeToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete code");
      }

      setMessage({ type: "success", text: "Code deleted successfully" });
      fetchCodes();
      onSuccess();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete code",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    }
  };

  const toggleCodeVisibility = (codeId: string) => {
    const newVisible = new Set(visibleCodes);
    if (newVisible.has(codeId)) {
      newVisible.delete(codeId);
    } else {
      newVisible.add(codeId);
    }
    setVisibleCodes(newVisible);
  };

  const maskCode = (code: string) => {
    if (!code || code.length <= 8) return "****";
    return code.substring(0, 4) + "****" + code.substring(code.length - 4);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      sold: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      reserved: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    };

    return (
      <Badge className={styles[status] || styles.available}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const availableCodes = codes.filter((c) => c.status === "available");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Codes - {currency} {denomination}
            </DialogTitle>
            <DialogDescription>
              View, edit, and delete gift card codes for this denomination
            </DialogDescription>
          </DialogHeader>

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

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="font-medium">Total:</span> {pagination?.total || codes.length}
            </div>
            <div>
              <span className="font-medium">Available:</span> {availableCodes.length}
            </div>
            <div>
              <span className="font-medium">Sold:</span>{" "}
              {codes.filter((c) => c.status === "sold").length}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by code, PIN, or serial number..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No codes found for this denomination
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Serial #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    {editingCode === code.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editForm.code}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            className="font-mono text-sm"
                            disabled={isSaving}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.pin}
                            onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                            className="font-mono text-sm"
                            placeholder="Optional"
                            disabled={isSaving}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.serialNumber}
                            onChange={(e) =>
                              setEditForm({ ...editForm, serialNumber: e.target.value })
                            }
                            className="font-mono text-sm"
                            placeholder="Optional"
                            disabled={isSaving}
                          />
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(code.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(code.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">
                              {visibleCodes.has(code.id) ? (code.code || "N/A") : maskCode(code.code)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleCodeVisibility(code.id);
                              }}
                            >
                              {visibleCodes.has(code.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.pin ? (
                            <code className="text-sm font-mono">
                              {visibleCodes.has(code.id) ? code.pin : "****"}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.serialNumber ? (
                            <code className="text-sm font-mono">{code.serialNumber}</code>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(code.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {code.status === "available" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(code)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(code.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.total > pagination.limit && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} codes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-muted-foreground">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasMore || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gift card code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
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
    </>
  );
}
