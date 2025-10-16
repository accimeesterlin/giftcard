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
import { Loader2, AlertTriangle, Package, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { InventoryUploadDialog } from "@/components/inventory-upload-dialog";

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface Listing {
  id: string;
  title: string;
  brand: string;
  denominations: number[];
  currency: string;
  totalStock: number;
  soldCount: number;
  status: string;
}

export default function InventoryPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

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

          // Get listings with inventory
          const listingsResponse = await fetch(`/api/v1/companies/${foundCompany.id}/listings`);
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            setListings(listingsData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = (listing: Listing) => {
    setSelectedListing(listing);
    setIsInventoryDialogOpen(true);
  };

  const handleInventorySuccess = () => {
    fetchData();
  };

  const getStockStatus = (totalStock: number) => {
    if (totalStock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (totalStock < 10) {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="gap-1">
          In Stock
        </Badge>
      );
    }
  };

  const totalInventory = listings.reduce((sum, listing) => sum + listing.totalStock, 0);
  const totalSold = listings.reduce((sum, listing) => sum + listing.soldCount, 0);
  const lowStockCount = listings.filter((l) => l.totalStock > 0 && l.totalStock < 10).length;
  const outOfStockCount = listings.filter((l) => l.totalStock === 0).length;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage your gift card inventory levels
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available gift cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products unavailable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Current stock levels for all your listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Denominations</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">No inventory yet</p>
                    <p className="text-sm mb-4">Create a listing and add inventory to get started</p>
                    <Link href={`/dashboard/${companySlug}/listings`}>
                      <Button>
                        Go to Listings
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="font-medium">{listing.title}</div>
                    </TableCell>
                    <TableCell>{listing.brand}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {listing.denominations.slice(0, 3).map((denom) => (
                          <Badge key={denom} variant="outline" className="text-xs">
                            {listing.currency} {denom}
                          </Badge>
                        ))}
                        {listing.denominations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{listing.denominations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${listing.totalStock === 0 ? "text-destructive" : ""}`}>
                        {listing.totalStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{listing.soldCount}</span>
                    </TableCell>
                    <TableCell>{getStockStatus(listing.totalStock)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddStock(listing)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inventory Upload Dialog */}
      {company && selectedListing && (
        <InventoryUploadDialog
          open={isInventoryDialogOpen}
          onOpenChange={setIsInventoryDialogOpen}
          companyId={company.id}
          listing={selectedListing}
          onSuccess={handleInventorySuccess}
        />
      )}
    </div>
  );
}
