"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  listingId: string;
  companySlug: string;
  title: string;
  brand: string;
  denomination: number;
  quantity: number;
  currency: string;
  discountPercentage: number;
  sellerFeePercentage: number;
  imageUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (listingId: string, denomination: number) => void;
  updateQuantity: (listingId: string, denomination: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("giftcard-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("giftcard-cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // Check if item already exists
      const existingIndex = prev.findIndex(
        (i) => i.listingId === item.listingId && i.denomination === item.denomination
      );

      if (existingIndex !== -1) {
        // Update quantity if item exists
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      // Add new item
      return [...prev, item];
    });
  };

  const removeItem = (listingId: string, denomination: number) => {
    setItems((prev) =>
      prev.filter((i) => !(i.listingId === listingId && i.denomination === denomination))
    );
  };

  const updateQuantity = (listingId: string, denomination: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(listingId, denomination);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.listingId === listingId && i.denomination === denomination
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      const basePrice = item.denomination * item.quantity;
      const discount = basePrice * (item.discountPercentage / 100);
      const priceAfterDiscount = basePrice - discount;
      const sellerFee = priceAfterDiscount * (item.sellerFeePercentage / 100);
      return sum + priceAfterDiscount + sellerFee;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
