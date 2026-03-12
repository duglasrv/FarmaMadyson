'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';

interface CartCalculation {
  items: Array<{
    variantId: string;
    name: string;
    image?: string | null;
    quantity: number;
    unitPrice: number;
    taxExempt: boolean;
    subtotal: number;
  }>;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  outOfStockItems: Array<{ variantId: string; name: string; requested: number; available: number }>;
}

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount } =
    useCartStore();
  const [calculation, setCalculation] = useState<CartCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateCart = async () => {
    if (items.length === 0) {
      setCalculation(null);
      return;
    }

    setIsCalculating(true);
    try {
      const { data } = await apiClient.post('/cart/calculate', { items });
      setCalculation(data);
    } catch {
      // If API fails, clear calculation
      setCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Recalculate when items change
  useEffect(() => {
    const timeout = setTimeout(() => {
      calculateCart();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return {
    items,
    calculation,
    isCalculating,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount: itemCount(),
    calculateCart,
  };
}
