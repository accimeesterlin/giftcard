"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingCart, Search, Tag, ChevronLeft, ChevronRight, Plus, Filter, Eye } from "lucide-react";
import Link from "next/link";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/cart-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  sellerFeePercentage: number;
  currency: string;
  imageUrl: string | null;
  brandLogoUrl: string | null;
  totalStock: number;
}

function MarketplaceHomeContent() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const { addItem } = useCart();

  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [selectedDenominations, setSelectedDenominations] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCardType, setSelectedCardType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [companySlug]);

  const fetchData = async () => {
    try {
      // Get company (public endpoint)
      const companyResponse = await fetch(`/api/v1/marketplace/${companySlug}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.data);

        // Get listings for this company (public endpoint)
        const listingsResponse = await fetch(
          `/api/v1/marketplace/${companySlug}/listings`
        );
        if (listingsResponse.ok) {
          const listingsData = await listingsResponse.json();
          // Show all active listings
          setListings(listingsData.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique values for filters
  const categories = ["all", ...Array.from(new Set(listings.map((l) => l.category)))];
  const brands = ["all", ...Array.from(new Set(listings.map((l) => l.brand)))];
  const cardTypes = ["all", ...Array.from(new Set(listings.map((l) => l.cardType)))];

  // Filter listings based on search query and filters
  const filteredListings = listings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      listing.title.toLowerCase().includes(query) ||
      listing.brand.toLowerCase().includes(query) ||
      listing.description?.toLowerCase().includes(query) ||
      listing.category.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === "all" || listing.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || listing.brand === selectedBrand;
    const matchesCardType = selectedCardType === "all" || listing.cardType === selectedCardType;

    return matchesSearch && matchesCategory && matchesBrand && matchesCardType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Reset to page 1 when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedCardType]);

  // Initialize selected denominations for each listing
  useEffect(() => {
    const initialDenominations: Record<string, number> = {};
    listings.forEach((listing) => {
      if (listing.denominations.length > 0) {
        initialDenominations[listing.id] = listing.denominations[0];
      }
    });
    setSelectedDenominations(initialDenominations);
  }, [listings]);

  const handleAddToCart = (listing: Listing) => {
    const denomination = selectedDenominations[listing.id];
    if (!denomination) return;

    addItem({
      listingId: listing.id,
      companySlug,
      title: listing.title,
      brand: listing.brand,
      denomination,
      quantity: 1,
      currency: listing.currency,
      discountPercentage: listing.discountPercentage,
      sellerFeePercentage: listing.sellerFeePercentage,
      imageUrl: listing.imageUrl,
    });
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
                <p className="text-xs sm:text-sm text-muted-foreground">sellergift</p>
              </div>
            </div>
            <CartSheet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Available Gift Cards</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Browse our collection of digital gift cards with instant delivery
          </p>

          {/* Search and Filter Button */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search gift cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedCategory !== "all" || selectedBrand !== "all" || selectedCardType !== "all") && (
                <Badge variant="secondary" className="ml-1">
                  {[selectedCategory !== "all", selectedBrand !== "all", selectedCardType !== "all"].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Filter by:</span>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand === "all" ? "All Brands" : brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCardType} onValueChange={setSelectedCardType}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Card Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "all" ? "All Types" : type === "digital" ? "Digital" : "Physical"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Show 6</SelectItem>
                    <SelectItem value="9">Show 9</SelectItem>
                    <SelectItem value="12">Show 12</SelectItem>
                    <SelectItem value="24">Show 24</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedBrand("all");
                    setSelectedCardType("all");
                  }}
                  className="ml-auto"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredListings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No Results Found" : "No Gift Cards Available"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "There are currently no gift cards available. Please check back later."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Info */}
            <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredListings.length)} of {filteredListings.length} results
              </span>
            </div>

            {/* Gift Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedListings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/marketplace/${companySlug}/${listing.id}`}>
                          <CardTitle className="text-base sm:text-lg mb-1 truncate hover:underline cursor-pointer">
                            {listing.title}
                          </CardTitle>
                        </Link>
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
                        <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Select denomination:</p>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {listing.denominations.map((denom) => (
                            <Button
                              key={denom}
                              variant={selectedDenominations[listing.id] === denom ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setSelectedDenominations((prev) => ({
                                  ...prev,
                                  [listing.id]: denom,
                                }))
                              }
                            >
                              {listing.currency} {denom}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 sm:mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(listing)}
                        >
                          <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Add to Cart</span>
                        </Button>
                        <Link href={`/marketplace/${companySlug}/${listing.id}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">View Details</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-9 h-9 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
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
