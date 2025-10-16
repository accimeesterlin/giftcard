"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, Package, Eye } from "lucide-react";
import { format } from "date-fns";
import { ListingFormDialog } from "@/components/listing-form-dialog";
import { InventoryUploadDialog } from "@/components/inventory-upload-dialog";

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
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

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

  const handleDeleteListing = async (listingId: string) => {
    if (!company || !confirm("Are you sure you want to delete this listing?")) return;

    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/listings/${listingId}`,
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
    }
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gift Card Listings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your gift card catalog for {company.displayName}
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
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

      <Card>
        <CardHeader>
          <CardTitle>All Listings ({listings.length})</CardTitle>
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
              {listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No listings yet. Create your first gift card listing to get started!
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
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
                    <TableCell>{getStatusBadge(listing.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(listing.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>
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
                          <DropdownMenuItem
                            onClick={() => handleDeleteListing(listing.id)}
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
    </div>
  );
}
