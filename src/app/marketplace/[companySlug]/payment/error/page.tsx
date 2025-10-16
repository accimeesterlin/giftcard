"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
}

export default function PaymentErrorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);

  const orderId = searchParams.get("orderId");
  const errorMessage = searchParams.get("message");
  const errorCode = searchParams.get("code");

  useEffect(() => {
    fetchCompany();
  }, [companySlug]);

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

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    if (errorCode) {
      switch (errorCode) {
        case "payment_failed":
          return "Your payment could not be processed. Please try again.";
        case "payment_cancelled":
          return "You cancelled the payment.";
        case "insufficient_funds":
          return "Your payment method has insufficient funds.";
        case "invalid_card":
          return "Your card details are invalid.";
        default:
          return "An error occurred during payment processing.";
      }
    }
    return "An unexpected error occurred during payment. Please try again or contact support.";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {company?.logo && (
              <img src={company.logo} alt={company.displayName} className="h-10 w-10 rounded" />
            )}
            <div>
              <h2 className="font-semibold">{company?.displayName || "Gift Card Marketplace"}</h2>
              <p className="text-sm text-muted-foreground">Payment Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
            <CardDescription className="text-base mt-2">
              {getErrorMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderId && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reference ID</p>
                <p className="font-mono font-semibold">{orderId}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                What you can do:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Check your payment method details and try again</li>
                <li>Try a different payment method</li>
                <li>Contact your bank if the issue persists</li>
                <li>Contact our support team for assistance</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link href={`/marketplace/${companySlug}`}>
                <Button className="w-full" size="lg">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </Link>
              <Link href={`/marketplace/${companySlug}/support`}>
                <Button variant="outline" className="w-full" size="lg">
                  Contact Support
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
