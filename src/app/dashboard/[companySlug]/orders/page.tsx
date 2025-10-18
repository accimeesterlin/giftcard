"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, CheckCircle, Send, Copy, ChevronLeft, ChevronRight, AlertCircle, Settings, Eye, EyeOff, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  brand: string;
  denomination: number;
  quantity: number;
  total: number;
  currency: string;
  customerEmail: string;
  customerName: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  deliveredAt: string | null;
  giftCardCodes: Array<{
    code: string;
    pin?: string;
    serialNumber?: string;
  }> | null;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

export default function OrdersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFulfilling, setIsFulfilling] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false);
  const [orderToFulfill, setOrderToFulfill] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasEmailIntegration, setHasEmailIntegration] = useState<boolean | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<number>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Search and filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get("paymentStatus") || "");
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState(searchParams.get("fulfillmentStatus") || "");

  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchCompany();
  }, [companySlug]);

  useEffect(() => {
    if (company) {
      fetchOrders();
      checkEmailIntegration();
    }
  }, [company, search, paymentStatusFilter, fulfillmentStatusFilter, page]);

  const fetchCompany = async () => {
    try {
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: any) => c.slug === companySlug);
        setCompany(foundCompany || null);
      }
    } catch (error) {
      console.error("Failed to fetch company:", error);
      setMessage({ type: "error", text: "Failed to load company" });
    }
  };

  const fetchOrders = async () => {
    if (!company) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (paymentStatusFilter) params.append("paymentStatus", paymentStatusFilter);
      if (fulfillmentStatusFilter) params.append("fulfillmentStatus", fulfillmentStatusFilter);

      const ordersResponse = await fetch(
        `/api/v1/companies/${company.id}/orders?${params.toString()}`
      );

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.data);
        setTotalOrders(ordersData.pagination?.total || 0);
        setHasMore(ordersData.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setMessage({ type: "error", text: "Failed to load orders" });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailIntegration = async () => {
    if (!company) return;

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/integrations`);
      if (response.ok) {
        const data = await response.json();
        const integrations = data.data || [];

        // Check if there's a primary enabled email integration
        const hasPrimaryEmail = integrations.some(
          (integration: any) =>
            integration.type === "email" &&
            integration.primary === true &&
            integration.enabled === true
        );

        setHasEmailIntegration(hasPrimaryEmail);
      }
    } catch (error) {
      console.error("Failed to check email integration:", error);
      setHasEmailIntegration(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    updateURL({ search: value, page: "1" });
  };

  const handleFilterChange = (filter: string, value: string) => {
    setPage(1);
    if (filter === "paymentStatus") {
      setPaymentStatusFilter(value);
      updateURL({ paymentStatus: value, page: "1" });
    } else if (filter === "fulfillmentStatus") {
      setFulfillmentStatusFilter(value);
      updateURL({ fulfillmentStatus: value, page: "1" });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage.toString() });
  };

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openFulfillDialog = (orderId: string) => {
    setOrderToFulfill(orderId);
    setIsFulfillDialogOpen(true);
  };

  const handleFulfillOrder = async () => {
    if (!company || !orderToFulfill) return;

    setIsFulfilling(orderToFulfill);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/orders/${orderToFulfill}/fulfill`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fulfill order");
      }

      setMessage({ type: "success", text: "Order fulfilled successfully! Email sent to customer." });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to fulfill order",
      });
    } finally {
      setIsFulfilling(null);
      setIsFulfillDialogOpen(false);
      setOrderToFulfill(null);
    }
  };

  const handleViewOrder = async (order: Order) => {
    // Clear revealed codes when opening a new order
    setRevealedCodes(new Set());

    // Fetch full order details if codes aren't loaded
    if (!order.giftCardCodes && order.fulfillmentStatus === "fulfilled") {
      try {
        const response = await fetch(`/api/v1/companies/${company?.id}/orders/${order.id}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedOrder(data.data);
        } else {
          setSelectedOrder(order);
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        setSelectedOrder(order);
      }
    } else {
      setSelectedOrder(order);
    }
    setIsSidebarOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard" });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleQuickStatusUpdate = async (orderId: string, type: 'payment' | 'fulfillment', newStatus: string) => {
    if (!company) return;

    setUpdatingStatus(`${orderId}-${type}`);
    try {
      const response = await fetch(`/api/v1/companies/${company.id}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type === 'payment' ? 'paymentStatus' : 'fulfillmentStatus']: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to update status');
      }

      setMessage({ type: 'success', text: 'Status updated successfully' });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update status',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleCodeReveal = (index: number) => {
    setRevealedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      disputed: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    };

    return (
      <Badge className={styles[status] || styles.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getFulfillmentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      fulfilled: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <Badge variant="outline" className={styles[status] || styles.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading && !orders.length) {
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

  const totalPages = Math.ceil(totalOrders / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage gift card orders for {company.displayName}
          </p>
        </div>
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

      {/* Email Integration Warning */}
      {hasEmailIntegration === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email Integration Required</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>
              No email integration is configured. Order fulfillment emails will not be sent to customers.
              To enable email delivery, please configure an email provider in your integration settings.
            </p>
            <Link href={`/dashboard/${companySlug}/integrations`}>
              <Button variant="outline" size="sm" className="mt-2 bg-background">
                <Settings className="mr-2 h-4 w-4" />
                Configure Email Integration
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Order ID, customer email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <div className="flex gap-2">
                <Select value={paymentStatusFilter || undefined} onValueChange={(value) => handleFilterChange("paymentStatus", value)}>
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                {paymentStatusFilter && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFilterChange("paymentStatus", "")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
              <div className="flex gap-2">
                <Select value={fulfillmentStatusFilter || undefined} onValueChange={(value) => handleFilterChange("fulfillmentStatus", value)}>
                  <SelectTrigger id="fulfillmentStatus">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                {fulfillmentStatusFilter && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFilterChange("fulfillmentStatus", "")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({totalOrders})</CardTitle>
          <CardDescription>
            View and manage customer orders and fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewOrder(order)}
                  >
                    <TableCell>
                      <div className="font-mono text-sm">{order.id.slice(0, 16)}...</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.customerName || "Guest Customer"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.listingTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.brand} • {order.currency} {order.denomination}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.quantity}x</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {order.currency} {order.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.paymentStatus}
                        onValueChange={(value) => handleQuickStatusUpdate(order.id, 'payment', value)}
                        disabled={updatingStatus === `${order.id}-payment`}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.fulfillmentStatus}
                        onValueChange={(value) => handleQuickStatusUpdate(order.id, 'fulfillment', value)}
                        disabled={updatingStatus === `${order.id}-fulfillment`}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {order.paymentStatus === "completed" &&
                        order.fulfillmentStatus === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => openFulfillDialog(order.id)}
                            disabled={isFulfilling === order.id}
                          >
                            {isFulfilling === order.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Fulfilling...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Fulfill
                              </>
                            )}
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalOrders} total orders)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={(open) => {
        setIsSidebarOpen(open);
        if (!open) setRevealedCodes(new Set());
      }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle>Order Details</SheetTitle>
                    <SheetDescription>
                      Order placed on {format(new Date(selectedOrder.createdAt), "PPP")}
                    </SheetDescription>
                  </div>
                  <Link href={`/dashboard/${companySlug}/orders/${selectedOrder.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Order ID */}
                <div>
                  <Label className="text-xs text-muted-foreground">Order ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono">{selectedOrder.id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(selectedOrder.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fulfillment Status</Label>
                    <div className="mt-1">{getFulfillmentStatusBadge(selectedOrder.fulfillmentStatus)}</div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="text-sm">{selectedOrder.customerName || "Guest Customer"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{selectedOrder.customerEmail}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedOrder.customerEmail)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listing Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Product Information</h3>
                    <Link href={`/dashboard/${companySlug}/listings/${selectedOrder.listingId}`}>
                      <Button variant="outline" size="sm">
                        View Listing
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <p className="text-sm font-medium">{selectedOrder.listingTitle}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Brand</Label>
                        <p className="text-sm">{selectedOrder.brand}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Denomination</Label>
                        <p className="text-sm">{selectedOrder.currency} {selectedOrder.denomination}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <p className="text-sm">{selectedOrder.quantity}x</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total</Label>
                        <p className="text-sm font-semibold">{selectedOrder.currency} {selectedOrder.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Method</Label>
                      <p className="text-sm uppercase">{selectedOrder.paymentMethod}</p>
                    </div>
                    {selectedOrder.paidAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Paid At</Label>
                        <p className="text-sm">{format(new Date(selectedOrder.paidAt), "PPP 'at' p")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gift Card Codes */}
                {selectedOrder.giftCardCodes && selectedOrder.giftCardCodes.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Redemption Codes</h3>
                    <div className="space-y-3">
                      {selectedOrder.giftCardCodes.map((gc, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">Card {index + 1}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCodeReveal(index)}
                              >
                                {revealedCodes.has(index) ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Reveal
                                  </>
                                )}
                              </Button>
                            </div>
                            {revealedCodes.has(index) && (
                              <>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Code</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                      {gc.code}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => copyToClipboard(gc.code)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {gc.pin && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">PIN</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                        {gc.pin}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(gc.pin || "")}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {gc.serialNumber && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Serial Number</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                        {gc.serialNumber}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(gc.serialNumber || "")}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    {selectedOrder.deliveredAt && (
                      <div className="mt-4">
                        <Label className="text-xs text-muted-foreground">Email Sent At</Label>
                        <p className="text-sm">{format(new Date(selectedOrder.deliveredAt), "PPP 'at' p")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.paymentStatus === "completed" && selectedOrder.fulfillmentStatus === "pending" && (
                  <div className="border-t pt-4">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        openFulfillDialog(selectedOrder.id);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fulfill Order & Send Email
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Fulfill Confirmation Dialog */}
      <AlertDialog open={isFulfillDialogOpen} onOpenChange={setIsFulfillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fulfill Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to fulfill this order? Gift card codes will be automatically
              sent to the customer's email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFulfillOrder}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Fulfill Order & Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
