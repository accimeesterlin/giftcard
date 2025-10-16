"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
import { Loader2, Mail, Phone, User, ShoppingBag, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;
  createdAt: Date;
}

interface Order {
  id: string;
  listingTitle: string;
  brand: string;
  denomination: number;
  quantity: number;
  total: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: Date;
}

interface CustomerDetailSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  companyId: string;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerDetailSidebar({
  open,
  onOpenChange,
  customer,
  companyId,
  onEdit,
  onDelete,
}: CustomerDetailSidebarProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && customer) {
      fetchCustomerOrders();
    }
  }, [open, customer]);

  const fetchCustomerOrders = async () => {
    if (!customer) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/orders?customerEmail=${encodeURIComponent(customer.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    };

    return (
      <Badge className={styles[status] || styles.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getFulfillmentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      fulfilled: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <Badge className={styles[status] || styles.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (!customer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/customers/${customer.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete customer");
      }

      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete(customer);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert(error instanceof Error ? error.message : "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>Customer Details</SheetTitle>
              <SheetDescription>
                View customer information and order history
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(customer)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base">{customer.name || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{customer.email}</p>
              </div>
            </div>

            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{customer.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-base">
                  {format(new Date(customer.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{customer.totalPurchases}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">${customer.totalSpent.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          {/* Orders List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Order History</h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm">This customer hasn't made any purchases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.listingTitle}</p>
                        <p className="text-sm text-muted-foreground">{order.brand}</p>
                      </div>
                      <p className="font-semibold">
                        {order.currency} {order.total.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {order.quantity}x {order.currency} {order.denomination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(order.paymentStatus)}
                      {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customer.name || customer.email}? This
              action cannot be undone. The customer's order history will be preserved,
              but the customer record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
