"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const listingFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().min(1, "Brand is required").max(100),
  cardType: z.enum(["digital", "physical"]),
  category: z.string().min(1, "Category is required"),
  denominations: z.string().min(1, "At least one denomination is required"),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  feeType: z.enum(["none", "percentage", "fixed", "both"]).default("none"),
  sellerFeePercentage: z.coerce.number().min(0).max(100).default(0),
  sellerFeeFixed: z.coerce.number().min(0).optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required"),
  countries: z.string().optional().default("US"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  brandLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  minPurchaseAmount: z.coerce.number().positive().optional().or(z.literal("")),
  maxPurchaseAmount: z.coerce.number().positive().optional().or(z.literal("")),
  autoFulfill: z.boolean().optional().default(true),
  termsAndConditions: z.string().max(5000).optional(),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

interface ListingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  listing?: any;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Shopping",
  "Entertainment",
  "Gaming",
  "Food & Dining",
  "Travel",
  "Streaming",
  "Electronics",
  "Fashion",
  "Health & Beauty",
  "Books & Media",
  "Home & Garden",
  "Sports & Outdoors",
  "Other",
];

const POPULAR_BRANDS = [
  "Amazon",
  "Apple",
  "Google Play",
  "Steam",
  "PlayStation",
  "Xbox",
  "Netflix",
  "Spotify",
  "Uber",
  "Lyft",
  "Starbucks",
  "Target",
  "Walmart",
  "Best Buy",
  "Home Depot",
  "Lowe's",
  "Nike",
  "Adidas",
  "Sephora",
  "Ulta",
  "eBay",
  "Etsy",
  "iTunes",
  "Roblox",
  "Fortnite",
  "Nintendo",
  "Visa",
  "Mastercard",
  "American Express",
  "Southwest Airlines",
  "Delta",
  "Airbnb",
  "Hotels.com",
  "Marriott",
  "Hilton",
  "Whole Foods",
  "Chipotle",
  "DoorDash",
  "Grubhub",
  "Panera Bread",
  "Subway",
  "McDonald's",
  "Burger King",
  "Dunkin'",
  "Nordstrom",
  "Macy's",
  "Kohl's",
  "JCPenney",
  "Gap",
  "Old Navy",
  "H&M",
  "Zara",
  "REI",
  "Dick's Sporting Goods",
  "GameStop",
  "Barnes & Noble",
  "AMC Theatres",
  "Regal Cinemas",
  "Fandango",
  "Hulu",
  "Disney+",
  "HBO Max",
  "Paramount+",
  "Other",
].sort();

export function ListingFormDialog({
  open,
  onOpenChange,
  companyId,
  listing,
  onSuccess,
}: ListingFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const isEditMode = !!listing;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      brand: "",
      cardType: "digital",
      category: "Shopping",
      discountPercentage: 0,
      feeType: "none",
      sellerFeePercentage: 0,
      sellerFeeFixed: "",
      currency: "USD",
      countries: "US",
      autoFulfill: true,
    },
  });

  const selectedCardType = watch("cardType");
  const selectedCategory = watch("category");
  const selectedBrand = watch("brand");
  const selectedCurrency = watch("currency");
  const selectedFeeType = watch("feeType");
  const autoFulfillValue = watch("autoFulfill");

  useEffect(() => {
    if (listing && open) {
      // Determine fee type based on existing values
      let feeType: "none" | "percentage" | "fixed" | "both" = "none";
      const hasPercentage = (listing.sellerFeePercentage || 0) > 0;
      const hasFixed = (listing.sellerFeeFixed || 0) > 0;

      if (hasPercentage && hasFixed) {
        feeType = "both";
      } else if (hasPercentage) {
        feeType = "percentage";
      } else if (hasFixed) {
        feeType = "fixed";
      }

      reset({
        title: listing.title,
        description: listing.description || "",
        brand: listing.brand,
        cardType: listing.cardType,
        category: listing.category,
        denominations: listing.denominations.join(", "),
        discountPercentage: listing.discountPercentage || 0,
        feeType,
        sellerFeePercentage: listing.sellerFeePercentage || 0,
        sellerFeeFixed: listing.sellerFeeFixed || "",
        currency: listing.currency,
        countries: listing.countries?.join(", ") || "US",
        imageUrl: listing.imageUrl || "",
        brandLogoUrl: listing.brandLogoUrl || "",
        minPurchaseAmount: listing.minPurchaseAmount || "",
        maxPurchaseAmount: listing.maxPurchaseAmount || "",
        autoFulfill: listing.autoFulfill ?? true,
        termsAndConditions: listing.termsAndConditions || "",
      });
    } else if (!open) {
      reset();
      setError(null);
    }
  }, [listing, open, reset]);

  const onSubmit = async (data: ListingFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      const denominations = data.denominations
        .split(",")
        .map((d) => parseFloat(d.trim()))
        .filter((d) => !isNaN(d));

      const countries = (data.countries || "US")
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length >= 2);

      // Calculate fee values based on fee type
      let sellerFeePercentage = 0;
      let sellerFeeFixed = 0;

      if (data.feeType === "percentage" || data.feeType === "both") {
        sellerFeePercentage = data.sellerFeePercentage || 0;
      }

      if (data.feeType === "fixed" || data.feeType === "both") {
        sellerFeeFixed = Number(data.sellerFeeFixed) || 0;
      }

      const payload = {
        title: data.title,
        description: data.description || null,
        brand: data.brand,
        cardType: data.cardType,
        category: data.category,
        denominations,
        discountPercentage: data.discountPercentage || 0,
        sellerFeePercentage,
        sellerFeeFixed,
        currency: data.currency,
        countries,
        imageUrl: data.imageUrl || null,
        brandLogoUrl: data.brandLogoUrl || null,
        minPurchaseAmount: data.minPurchaseAmount || null,
        maxPurchaseAmount: data.maxPurchaseAmount || null,
        autoFulfill: data.autoFulfill ?? true,
        termsAndConditions: data.termsAndConditions || null,
      };

      const url = isEditMode
        ? `/api/v1/companies/${companyId}/listings/${listing.id}`
        : `/api/v1/companies/${companyId}/listings`;

      const response = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to save listing");
      }

      onSuccess();
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditMode ? "Edit Listing" : "Create New Listing"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your gift card listing details"
              : "Add a new gift card product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Product Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Amazon Gift Card"
                  {...register("title")}
                  disabled={isSaving}
                  className="h-10"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => setValue("brand", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brand && (
                  <p className="text-xs text-destructive">{errors.brand.message}</p>
                )}
              </div>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe this gift card product..."
                  {...register("description")}
                  disabled={isSaving}
                  className="min-h-[100px] resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardType" className="text-sm font-medium">
                  Card Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCardType}
                  onValueChange={(value) => setValue("cardType", value as any)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className={cn(
                        "w-full h-10 justify-between",
                        !selectedCategory && "text-muted-foreground"
                      )}
                      disabled={isSaving}
                    >
                      {selectedCategory || "Select category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {CATEGORIES.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={(currentValue) => {
                                setValue("category", currentValue);
                                setCategoryOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCategory === category
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6" />

          {/* Pricing & Availability */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Pricing & Availability</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="denominations" className="text-sm font-medium">
                  Denominations <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="denominations"
                  placeholder="10, 25, 50, 100"
                  {...register("denominations")}
                  disabled={isSaving}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Comma-separated values</p>
                {errors.denominations && (
                  <p className="text-xs text-destructive">{errors.denominations.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue("currency", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                    <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-xs text-destructive">{errors.currency.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feeType" className="text-sm font-medium">
                  Seller Fee Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedFeeType}
                  onValueChange={(value) => setValue("feeType", value as any)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Fee</SelectItem>
                    <SelectItem value="percentage">Percentage Fee</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Fee</SelectItem>
                    <SelectItem value="both">Both Percentage & Fixed Fee</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose how you want to charge fees on this gift card</p>
              </div>

              {(selectedFeeType === "percentage" || selectedFeeType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="sellerFeePercentage" className="text-sm font-medium">
                    Fee Percentage
                  </Label>
                  <Input
                    id="sellerFeePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    {...register("sellerFeePercentage")}
                    disabled={isSaving}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Percentage fee (e.g., 5 for 5%)</p>
                  {errors.sellerFeePercentage && (
                    <p className="text-xs text-destructive">{errors.sellerFeePercentage.message}</p>
                  )}
                </div>
              )}

              {(selectedFeeType === "fixed" || selectedFeeType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="sellerFeeFixed" className="text-sm font-medium">
                    Fixed Fee Amount
                  </Label>
                  <Input
                    id="sellerFeeFixed"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("sellerFeeFixed")}
                    disabled={isSaving}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Fixed amount in {selectedCurrency || "USD"}</p>
                  {errors.sellerFeeFixed && (
                    <p className="text-xs text-destructive">{errors.sellerFeeFixed.message}</p>
                  )}
                </div>
              )}
            </div>

            {isEditMode && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage" className="text-sm font-medium">
                      Discount %
                    </Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...register("discountPercentage")}
                      disabled={isSaving}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minPurchaseAmount" className="text-sm font-medium">
                      Min Amount
                    </Label>
                    <Input
                      id="minPurchaseAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      {...register("minPurchaseAmount")}
                      disabled={isSaving}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPurchaseAmount" className="text-sm font-medium">
                      Max Amount
                    </Label>
                    <Input
                      id="maxPurchaseAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      {...register("maxPurchaseAmount")}
                      disabled={isSaving}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countries" className="text-sm font-medium">
                    Available Countries <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="countries"
                    placeholder="US, CA, GB, DE"
                    {...register("countries")}
                    disabled={isSaving}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated ISO codes</p>
                  {errors.countries && (
                    <p className="text-xs text-destructive">{errors.countries.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {isEditMode && <div className="border-t pt-6 mt-6" />}

          {/* Settings */}
          {isEditMode && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm font-medium">
                  Product Image URL
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...register("imageUrl")}
                  disabled={isSaving}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandLogoUrl" className="text-sm font-medium">
                  Brand Logo URL
                </Label>
                <Input
                  id="brandLogoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  {...register("brandLogoUrl")}
                  disabled={isSaving}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="autoFulfill"
                checked={autoFulfillValue}
                onCheckedChange={(checked) => setValue("autoFulfill", !!checked)}
                disabled={isSaving}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="autoFulfill"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Auto-fulfill orders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send gift card codes to customers upon purchase
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions" className="text-sm font-medium">
                Terms & Conditions
              </Label>
              <Textarea
                id="termsAndConditions"
                placeholder="Any special terms or conditions for this product..."
                {...register("termsAndConditions")}
                disabled={isSaving}
                className="min-h-[100px] resize-none"
              />
            </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Update Listing"
              ) : (
                "Create Listing"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
