"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const response = await fetch(
        `/api/v1/marketplace/${companySlug}/payments/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            token,
            status,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Payment verification failed");
      }

      const result = await response.json();

      if (result.data.status === "completed") {
        setVerificationStatus("success");
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
              <img src={company.logo} alt={company.displayName} className="h-8 w-8 sm:h-10 sm:w-10 rounded flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold truncate">{company?.displayName || "Gift Card Marketplace"}</h2>
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
            {orderId && (
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="text-sm sm:text-base font-mono font-semibold break-all">{orderId}</p>
              </div>
            )}

            {verificationStatus === "success" && (
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Your gift card codes will be sent to your email shortly</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Please check your spam folder if you don't receive the email within 10 minutes</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>A receipt has been sent to your email address</p>
                </div>
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
