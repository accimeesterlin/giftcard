"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/cart-sheet";
import { ListingSEO } from "@/components/listing-seo";
import {
  ShoppingCart,
  Package,
  Globe,
  Tag,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Info,
  CreditCard,
  Plus,
  ChevronLeft,
  Home,
  Star,
} from "lucide-react";
import Link from "next/link";

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

interface PaymentProvider {
  id: string;
  provider: string;
  enabled: boolean;
  status: string;
}

interface Review {
  id: string;
  customerName: string | null;
  customerEmail: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: string;
}

function MarketplaceListingContent() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const listingId = params.listingId as string;
  const { addItem } = useCart();

  const [company, setCompany] = useState<Company | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [inventory, setInventory] = useState<DenominationAvailability[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [showCustomerInfoDialog, setShowCustomerInfoDialog] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Load saved customer info from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("customerEmail");
    const savedFirstName = localStorage.getItem("customerFirstName");
    const savedLastName = localStorage.getItem("customerLastName");

    console.log("[Customer Info] Loading from localStorage:", {
      savedEmail,
      savedFirstName,
      savedLastName,
    });

    if (savedEmail) setCustomerEmail(savedEmail);
    if (savedFirstName) setCustomerFirstName(savedFirstName);
    if (savedLastName) setCustomerLastName(savedLastName);
  }, []);

  // Save customer info to localStorage when they change
  useEffect(() => {
    if (customerEmail) {
      localStorage.setItem("customerEmail", customerEmail);
      console.log("[Customer Info] Saved email to localStorage:", customerEmail);
    }
    if (customerFirstName) {
      localStorage.setItem("customerFirstName", customerFirstName);
      console.log("[Customer Info] Saved firstName to localStorage:", customerFirstName);
    }
    if (customerLastName) {
      localStorage.setItem("customerLastName", customerLastName);
      console.log("[Customer Info] Saved lastName to localStorage:", customerLastName);
    }
  }, [customerEmail, customerFirstName, customerLastName]);

  useEffect(() => {
    fetchData();
    fetchReviews();
  }, [companySlug, listingId]);

  const fetchData = async () => {
    try {
      // Get company (public endpoint)
      const companyResponse = await fetch(`/api/v1/marketplace/${companySlug}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.data);

        // Get listing (public endpoint)
        const listingResponse = await fetch(`/api/v1/marketplace/${companySlug}/${listingId}`);
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
            const firstAvailable = inventoryData.data.find(
              (d: DenominationAvailability) => d.inStock
            );
            if (firstAvailable) {
              setSelectedDenomination(firstAvailable.denomination);
            } else if (listingData.data.denominations.length > 0) {
              // If no available denominations, select first one anyway
              setSelectedDenomination(listingData.data.denominations[0]);
            }
          }
        }

        // Get payment providers (public endpoint)
        console.log("[Marketplace Page] Fetching payment providers for:", companySlug);
        const providersResponse = await fetch(`/api/v1/marketplace/${companySlug}/payments`);
        console.log("[Marketplace Page] Providers response status:", providersResponse.status);

        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          console.log("[Marketplace Page] Providers data:", providersData);
          setPaymentProviders(providersData.data);

          // Auto-select first available payment provider
          if (providersData.data.length > 0) {
            setSelectedPaymentProvider(providersData.data[0].provider);
          }
        } else {
          const errorData = await providersResponse.json();
          console.error("[Marketplace Page] Failed to fetch providers:", errorData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`/api/v1/reviews/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setReviewsLoading(false);
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

  const handleAddToCart = () => {
    if (!listing || !selectedDenomination) return;

    const availability = inventory.find((inv) => inv.denomination === selectedDenomination);
    if (!availability?.inStock) {
      alert("This denomination is currently out of stock");
      return;
    }

    addItem({
      listingId: listing.id,
      companySlug,
      title: listing.title,
      brand: listing.brand,
      denomination: selectedDenomination,
      quantity,
      currency: listing.currency,
      discountPercentage: listing.discountPercentage,
      sellerFeePercentage: listing.sellerFeePercentage,
      imageUrl: listing.imageUrl,
    });

    alert("Added to cart!");
  };

  const handleBuyNowClick = () => {
    if (!selectedDenomination || !selectedPaymentProvider) return;
    setShowCustomerInfoDialog(true);
  };

  const handleBuyNow = async () => {
    if (!selectedDenomination || !selectedPaymentProvider) return;

    // Validate customer information
    if (!customerEmail || !customerFirstName || !customerLastName) {
      alert("Please provide your email and name to receive your gift card");
      return;
    }

    setIsProcessingPayment(true);
    setShowCustomerInfoDialog(false);

    try {
      const response = await fetch(`/api/v1/marketplace/${companySlug}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedPaymentProvider,
          amount: calculatePrice(),
          currency: listing?.currency || "USD",
          listingId,
          denomination: selectedDenomination,
          quantity,
          customerEmail,
          customerFirstName,
          customerLastName,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to create payment");
      }

      const result = await response.json();

      // Redirect to payment page
      if (result.data.redirectUrl) {
        window.location.href = result.data.redirectUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error instanceof Error ? error.message : "Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
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
    <>
      <ListingSEO
        listing={{
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
          category: listing.category,
          currency: listing.currency,
          discountPercentage: listing.discountPercentage,
          denominations: listing.denominations,
        }}
        companyName={company.displayName}
        companySlug={companySlug}
        listingId={listingId}
        averageRating={getAverageRating()}
        reviewCount={reviews.length}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {company.logo && (
                <img
                  src={company.logo}
                  alt={company.displayName}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm sm:text-base truncate">
                  {company.displayName}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Seller Gift</p>
              </div>
            </div>
            <CartSheet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Link
            href={`/marketplace/${companySlug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <Home className="h-3.5 w-3.5" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Column - Product Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg mb-1 leading-none">{listing.title}</CardTitle>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {listing.brand}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {listing.cardType === "digital" ? "Digital" : "Physical"}
                      </Badge>
                    </div>
                  </div>
                  {listing.brandLogoUrl && (
                    <img
                      src={listing.brandLogoUrl}
                      alt={listing.brand}
                      className="h-8 w-8 object-contain flex-shrink-0"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 p-3 pt-1">
                {listing.description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5 leading-none">Description</h3>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {listing.description}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-0.5 flex items-center gap-1.5 leading-none">
                    <Globe className="h-3.5 w-3.5" />
                    Available In
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {listing.countries.map((country) => (
                      <Badge key={country} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>

                {listing.totalStock > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>In Stock - Ships Instantly</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            {listing.termsAndConditions && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm leading-none">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-tight">
                    {listing.termsAndConditions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Purchase Card */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-1">
                <CardTitle className="text-sm sm:text-base">Purchase Gift Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 px-3 sm:px-6 pt-3 pb-3 sm:pb-6">
                {/* Denomination Selection */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">
                    Select Denomination
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {listing.denominations.map((denom) => {
                      const availability = inventory.find((inv) => inv.denomination === denom);
                      const inStock = availability?.inStock ?? false;
                      const availableCount = availability?.available ?? 0;

                      return (
                        <Button
                          key={denom}
                          variant={selectedDenomination === denom ? "secondary" : "outline"}
                          onClick={() => inStock && setSelectedDenomination(denom)}
                          className="h-auto py-2.5 px-4"
                          disabled={!inStock}
                        >
                          <div className="text-left">
                            <div className="text-sm font-semibold whitespace-nowrap">
                              {listing.currency} {denom}
                            </div>
                            {inStock ? (
                              <>
                                {listing.discountPercentage > 0 && (
                                  <div className="text-[10px] opacity-75">
                                    Save {listing.discountPercentage}%
                                  </div>
                                )}
                                <div className="text-[10px] opacity-65">
                                  {availableCount} available
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] opacity-65">Out of Stock</div>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 block">Quantity</label>
                  {(() => {
                    const availability = inventory.find(
                      (inv) => inv.denomination === selectedDenomination
                    );
                    const maxQuantity = Math.min(availability?.available ?? 0, 100);
                    const inStock = availability?.inStock ?? false;

                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || !inStock}
                          className="h-8 w-8 sm:h-10 sm:w-10"
                        >
                          -
                        </Button>
                        <input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1))
                            )
                          }
                          className="w-16 sm:w-20 text-center border rounded-md py-1.5 sm:py-2 text-sm"
                          disabled={!inStock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                          disabled={quantity >= maxQuantity || !inStock}
                          className="h-8 w-8 sm:h-10 sm:w-10"
                        >
                          +
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                {/* Price Summary */}
                <div className="border-t pt-2.5 space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Card Value</span>
                    <span>
                      {listing.currency}{" "}
                      {selectedDenomination ? (selectedDenomination * quantity).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  {listing.discountPercentage > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                      <span>Discount ({listing.discountPercentage}%)</span>
                      <span>
                        -{listing.currency} {calculateSavings().toFixed(2)}
                      </span>
                    </div>
                  )}
                  {listing.sellerFeePercentage > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        Service Fee ({listing.sellerFeePercentage}%)
                      </span>
                      <span>
                        +{listing.currency} {calculateSellerFee().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {listing.currency} {calculatePrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                {paymentProviders.length > 0 && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 block">
                      Payment Method
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {paymentProviders.map((provider) => (
                        <Button
                          key={provider.id}
                          variant={
                            selectedPaymentProvider === provider.provider ? "secondary" : "outline"
                          }
                          onClick={() => setSelectedPaymentProvider(provider.provider)}
                          className="h-auto py-2.5 px-4 justify-start text-sm"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span className="capitalize">{provider.provider}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchase Buttons */}
                {(() => {
                  const availability = inventory.find(
                    (inv) => inv.denomination === selectedDenomination
                  );
                  const inStock = availability?.inStock ?? false;
                  const canAddToCart = selectedDenomination && inStock;
                  const canPurchase = selectedDenomination && inStock && selectedPaymentProvider;

                  return (
                    <>
                      <div className="flex gap-2">
                        <Button
                          disabled={!canPurchase || isProcessingPayment}
                          onClick={handleBuyNowClick}
                          className="flex-1 text-sm"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Buy Now
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!canAddToCart}
                          onClick={handleAddToCart}
                          className="flex-1 text-sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>

                      {selectedDenomination && !inStock && (
                        <div className="flex items-start gap-2 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm text-yellow-900 dark:text-yellow-300">
                            This denomination is currently out of stock. Please select another
                            denomination or check back later.
                          </div>
                        </div>
                      )}

                      {paymentProviders.length === 0 && (
                        <div className="flex items-start gap-2 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm text-yellow-900 dark:text-yellow-300">
                            No payment methods are currently available. Please contact the seller.
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Features */}
                <div className="pt-2.5 border-t space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Instant Digital Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>24/7 Customer Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 sm:mt-12">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl mb-1">Customer Reviews</CardTitle>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(getAverageRating(), "h-5 w-5")}
                      <span className="text-sm text-muted-foreground ml-1">
                        {getAverageRating().toFixed(1)} out of 5 ({reviews.length}{" "}
                        {reviews.length === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to review this gift card!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {review.customerName || "Anonymous"}
                            </p>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Information Dialog */}
      <Dialog open={showCustomerInfoDialog} onOpenChange={setShowCustomerInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Please provide your information to receive your gift card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="dialogEmail" className="text-sm">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dialogEmail"
                type="email"
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="h-10 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send your gift card to this email
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dialogFirstName" className="text-sm">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dialogFirstName"
                  type="text"
                  placeholder="John"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  required
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="dialogLastName" className="text-sm">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dialogLastName"
                  type="text"
                  placeholder="Doe"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCustomerInfoDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBuyNow}
              disabled={
                !customerEmail || !customerFirstName || !customerLastName || isProcessingPayment
              }
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

export default function MarketplaceListingPage() {
  return (
    <CartProvider>
      <MarketplaceListingContent />
    </CartProvider>
  );
}
