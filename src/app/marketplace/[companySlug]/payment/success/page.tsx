"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Loader2,
  XCircle,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Mail,
  ShoppingBag,
  CreditCard,
  Star,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Company {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
}

interface FulfillmentCode {
  code: string;
  pin: string | null;
  denomination: number;
}

interface OrderDetails {
  id: string;
  customerEmail: string;
  customerName: string | null;
  denomination: number;
  quantity: number;
  total: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  listing: {
    title: string;
    brand: string;
  };
  codes?: FulfillmentCode[];
  paidAt: string;
  createdAt: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showCodes, setShowCodes] = useState<{ [key: number]: boolean }>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviewToken, setReviewToken] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const status = searchParams.get("status");

  useEffect(() => {
    fetchCompany();
  }, [companySlug]);

  useEffect(() => {
    if (orderId && token && status === "completed") {
      verifyPayment();
    } else if (status === "completed" && orderId) {
      // If we have orderId and status but no token, still try to verify
      verifyPayment();
    } else {
      setIsLoading(false);
      setVerificationStatus("error");
      setErrorMessage("Missing payment information");
    }
  }, [orderId, token, status]);

  const fetchCompany = async () => {
    try {
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);
        if (foundCompany) {
          setCompany(foundCompany);
        }
      }
    } catch (error) {
      console.error("Failed to fetch company:", error);
    }
  };

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/v1/marketplace/${companySlug}/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          token,
          status,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Payment verification failed");
      }

      const result = await response.json();

      if (result.data.status === "completed") {
        setVerificationStatus("success");
        // Fetch complete order details with codes
        await fetchOrderDetails();
      } else {
        setVerificationStatus("error");
        setErrorMessage("Payment was not successful");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setVerificationStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to verify payment");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      // Fetch order from public API
      const response = await fetch(`/api/public/v1/orders/${orderId}`);

      if (response.ok) {
        const result = await response.json();
        setOrderDetails(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  };

  const toggleCodeVisibility = (index: number) => {
    setShowCodes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyCode = async (code: string, pin: string | null) => {
    const textToCopy = pin ? `Code: ${code}\nPIN: ${pin}` : code;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-3">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {company?.logo && (
              <img
                src={company.logo}
                alt={company.displayName}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold truncate">
                {company?.displayName || "Seller Gift"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Payment Confirmation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center p-4 sm:p-6">
            {verificationStatus === "success" ? (
              <>
                <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Payment Successful!</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1.5 sm:mt-2">
                  Your order has been confirmed and is being processed.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Payment Verification Failed</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1.5 sm:mt-2">
                  {errorMessage || "We couldn't verify your payment. Please contact support."}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {verificationStatus === "success" && orderDetails && (
              <>
                {/* Order Summary */}
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Product</p>
                        <p className="text-sm sm:text-base font-semibold truncate">
                          {orderDetails.listing.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {orderDetails.listing.brand}
                        </p>
                      </div>
                    </div>
                    <Badge className="flex-shrink-0">
                      {orderDetails.currency} {orderDetails.denomination}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Quantity</p>
                      <p className="text-sm sm:text-base font-semibold">{orderDetails.quantity}x</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Total Paid</p>
                      <p className="text-sm sm:text-base font-semibold text-green-600">
                        {orderDetails.currency} {orderDetails.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="text-sm font-medium truncate">
                          {orderDetails.customerName || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {orderDetails.customerEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <p>Order ID</p>
                      <p className="font-mono text-xs">{orderDetails.id}</p>
                    </div>
                    <div className="text-right">
                      <p>Date</p>
                      <p>
                        {format(
                          new Date(orderDetails.paidAt || orderDetails.createdAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Redemption Codes */}
                {orderDetails.codes && orderDetails.codes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold">Your Gift Card Codes</h3>
                        <p className="text-xs text-muted-foreground">
                          Save these codes - they won't be shown again
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {orderDetails.codes.map((codeData, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 sm:p-4 bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Code #{index + 1}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {orderDetails.currency} {codeData.denomination}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleCodeVisibility(index)}
                              className="h-7 px-2"
                            >
                              {showCodes[index] ? (
                                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Gift Card Code</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs sm:text-sm font-mono bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded break-all">
                                  {showCodes[index] ? codeData.code : "••••••••••••••••"}
                                </code>
                                {showCodes[index] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyCode(codeData.code, codeData.pin)}
                                    className="h-8 px-2 flex-shrink-0"
                                  >
                                    {copiedCode === codeData.code ? (
                                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {codeData.pin && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">PIN</p>
                                <code className="block text-xs sm:text-sm font-mono bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded break-all">
                                  {showCodes[index] ? codeData.pin : "••••••••"}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4 rounded-lg space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-900 dark:text-blue-100">
                      A copy of these codes has been sent to{" "}
                      <strong>{orderDetails.customerEmail}</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-900 dark:text-blue-100">
                      Please check your spam folder if you don't see the email within 10 minutes
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-900 dark:text-blue-100">
                      Save or screenshot these codes - they won't be displayed again for security
                    </p>
                  </div>
                </div>

                {/* Review Call-to-Action */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 p-4 sm:p-6 rounded-lg text-center space-y-3">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">How was your experience?</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    We've sent you an email with a link to leave a review. Your feedback helps
                    others make informed decisions!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check your inbox at <strong>{orderDetails.customerEmail}</strong>
                  </p>
                </div>
              </>
            )}

            {verificationStatus === "error" && orderId && (
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="text-sm sm:text-base font-mono font-semibold break-all">{orderId}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Link href={`/marketplace/${companySlug}`}>
                <Button className="w-full h-10 sm:h-11 text-sm sm:text-base">
                  Continue Shopping
                </Button>
              </Link>
              {verificationStatus === "error" && (
                <Link href={`/marketplace/${companySlug}/support`}>
                  <Button variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base">
                    Contact Support
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="ghost" className="w-full h-10 sm:h-11 text-sm sm:text-base">
                  <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
