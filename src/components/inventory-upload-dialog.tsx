"use client";

import { useState } from "react";
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
import { Loader2, Upload, Info } from "lucide-react";

const inventoryUploadSchema = z.object({
  denomination: z.coerce.number().positive(),
  codes: z.string().min(1, "Please enter at least one gift card code"),
});

type InventoryUploadData = z.infer<typeof inventoryUploadSchema>;

interface InventoryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  listing: {
    id: string;
    title: string;
    denominations: number[];
    currency: string;
  };
  onSuccess: () => void;
}

export function InventoryUploadDialog({
  open,
  onOpenChange,
  companyId,
  listing,
  onSuccess,
}: InventoryUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ uploaded: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InventoryUploadData>({
    resolver: zodResolver(inventoryUploadSchema),
    defaultValues: {
      denomination: listing.denominations[0],
    },
  });

  const selectedDenomination = watch("denomination");

  const onSubmit = async (data: InventoryUploadData) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      // Parse codes from textarea (one per line or comma-separated)
      const codeLines = data.codes
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (codeLines.length === 0) {
        throw new Error("No valid codes found");
      }

      if (codeLines.length > 1000) {
        throw new Error("Maximum 1000 codes can be uploaded at once");
      }

      // Parse each line - format: "code" or "code|pin" or "code|pin|serial"
      const codes = codeLines.map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          code: parts[0],
          pin: parts[1] || null,
          serialNumber: parts[2] || null,
        };
      });

      const payload = {
        listingId: listing.id,
        denomination: data.denomination,
        codes,
        source: "bulk_upload",
      };

      const response = await fetch(
        `/api/v1/companies/${companyId}/listings/${listing.id}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to upload codes");
      }

      setUploadResult({ uploaded: result.data.uploaded });
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        reset();
        setUploadResult(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      reset();
      setError(null);
      setUploadResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Gift Card Codes</DialogTitle>
          <DialogDescription>
            Add inventory codes to {listing.title}
          </DialogDescription>
        </DialogHeader>

        {uploadResult ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Successful!</h3>
            <p className="text-muted-foreground">
              Successfully uploaded {uploadResult.uploaded} gift card codes
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-300">
                  <p className="font-medium mb-1">Code Format:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>One code per line: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ABCD-1234-EFGH</code></li>
                    <li>With PIN: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ABCD-1234-EFGH|5678</code></li>
                    <li>With serial: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ABCD-1234-EFGH|5678|SN12345</code></li>
                  </ul>
                  <p className="mt-2">Maximum 1,000 codes per upload</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="denomination">Denomination *</Label>
              <Select
                value={selectedDenomination?.toString()}
                onValueChange={(value) => setValue("denomination", parseFloat(value))}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listing.denominations.map((denom) => (
                    <SelectItem key={denom} value={denom.toString()}>
                      {listing.currency} {denom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.denomination && (
                <p className="text-sm text-destructive">{errors.denomination.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codes">Gift Card Codes *</Label>
              <textarea
                id="codes"
                className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md font-mono text-sm"
                placeholder="ABCD-1234-EFGH&#10;WXYZ-5678-IJKL|9012&#10;MNOP-3456-QRST|3456|SN78901"
                {...register("codes")}
                disabled={isUploading}
              />
              {errors.codes && (
                <p className="text-sm text-destructive">{errors.codes.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter codes in the format shown above, one per line
              </p>
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
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Codes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
