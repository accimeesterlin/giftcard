"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, Package, Eye, Search, ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ListingFormDialog } from "@/components/listing-form-dialog";
import { InventoryUploadDialog } from "@/components/inventory-upload-dialog";
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

interface Listing {
  id: string;
  title: string;
  brand: string;
  cardType: string;
  category: string;
  denominations: number[];
  discountPercentage: number;
  currency: string;
  status: string;
  totalStock: number;
  soldCount: number;
  createdAt: string;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

export default function ListingsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cardTypeFilter, setCardTypeFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyAndListings();
  }, [companySlug]);

  const fetchCompanyAndListings = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: any) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get listings
          const listingsResponse = await fetch(
            `/api/v1/companies/${foundCompany.id}/listings`
          );
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            setListings(listingsData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load listings" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!company || !listingToDelete) return;

    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/listings/${listingToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMessage({ type: "success", text: "Listing deleted successfully" });
        fetchCompanyAndListings();
      } else {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete listing");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete listing",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  const openDeleteDialog = (listingId: string) => {
    setListingToDelete(listingId);
    setIsDeleteDialogOpen(true);
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setIsEditDialogOpen(true);
  };

  const handleManageInventory = (listing: Listing) => {
    setSelectedListing(listing);
    setIsInventoryDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setMessage({ type: "success", text: "Operation completed successfully" });
    fetchCompanyAndListings();
  };

  const handleQuickStatusChange = async (listingId: string, newStatus: string) => {
    if (!company) return;

    setUpdatingStatusFor(listingId);
    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/listings/${listingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setMessage({ type: "success", text: `Status updated to ${newStatus}` });
        fetchCompanyAndListings();
      } else {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to update status");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update status",
      });
    } finally {
      setUpdatingStatusFor(null);
    }
  };

  const copyPreviewLink = async (listingId: string) => {
    const previewUrl = `${window.location.origin}/marketplace/${companySlug}/${listingId}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setMessage({ type: "success", text: "Preview link copied to clipboard" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to copy link" });
    }
  };

  const viewAsBuyer = (listingId: string) => {
    const previewUrl = `/marketplace/${companySlug}/${listingId}`;
    window.open(previewUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      active: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      inactive: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      out_of_stock: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <Badge className={styles[status] || styles.draft}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getCardTypeBadge = (cardType: string) => {
    return (
      <Badge variant="outline">
        {cardType === "digital" ? "Digital" : "Physical"}
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

  if (!company) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  // Filter listings based on search and filters
  const filteredListings = listings.filter((listing) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;

    // Card type filter
    const matchesCardType = cardTypeFilter === "all" || listing.cardType === cardTypeFilter;

    return matchesSearch && matchesStatus && matchesCardType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gift Card Listings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your gift card catalog for {company.displayName}
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Create Listing
        </Button>
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, brand, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={cardTypeFilter}
              onValueChange={(value) => {
                setCardTypeFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Card Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Listings ({filteredListings.length}
            {filteredListings.length !== listings.length && ` of ${listings.length}`})
          </CardTitle>
          <CardDescription>
            View and manage your gift card product catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Denominations</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {listings.length === 0
                      ? "No listings yet. Create your first gift card listing to get started!"
                      : "No listings match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedListings.map((listing) => (
                  <TableRow
                    key={listing.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/${companySlug}/listings/${listing.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {listing.brand} • {listing.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCardTypeBadge(listing.cardType)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {listing.denominations.map((d) => (
                          <span
                            key={d}
                            className="inline-block mr-1 px-1.5 py-0.5 bg-muted rounded text-xs"
                          >
                            {listing.currency} {d}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.discountPercentage > 0 ? (
                        <span className="text-green-600 font-medium">
                          {listing.discountPercentage}% off
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No discount</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          Available: <span className="font-medium">{listing.totalStock}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Sold: {listing.soldCount}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={listing.status}
                        onValueChange={(value) => handleQuickStatusChange(listing.id, value)}
                        disabled={updatingStatusFor === listing.id}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(listing.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/${companySlug}/listings/${listing.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageInventory(listing)}>
                            <Package className="mr-2 h-4 w-4" />
                            Manage Inventory
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyPreviewLink(listing.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Preview Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => viewAsBuyer(listing.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View as Buyer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(listing.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredListings.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredListings.length)} of{" "}
                {filteredListings.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {company && (
        <>
          <ListingFormDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            companyId={company.id}
            onSuccess={handleDialogSuccess}
          />

          {selectedListing && (
            <>
              <ListingFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                companyId={company.id}
                listing={selectedListing}
                onSuccess={handleDialogSuccess}
              />

              <InventoryUploadDialog
                open={isInventoryDialogOpen}
                onOpenChange={setIsInventoryDialogOpen}
                companyId={company.id}
                listing={selectedListing}
                onSuccess={handleDialogSuccess}
              />
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone and will permanently remove the listing and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
