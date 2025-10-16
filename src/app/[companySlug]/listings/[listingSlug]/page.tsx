"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ShoppingCart, CreditCard, Building2, Bitcoin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";

const checkoutSchema = z.object({
  denomination: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().min(1).max(100),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  deliveryEmail: z.string().email().optional(),
  paymentMethod: z.enum(["stripe", "paypal", "crypto", "pgpay"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface Listing {
  id: string;
  companyId: string;
  slug: string;
  title: string;
  description: string | null;
  brand: string;
  cardType: string;
  category: string;
  denominations: number[];
  discountPercentage: number;
  currency: string;
  countries: string[];
  status: string;
  totalStock: number;
  soldCount: number;
  autoFulfill: boolean;
  termsAndConditions: string | null;
  imageUrls: string[];
  createdAt: string;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

export default function PublicListingPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const listingSlug = params.listingSlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      quantity: 1,
      paymentMethod: "stripe",
    },
  });

  const selectedDenomination = watch("denomination");
  const quantity = watch("quantity") || 1;

  useEffect(() => {
    fetchData();
  }, [companySlug, listingSlug]);

  const fetchData = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get listings for this company
          const listingsResponse = await fetch(`/api/v1/companies/${foundCompany.id}/listings`);
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            const foundListing = listingsData.data.find((l: Listing) => l.slug === listingSlug);

            if (foundListing && foundListing.status === "active") {
              setListing(foundListing);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load listing" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!company || !listing) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          denomination: data.denomination,
          quantity: data.quantity,
          customerEmail: data.customerEmail,
          customerName: data.customerName || null,
          deliveryEmail: data.deliveryEmail || data.customerEmail,
          paymentMethod: data.paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to create order");
      }

      setMessage({
        type: "success",
        text: `Order placed successfully! Check ${data.deliveryEmail || data.customerEmail} for your gift card codes.`,
      });

      // Reset form or redirect after success
      setTimeout(() => {
        router.push(`/${companySlug}`);
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to place order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedDenomination || !listing) return 0;
    const subtotal = selectedDenomination * quantity;
    const discount = subtotal * (listing.discountPercentage / 100);
    return subtotal - discount;
  };

  const calculateDiscount = () => {
    if (!selectedDenomination || !listing) return 0;
    const subtotal = selectedDenomination * quantity;
    return subtotal * (listing.discountPercentage / 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground">
            This listing is not available or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{company.displayName}</h1>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/${companySlug}`)}>
              Browse Listings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Listing Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{listing.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {listing.brand} {listing.cardType === "digital" ? "Digital" : "Physical"} Gift Card
                    </CardDescription>
                  </div>
                  {listing.discountPercentage > 0 && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      {listing.discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image */}
                {listing.imageUrls && listing.imageUrls.length > 0 && (
                  <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {listing.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{listing.description}</p>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{listing.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="font-medium">{listing.totalStock} in stock</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Countries</p>
                    <p className="font-medium">{listing.countries.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="font-medium">{listing.autoFulfill ? "Instant" : "Manual"}</p>
                  </div>
                </div>

                {/* Terms */}
                {listing.termsAndConditions && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-muted-foreground">{listing.termsAndConditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Checkout
                </CardTitle>
                <CardDescription>
                  Complete your purchase to receive gift card codes
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
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

                  {/* Denomination Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="denomination">Select Value</Label>
                    <RadioGroup
                      defaultValue={listing.denominations[0]?.toString()}
                      onValueChange={(value) => {
                        const input = document.querySelector<HTMLInputElement>(
                          'input[name="denomination"]'
                        );
                        if (input) input.value = value;
                      }}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {listing.denominations.map((denom) => (
                          <div key={denom}>
                            <RadioGroupItem
                              value={denom.toString()}
                              id={`denom-${denom}`}
                              className="peer sr-only"
                              {...register("denomination")}
                            />
                            <Label
                              htmlFor={`denom-${denom}`}
                              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="text-lg font-semibold">
                                {listing.currency} {denom}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    {errors.denomination && (
                      <p className="text-sm text-destructive">{errors.denomination.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      {...register("quantity")}
                      placeholder="1"
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity.message}</p>
                    )}
                  </div>

                  {/* Customer Email */}
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Your Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...register("customerEmail")}
                      placeholder="you@example.com"
                    />
                    {errors.customerEmail && (
                      <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
                    )}
                  </div>

                  {/* Customer Name (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Your Name (Optional)</Label>
                    <Input
                      id="customerName"
                      type="text"
                      {...register("customerName")}
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Delivery Email (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="deliveryEmail">
                      Delivery Email (Optional, defaults to your email)
                    </Label>
                    <Input
                      id="deliveryEmail"
                      type="email"
                      {...register("deliveryEmail")}
                      placeholder="recipient@example.com"
                    />
                    {errors.deliveryEmail && (
                      <p className="text-sm text-destructive">{errors.deliveryEmail.message}</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup defaultValue="stripe">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <RadioGroupItem
                            value="stripe"
                            id="stripe"
                            className="peer sr-only"
                            {...register("paymentMethod")}
                          />
                          <Label
                            htmlFor="stripe"
                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Stripe</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="paypal"
                            id="paypal"
                            className="peer sr-only"
                            {...register("paymentMethod")}
                          />
                          <Label
                            htmlFor="paypal"
                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Building2 className="h-4 w-4" />
                            <span>PayPal</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="crypto"
                            id="crypto"
                            className="peer sr-only"
                            {...register("paymentMethod")}
                          />
                          <Label
                            htmlFor="crypto"
                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Bitcoin className="h-4 w-4" />
                            <span>Crypto</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="pgpay"
                            id="pgpay"
                            className="peer sr-only"
                            {...register("paymentMethod")}
                          />
                          <Label
                            htmlFor="pgpay"
                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>PGPay</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Price Summary */}
                  {selectedDenomination && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {listing.currency} {(selectedDenomination * quantity).toFixed(2)}
                        </span>
                      </div>
                      {listing.discountPercentage > 0 && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>Discount ({listing.discountPercentage}%)</span>
                          <span>-{listing.currency} {calculateDiscount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>
                          {listing.currency} {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || !selectedDenomination}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Complete Purchase
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
