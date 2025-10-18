"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Loader2, Mail, Phone, User, ShoppingBag, Calendar, Edit, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { useCurrentMembership } from "@/hooks/use-current-membership";

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

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const customerId = params.customerId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;

  // Get current user's membership to check permissions
  const { hasRole } = useCurrentMembership(company?.id || null);

  useEffect(() => {
    fetchCompanyAndCustomer();
  }, [companySlug, customerId]);

  useEffect(() => {
    if (customer && company) {
      fetchCustomerOrders();
    }
  }, [customer, company, page]);

  const fetchCompanyAndCustomer = async () => {
    setIsLoading(true);
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get customer
          const customerResponse = await fetch(`/api/v1/companies/${foundCompany.id}/customers/${customerId}`);
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            setCustomer(customerData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    if (!customer || !company) return;

    setIsLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        customerEmail: customer.email,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `/api/v1/companies/${company.id}/orders?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
        setTotalOrders(data.pagination?.total || data.data?.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/dashboard/${companySlug}/orders/${orderId}`);
  };

  const handleDelete = async () => {
    if (!customer || !company) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/customers/${customer.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete customer");
      }

      setShowDeleteDialog(false);
      router.push(`/dashboard/${companySlug}/customers`);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert(error instanceof Error ? error.message : "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchCompanyAndCustomer();
    setIsEditDialogOpen(false);
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

  const totalPages = Math.ceil(totalOrders / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !customer) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Customer not found</p>
        <Link href={`/dashboard/${companySlug}/customers`}>
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/${companySlug}/customers`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {customer.name || "Anonymous Customer"}
            </h1>
            <p className="text-muted-foreground mt-1">{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasRole("agent") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {hasRole("admin") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Contact details and account info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <p className="text-base break-all">{customer.email}</p>
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

            <Separator />

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-base">
                  {format(new Date(customer.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {customer.lastPurchaseAt && (
              <div className="flex items-start gap-3">
                <ShoppingBag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Purchase</p>
                  <p className="text-base">
                    {format(new Date(customer.lastPurchaseAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customer.totalPurchases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${customer.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime value
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <CardTitle>Order History</CardTitle>
          </div>
          <CardDescription>
            All orders placed by this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
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
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}
                    className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
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
                      <span>•</span>
                      <span>{format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(order.paymentStatus)}
                      {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({totalOrders} total orders)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      {company && (
        <CustomerFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          companyId={company.id}
          onSuccess={handleEditSuccess}
          customer={customer}
        />
      )}

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
    </div>
  );
}
