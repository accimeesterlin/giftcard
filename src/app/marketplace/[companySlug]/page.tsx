"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Image as ImageIcon, Tag } from "lucide-react";
import Link from "next/link";
import { CartProvider } from "@/contexts/CartContext";
import { CartSheet } from "@/components/cart-sheet";

interface Company {
  id: string;
  slug: string;
  displayName: string;
  logo: string | null;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  brand: string;
  cardType: string;
  category: string;
  denominations: number[];
  discountPercentage: number;
  currency: string;
  imageUrl: string | null;
  brandLogoUrl: string | null;
  totalStock: number;
}

function MarketplaceHomeContent() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companySlug]);

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
          const listingsResponse = await fetch(
            `/api/v1/companies/${foundCompany.id}/listings`
          );
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            // Only show active listings with stock
            const activeListings = listingsData.data.filter(
              (l: Listing) => l.totalStock > 0
            );
            setListings(activeListings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center p-8 min-h-screen flex items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">
            This marketplace may have been removed or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {company.logo && (
                <img src={company.logo} alt={company.displayName} className="h-8 w-8 sm:h-12 sm:w-12 rounded flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{company.displayName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Gift Card Marketplace</p>
              </div>
            </div>
            <CartSheet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Available Gift Cards</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse our collection of digital gift cards with instant delivery
          </p>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Gift Cards Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There are currently no gift cards available. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((listing) => (
              <Link href={`/marketplace/${companySlug}/${listing.id}`} key={listing.id}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="p-0">
                    {listing.imageUrl ? (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg mb-1 truncate">{listing.title}</CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{listing.brand}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {listing.cardType === "digital" ? "Digital" : "Physical"}
                          </Badge>
                        </div>
                      </div>
                      {listing.brandLogoUrl && (
                        <img
                          src={listing.brandLogoUrl}
                          alt={listing.brand}
                          className="h-6 w-6 sm:h-8 sm:w-8 object-contain ml-2 flex-shrink-0"
                        />
                      )}
                    </div>

                    {listing.description && (
                      <CardDescription className="mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm">
                        {listing.description}
                      </CardDescription>
                    )}

                    <div className="space-y-2 sm:space-y-3">
                      {listing.discountPercentage > 0 && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm font-semibold">
                            Save {listing.discountPercentage}%
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Available denominations:</p>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {listing.denominations.slice(0, 4).map((denom) => (
                            <Badge key={denom} variant="secondary" className="text-xs">
                              {listing.currency} {denom}
                            </Badge>
                          ))}
                          {listing.denominations.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{listing.denominations.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button className="w-full mt-3 sm:mt-4" size="sm">
                        <ShoppingCart className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">View Details</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceHomePage() {
  return (
    <CartProvider>
      <MarketplaceHomeContent />
    </CartProvider>
  );
}
