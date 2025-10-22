"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from "lucide-react";

interface InventoryData {
  [key: string]: {
    [denomination: number]: number; // available quantity
  };
}

export function CartSheet() {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryData>({});

  // Fetch inventory availability for cart items
  useEffect(() => {
    const fetchInventory = async () => {
      const inventoryData: InventoryData = {};

      // Fetch inventory for each unique listing
      const uniqueListings = [...new Set(items.map((item) => ({ listingId: item.listingId, companySlug: item.companySlug })))];

      await Promise.all(
        uniqueListings.map(async ({ listingId, companySlug }) => {
          try {
            const response = await fetch(`/api/v1/marketplace/${companySlug}/${listingId}/inventory`);
            if (response.ok) {
              const data = await response.json();
              inventoryData[listingId] = {};
              data.data.forEach((item: { denomination: number; available: number }) => {
                inventoryData[listingId][item.denomination] = item.available;
              });
            }
          } catch (error) {
            console.error(`Failed to fetch inventory for ${listingId}:`, error);
          }
        })
      );

      setInventory(inventoryData);
    };

    if (items.length > 0 && isOpen) {
      fetchInventory();
    }
  }, [items, isOpen]);

  const calculateItemPrice = (item: typeof items[0]) => {
    const basePrice = item.denomination * item.quantity;
    const discount = basePrice * (item.discountPercentage / 100);
    const priceAfterDiscount = basePrice - discount;
    const sellerFeePercentage = priceAfterDiscount * (item.sellerFeePercentage / 100);
    const sellerFeeFixed = (item.sellerFeeFixed || 0) * item.quantity;
    const totalSellerFee = sellerFeePercentage + sellerFeeFixed;
    return priceAfterDiscount + totalSellerFee;
  };

  const getAvailableQuantity = (listingId: string, denomination: number): number => {
    return inventory[listingId]?.[denomination] ?? 100; // Default to 100 if not loaded
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {getTotalItems() > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {getTotalItems() === 0
              ? "Your cart is empty"
              : `${getTotalItems()} item${getTotalItems() > 1 ? "s" : ""} in your cart`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mt-4">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.listingId}-${item.denomination}`}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                      <p className="text-sm font-medium mt-1">
                        {item.currency} {item.denomination}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {item.discountPercentage > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.discountPercentage}% off
                          </Badge>
                        )}
                        {(() => {
                          const available = getAvailableQuantity(item.listingId, item.denomination);
                          if (available === 0) {
                            return (
                              <Badge variant="destructive" className="text-xs">
                                Out of stock
                              </Badge>
                            );
                          } else if (item.quantity >= available) {
                            return (
                              <Badge variant="outline" className="text-xs">
                                Max quantity
                              </Badge>
                            );
                          } else if (available < 5) {
                            return (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                Only {available} left
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateQuantity(item.listingId, item.denomination, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          disabled={item.quantity >= getAvailableQuantity(item.listingId, item.denomination)}
                          onClick={() =>
                            updateQuantity(item.listingId, item.denomination, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => removeItem(item.listingId, item.denomination)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {item.currency} {calculateItemPrice(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {items[0]?.currency || "USD"} {getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              <SheetFooter className="flex-col gap-2">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Clear Cart
                </Button>
              </SheetFooter>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
