"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Package,
  Globe,
  Tag,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Info,
} from "lucide-react";

interface Listing {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  brand: string;
  cardType: string;
  category: string;
  denominations: number[];
  discountPercentage: number;
  sellerFeePercentage: number;
  currency: string;
  countries: string[];
  imageUrl: string | null;
  brandLogoUrl: string | null;
  status: string;
  totalStock: number;
  minPurchaseAmount: number | null;
  maxPurchaseAmount: number | null;
  termsAndConditions: string | null;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
}

interface DenominationAvailability {
  denomination: number;
  available: number;
  inStock: boolean;
}

export default function MarketplaceListingPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const listingId = params.listingId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [inventory, setInventory] = useState<DenominationAvailability[]>([]);

  useEffect(() => {
    fetchData();
  }, [companySlug, listingId]);

  const fetchData = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: any) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get listing
          const listingResponse = await fetch(
            `/api/v1/companies/${foundCompany.id}/listings/${listingId}`
          );
          if (listingResponse.ok) {
            const listingData = await listingResponse.json();
            setListing(listingData.data);

            // Get inventory availability
            const inventoryResponse = await fetch(
              `/api/v1/marketplace/${companySlug}/${listingId}/inventory`
            );
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              setInventory(inventoryData.data);

              // Auto-select first available denomination
              const firstAvailable = inventoryData.data.find((d: DenominationAvailability) => d.inStock);
              if (firstAvailable) {
                setSelectedDenomination(firstAvailable.denomination);
              } else if (listingData.data.denominations.length > 0) {
                // If no available denominations, select first one anyway
                setSelectedDenomination(listingData.data.denominations[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!listing || !selectedDenomination) return 0;
    const basePrice = selectedDenomination * quantity;
    const discount = basePrice * (listing.discountPercentage / 100);
    const priceAfterDiscount = basePrice - discount;
    const sellerFee = priceAfterDiscount * (listing.sellerFeePercentage / 100);
    return priceAfterDiscount + sellerFee;
  };

  const calculateSavings = () => {
    if (!listing || !selectedDenomination) return 0;
    const basePrice = selectedDenomination * quantity;
    const discount = basePrice * (listing.discountPercentage / 100);
    return discount;
  };

  const calculateSellerFee = () => {
    if (!listing || !selectedDenomination) return 0;
    const basePrice = selectedDenomination * quantity;
    const discount = basePrice * (listing.discountPercentage / 100);
    const priceAfterDiscount = basePrice - discount;
    return priceAfterDiscount * (listing.sellerFeePercentage / 100);
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
      <div className="text-center p-8 min-h-screen flex items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground">
            This listing may have been removed or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (listing.status !== "active") {
    return (
      <div className="text-center p-8 min-h-screen flex items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Listing Unavailable</h1>
          <p className="text-muted-foreground">
            This listing is currently not available for purchase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {company.logo && (
              <img src={company.logo} alt={company.displayName} className="h-10 w-10 rounded" />
            )}
            <div>
              <h2 className="font-semibold">{company.displayName}</h2>
              <p className="text-sm text-muted-foreground">Gift Card Marketplace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Info */}
          <div className="space-y-6">
            {/* Product Image */}
            {listing.imageUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                <ImageIcon className="h-20 w-20 text-muted-foreground opacity-50" />
              </div>
            )}

            {/* Product Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{listing.brand}</Badge>
                      <Badge variant="outline">
                        {listing.cardType === "digital" ? "Digital" : "Physical"}
                      </Badge>
                    </div>
                  </div>
                  {listing.brandLogoUrl && (
                    <img
                      src={listing.brandLogoUrl}
                      alt={listing.brand}
                      className="h-12 w-12 object-contain"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {listing.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{listing.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Available In
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.countries.map((country) => (
                      <Badge key={country} variant="secondary">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>

                {listing.totalStock > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>In Stock - Ships Instantly</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            {listing.termsAndConditions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {listing.termsAndConditions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Purchase Card */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Purchase Gift Card</CardTitle>
                <CardDescription>Select denomination and quantity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Denomination Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Denomination
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {listing.denominations.map((denom) => {
                      const availability = inventory.find((inv) => inv.denomination === denom);
                      const inStock = availability?.inStock ?? false;
                      const availableCount = availability?.available ?? 0;

                      return (
                        <Button
                          key={denom}
                          variant={selectedDenomination === denom ? "default" : "outline"}
                          onClick={() => inStock && setSelectedDenomination(denom)}
                          className="h-auto py-3 relative"
                          disabled={!inStock}
                        >
                          <div>
                            <div className="font-bold">{listing.currency} {denom}</div>
                            {inStock ? (
                              <>
                                {listing.discountPercentage > 0 && (
                                  <div className="text-xs opacity-80">
                                    Save {listing.discountPercentage}%
                                  </div>
                                )}
                                <div className="text-xs opacity-60">
                                  {availableCount} available
                                </div>
                              </>
                            ) : (
                              <div className="text-xs opacity-60">
                                Out of Stock
                              </div>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Quantity
                  </label>
                  {(() => {
                    const availability = inventory.find((inv) => inv.denomination === selectedDenomination);
                    const maxQuantity = Math.min(availability?.available ?? 0, 100);
                    const inStock = availability?.inStock ?? false;

                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || !inStock}
                        >
                          -
                        </Button>
                        <input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                          className="w-20 text-center border rounded-md py-2"
                          disabled={!inStock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                          disabled={quantity >= maxQuantity || !inStock}
                        >
                          +
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Card Value</span>
                    <span>
                      {listing.currency} {selectedDenomination ? (selectedDenomination * quantity).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  {listing.discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount ({listing.discountPercentage}%)</span>
                      <span>-{listing.currency} {calculateSavings().toFixed(2)}</span>
                    </div>
                  )}
                  {listing.sellerFeePercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee ({listing.sellerFeePercentage}%)</span>
                      <span>+{listing.currency} {calculateSellerFee().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{listing.currency} {calculatePrice().toFixed(2)}</span>
                  </div>
                </div>

                {/* Purchase Button */}
                {(() => {
                  const availability = inventory.find((inv) => inv.denomination === selectedDenomination);
                  const inStock = availability?.inStock ?? false;

                  return (
                    <>
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={!selectedDenomination || !inStock}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy Now
                      </Button>

                      {selectedDenomination && !inStock && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="text-sm text-yellow-900 dark:text-yellow-300">
                            This denomination is currently out of stock. Please select another denomination or check back later.
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Features */}
                <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Instant Digital Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>24/7 Customer Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
