"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Loader2, ArrowLeft, Copy, Eye, EyeOff, CheckCircle, Mail, ShoppingBag, CreditCard, User } from "lucide-react";
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
  customerId?: string;
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const orderId = params.orderId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedCodes, setRevealedCodes] = useState<Set<number>>(new Set());
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCompanyAndOrder();
  }, [companySlug, orderId]);

  const fetchCompanyAndOrder = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: any) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get order
          const orderResponse = await fetch(`/api/v1/companies/${foundCompany.id}/orders/${orderId}`);
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            setOrder(orderData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCodeReveal = async (index: number) => {
    const isRevealing = !revealedCodes.has(index);

    setRevealedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });

    // Log code reveal in audit logs (only when revealing, not hiding)
    if (isRevealing && order && company) {
      try {
        await fetch(`/api/v1/companies/${company.id}/orders/${order.id}/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codeIndex: index }),
        });
      } catch (error) {
        console.error("Failed to log code reveal:", error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard" });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleFulfillOrder = async () => {
    if (!company || !order) return;

    setIsFulfilling(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/orders/${order.id}/fulfill`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fulfill order");
      }

      setMessage({ type: "success", text: "Order fulfilled successfully! Email sent to customer." });
      fetchCompanyAndOrder(); // Refresh order data
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to fulfill order",
      });
    } finally {
      setIsFulfilling(false);
      setIsFulfillDialogOpen(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !order) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Order not found</p>
        <Link href={`/dashboard/${companySlug}/orders`}>
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
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
          <Link href={`/dashboard/${companySlug}/orders`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
            <p className="text-muted-foreground mt-1">
              Order placed on {format(new Date(order.createdAt), "PPP")}
            </p>
          </div>
        </div>
        {order.paymentStatus === "completed" && order.fulfillmentStatus === "pending" && (
          <Button onClick={() => setIsFulfillDialogOpen(true)} disabled={isFulfilling}>
            {isFulfilling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fulfilling...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Fulfill Order
              </>
            )}
          </Button>
        )}
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Basic order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Order ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono">{order.id}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(order.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Payment Status</Label>
                <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fulfillment Status</Label>
                <div className="mt-1">{getFulfillmentStatusBadge(order.fulfillmentStatus)}</div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Payment Method</Label>
              <p className="text-sm uppercase mt-1">{order.paymentMethod}</p>
            </div>

            {order.paidAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Paid At</Label>
                <p className="text-sm mt-1">{format(new Date(order.paidAt), "PPP 'at' p")}</p>
              </div>
            )}

            {order.fulfilledAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Fulfilled At</Label>
                <p className="text-sm mt-1">{format(new Date(order.fulfilledAt), "PPP 'at' p")}</p>
              </div>
            )}

            {order.deliveredAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Email Sent At</Label>
                <p className="text-sm mt-1">{format(new Date(order.deliveredAt), "PPP 'at' p")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              {order.customerId ? (
                <Link
                  href={`/dashboard/${companySlug}/customers/${order.customerId}`}
                  className="text-sm hover:underline text-primary block mt-1"
                >
                  {order.customerName || "Guest Customer"}
                </Link>
              ) : (
                <p className="text-sm mt-1">{order.customerName || "Guest Customer"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                {order.customerId ? (
                  <Link
                    href={`/dashboard/${companySlug}/customers/${order.customerId}`}
                    className="text-sm hover:underline text-primary"
                  >
                    {order.customerEmail}
                  </Link>
                ) : (
                  <p className="text-sm">{order.customerEmail}</p>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(order.customerEmail)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {order.customerId && (
              <Link href={`/dashboard/${companySlug}/customers/${order.customerId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Customer Profile
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Product</Label>
              <p className="text-sm font-medium mt-1">{order.listingTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Brand</Label>
                <p className="text-sm mt-1">{order.brand}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Denomination</Label>
                <p className="text-sm mt-1">{order.currency} {order.denomination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <p className="text-sm mt-1">{order.quantity}x</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total</Label>
                <p className="text-sm font-semibold mt-1 text-green-600">
                  {order.currency} {order.total.toFixed(2)}
                </p>
              </div>
            </div>

            <Link href={`/dashboard/${companySlug}/listings/${order.listingId}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Gift Card Codes */}
      {order.giftCardCodes && order.giftCardCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Redemption Codes
            </CardTitle>
            <CardDescription>
              Customer gift card codes - Click reveal to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {order.giftCardCodes.map((gc, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground font-semibold">
                        Card #{index + 1}
                      </Label>
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
                            <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded">
                              {gc.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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
                              <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded">
                                {gc.pin}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
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
                              <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded">
                                {gc.serialNumber}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
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
          </CardContent>
        </Card>
      )}

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
              <Mail className="mr-2 h-4 w-4" />
              Fulfill Order & Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
