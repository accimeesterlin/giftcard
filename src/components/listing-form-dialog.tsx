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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const listingFormSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().min(1).max(100),
  cardType: z.enum(["digital", "physical"]),
  category: z.string().min(1).max(50),
  denominations: z.string().min(1), // Comma-separated values
  discountPercentage: z.coerce.number().min(0).max(100),
  currency: z.string().length(3),
  countries: z.string().min(1), // Comma-separated ISO codes
  imageUrl: z.string().url().optional().or(z.literal("")),
  brandLogoUrl: z.string().url().optional().or(z.literal("")),
  minPurchaseAmount: z.coerce.number().positive().optional().or(z.literal("")),
  maxPurchaseAmount: z.coerce.number().positive().optional().or(z.literal("")),
  autoFulfill: z.boolean(),
  termsAndConditions: z.string().max(5000).optional(),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

interface ListingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  listing?: any; // Existing listing for edit mode
  onSuccess: () => void;
}

export function ListingFormDialog({
  open,
  onOpenChange,
  companyId,
  listing,
  onSuccess,
}: ListingFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      cardType: "digital",
      discountPercentage: 0,
      currency: "USD",
      autoFulfill: true,
    },
  });

  const selectedCardType = watch("cardType");

  useEffect(() => {
    if (listing && open) {
      // Populate form with existing listing data
      reset({
        title: listing.title,
        description: listing.description || "",
        brand: listing.brand,
        cardType: listing.cardType,
        category: listing.category,
        denominations: listing.denominations.join(", "),
        discountPercentage: listing.discountPercentage,
        currency: listing.currency,
        countries: listing.countries.join(", "),
        imageUrl: listing.imageUrl || "",
        brandLogoUrl: listing.brandLogoUrl || "",
        minPurchaseAmount: listing.minPurchaseAmount || "",
        maxPurchaseAmount: listing.maxPurchaseAmount || "",
        autoFulfill: listing.autoFulfill,
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
      // Parse denominations and countries
      const denominations = data.denominations
        .split(",")
        .map((d) => parseFloat(d.trim()))
        .filter((d) => !isNaN(d));

      const countries = data.countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);

      const payload = {
        title: data.title,
        description: data.description || null,
        brand: data.brand,
        cardType: data.cardType,
        category: data.category,
        denominations,
        discountPercentage: data.discountPercentage,
        currency: data.currency.toUpperCase(),
        countries,
        imageUrl: data.imageUrl || null,
        brandLogoUrl: data.brandLogoUrl || null,
        minPurchaseAmount: data.minPurchaseAmount || null,
        maxPurchaseAmount: data.maxPurchaseAmount || null,
        autoFulfill: data.autoFulfill,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Listing" : "Create New Listing"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your gift card listing details"
              : "Add a new gift card product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Amazon Gift Card"
                  {...register("title")}
                  disabled={isSaving}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Amazon"
                  {...register("brand")}
                  disabled={isSaving}
                />
                {errors.brand && (
                  <p className="text-sm text-destructive">{errors.brand.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md"
                placeholder="Describe this gift card..."
                {...register("description")}
                disabled={isSaving}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardType">Card Type *</Label>
                <Select
                  value={selectedCardType}
                  onValueChange={(value) => setValue("cardType", value as any)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
                {errors.cardType && (
                  <p className="text-sm text-destructive">{errors.cardType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Shopping, Entertainment"
                  {...register("category")}
                  disabled={isSaving}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Pricing & Availability</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="denominations">Denominations * (comma-separated)</Label>
                <Input
                  id="denominations"
                  placeholder="e.g., 10, 25, 50, 100"
                  {...register("denominations")}
                  disabled={isSaving}
                />
                {errors.denominations && (
                  <p className="text-sm text-destructive">{errors.denominations.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Input
                  id="currency"
                  placeholder="e.g., USD, EUR, GBP"
                  maxLength={3}
                  {...register("currency")}
                  disabled={isSaving}
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount %</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register("discountPercentage")}
                  disabled={isSaving}
                />
                {errors.discountPercentage && (
                  <p className="text-sm text-destructive">
                    {errors.discountPercentage.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPurchaseAmount">Min Amount</Label>
                <Input
                  id="minPurchaseAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  {...register("minPurchaseAmount")}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPurchaseAmount">Max Amount</Label>
                <Input
                  id="maxPurchaseAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  {...register("maxPurchaseAmount")}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countries">Countries * (comma-separated ISO codes)</Label>
              <Input
                id="countries"
                placeholder="e.g., US, CA, GB, DE"
                {...register("countries")}
                disabled={isSaving}
              />
              {errors.countries && (
                <p className="text-sm text-destructive">{errors.countries.message}</p>
              )}
            </div>
          </div>

          {/* Images & Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Images & Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Product Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("imageUrl")}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandLogoUrl">Brand Logo URL</Label>
                <Input
                  id="brandLogoUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("brandLogoUrl")}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoFulfill"
                {...register("autoFulfill")}
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label htmlFor="autoFulfill" className="font-normal cursor-pointer">
                Auto-fulfill orders (automatically send codes on purchase)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <textarea
                id="termsAndConditions"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md"
                placeholder="Any special terms or conditions..."
                {...register("termsAndConditions")}
                disabled={isSaving}
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
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
