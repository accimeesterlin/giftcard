"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Globe,
  Tag,
  Image as ImageIcon,
  Loader2,
  Eye,
  ExternalLink,
  Copy,
  Plus,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ListingFormDialog } from "@/components/listing-form-dialog";
import { InventoryUploadDialog } from "@/components/inventory-upload-dialog";
import { CodeManagementDialog } from "@/components/code-management-dialog";
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
  soldCount: number;
  minPurchaseAmount: number | null;
  maxPurchaseAmount: number | null;
  autoFulfill: boolean;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface InventoryCode {
  id: string;
  denomination: number;
  code: string;
  pin: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

interface InventorySummary {
  denomination: number;
  available: number;
  sold: number;
  total: number;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const listingId = params.listingId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCodeManagementDialogOpen, setIsCodeManagementDialogOpen] = useState(false);
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);

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

            // Fetch inventory summary
            fetchInventorySummary(foundCompany.id, listingId);
          } else {
            setMessage({ type: "error", text: "Listing not found" });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load listing details" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventorySummary = async (companyId: string, listingId: string) => {
    try {
      const response = await fetch(
        `/api/v1/companies/${companyId}/listings/${listingId}/inventory/summary`
      );
      if (response.ok) {
        const data = await response.json();
        setInventorySummary(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventory summary:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!company || !listing) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/listings/${listing.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setMessage({ type: "success", text: `Status updated to ${newStatus}` });
        fetchData();
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
      setIsUpdatingStatus(false);
    }
  };

  const getShareableLink = () => {
    if (!company || !listing) return "";
    return `${window.location.origin}/marketplace/${company.slug}/${listing.id}`;
  };

  const copyShareableLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    setMessage({ type: "success", text: "Link copied to clipboard!" });
  };

  const handleDeleteListing = async () => {
    if (!company || !listing) return;

    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/listings/${listing.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push(`/dashboard/${companySlug}/listings`);
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
    }
  };

  const handleDialogSuccess = () => {
    setMessage({ type: "success", text: "Operation completed successfully" });
    fetchData();
  };

  const openCodeManagement = (denomination: number) => {
    setSelectedDenomination(denomination);
    setIsCodeManagementDialogOpen(true);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company || !listing) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Listing not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/${companySlug}/listings`)}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
      </div>
    );
  }

  const availablePercentage = listing.totalStock > 0
    ? ((listing.totalStock / (listing.totalStock + listing.soldCount)) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/${companySlug}/listings`)}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
              {getStatusBadge(listing.status)}
            </div>
            <p className="text-muted-foreground">
              {listing.brand} • {listing.category}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInventoryDialogOpen(true)}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Inventory
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Select
                  value={listing.status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(getShareableLink(), "_blank")}
              >
                <Eye className="mr-2 h-4 w-4" />
                View as Buyer
              </Button>
              <Button
                variant="outline"
                onClick={copyShareableLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.totalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {availablePercentage}% available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.soldCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Discount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listing.discountPercentage > 0 ? `${listing.discountPercentage}%` : "None"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customer discount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Seller Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listing.sellerFeePercentage > 0 ? `${listing.sellerFeePercentage}%` : "None"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your markup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Details about this gift card product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Card Type</div>
              <Badge variant="outline">
                {listing.cardType === "digital" ? "Digital" : "Physical"}
              </Badge>
            </div>

            {listing.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <p className="text-sm">{listing.description}</p>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Denominations
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {listing.denominations.map((d) => (
                  <Badge key={d} variant="secondary">
                    {listing.currency} {d}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Available Countries
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {listing.countries.map((country) => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            </div>

            {(listing.minPurchaseAmount || listing.maxPurchaseAmount) && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Purchase Limits</div>
                <p className="text-sm">
                  {listing.minPurchaseAmount && `Min: ${listing.currency} ${listing.minPurchaseAmount}`}
                  {listing.minPurchaseAmount && listing.maxPurchaseAmount && " • "}
                  {listing.maxPurchaseAmount && `Max: ${listing.currency} ${listing.maxPurchaseAmount}`}
                </p>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Auto-Fulfill</div>
              <Badge variant={listing.autoFulfill ? "default" : "secondary"}>
                {listing.autoFulfill ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Images & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Images & Metadata</CardTitle>
            <CardDescription>Visual assets and additional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.imageUrl && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Image
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            {listing.brandLogoUrl && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Brand Logo</div>
                <div className="relative w-24 h-24 overflow-hidden rounded-lg border bg-muted p-2">
                  <img
                    src={listing.brandLogoUrl}
                    alt={`${listing.brand} logo`}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <p className="text-sm">{format(new Date(listing.createdAt), "PPpp")}</p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Updated
              </div>
              <p className="text-sm">{format(new Date(listing.updatedAt), "PPpp")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory by Denomination */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory by Denomination</CardTitle>
              <CardDescription>Available codes for each denomination</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInventoryDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Codes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inventorySummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No inventory codes added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInventoryDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Codes
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Denomination</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventorySummary.map((item) => (
                  <TableRow key={item.denomination}>
                    <TableCell>
                      <Badge variant="secondary">
                        {listing.currency} {item.denomination}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{item.available}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{item.sold}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{item.total}</span>
                    </TableCell>
                    <TableCell>
                      {item.available > 0 ? (
                        <Badge variant="outline" className="text-green-700 border-green-700">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-700 border-red-700">
                          Out of Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCodeManagement(item.denomination)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Customers who purchased this listing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">No purchases yet</p>
            <p className="text-sm">Customers will appear here once they purchase from this listing</p>
          </div>
          {/* TODO: Implement actual customer list
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Denomination</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name || "Anonymous"}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {listing.currency} {customer.denomination}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.quantity}</TableCell>
                  <TableCell className="font-medium">
                    {listing.currency} {customer.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(customer.purchasedAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          */}
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      {listing.termsAndConditions && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{listing.termsAndConditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {company && (
        <>
          <ListingFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            companyId={company.id}
            listing={listing}
            onSuccess={handleDialogSuccess}
          />

          <InventoryUploadDialog
            open={isInventoryDialogOpen}
            onOpenChange={setIsInventoryDialogOpen}
            companyId={company.id}
            listing={listing}
            onSuccess={handleDialogSuccess}
          />

          {selectedDenomination && (
            <CodeManagementDialog
              open={isCodeManagementDialogOpen}
              onOpenChange={setIsCodeManagementDialogOpen}
              companyId={company.id}
              listingId={listing.id}
              denomination={selectedDenomination}
              currency={listing.currency}
              onSuccess={handleDialogSuccess}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{listing?.title}"? This action cannot be undone and will permanently remove the listing and all associated inventory.
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
