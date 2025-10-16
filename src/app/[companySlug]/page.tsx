"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShoppingCart, Tag } from "lucide-react";
import Image from "next/image";

interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brand: string;
  cardType: string;
  category: string;
  denominations: number[];
  discountPercentage: number;
  currency: string;
  totalStock: number;
  imageUrls: string[];
  autoFulfill: boolean;
  status: string;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
}

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [companySlug]);

  useEffect(() => {
    filterListings();
  }, [searchQuery, selectedCategory, listings]);

  const fetchData = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get active listings for this company
          const listingsResponse = await fetch(`/api/v1/companies/${foundCompany.id}/listings`);
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            const activeListings = listingsData.data.filter((l: Listing) => l.status === "active");
            setListings(activeListings);
            setFilteredListings(activeListings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((listing) => listing.category === selectedCategory);
    }

    setFilteredListings(filtered);
  };

  const getCategories = () => {
    const categories = new Set(listings.map((l) => l.category));
    return Array.from(categories).sort();
  };

  const handleListingClick = (listingSlug: string) => {
    router.push(`/${companySlug}/listings/${listingSlug}`);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">This store does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-2">{company.displayName}</h1>
            {company.description && (
              <p className="text-muted-foreground text-lg">{company.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search gift cards..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filters */}
          {getCategories().length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {getCategories().map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Listings Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No listings found</h2>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filters"
                  : "This store doesn't have any active listings yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleListingClick(listing.slug)}
                >
                  <CardHeader className="p-0">
                    {/* Image */}
                    <div className="aspect-video relative bg-muted">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <Image
                          src={listing.imageUrls[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Tag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Discount Badge */}
                      {listing.discountPercentage > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            {listing.discountPercentage}% OFF
                          </Badge>
                        </div>
                      )}

                      {/* Auto-fulfill Badge */}
                      {listing.autoFulfill && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            Instant Delivery
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* Category Badge */}
                      <Badge variant="outline" className="text-xs">
                        {listing.category}
                      </Badge>

                      {/* Title and Brand */}
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">{listing.brand}</p>
                      </div>

                      {/* Description */}
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {/* Denominations */}
                      <div className="flex flex-wrap gap-1">
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

                      {/* Stock */}
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-muted-foreground">
                          {listing.totalStock > 0 ? (
                            <span className="text-green-600 dark:text-green-400">
                              {listing.totalStock} available
                            </span>
                          ) : (
                            <span className="text-destructive">Out of stock</span>
                          )}
                        </span>
                        {listing.cardType && (
                          <span className="text-muted-foreground capitalize">
                            {listing.cardType}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full" disabled={listing.totalStock === 0}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {listing.totalStock > 0 ? "Buy Now" : "Out of Stock"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {company.displayName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
