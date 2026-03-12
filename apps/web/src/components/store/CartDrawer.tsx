'use client';

import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import PriceDisplay from './PriceDisplay';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, calculation, isCalculating, updateQuantity, removeItem, clearCart } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrito ({items.length})
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            calculation?.items.map((item) => (
              <div key={item.variantId} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-16 h-16 flex-shrink-0 bg-white rounded-md overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='none'%3E%3Crect width='64' height='64' rx='8' fill='%23f1f5f9'/%3E%3Cpath d='M20 44l8-10 6 7 8-12 8 15H20z' fill='%23cbd5e1'/%3E%3Ccircle cx='26' cy='26' r='4' fill='%23cbd5e1'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sin img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <PriceDisplay price={item.unitPrice} size="sm" />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="ml-auto p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {calculation?.outOfStockItems && calculation.outOfStockItems.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
              <p className="font-medium mb-1">Productos sin stock suficiente:</p>
              <ul className="list-disc list-inside">
                {calculation.outOfStockItems.map((item: { variantId: string; name: string }) => (
                  <li key={item.variantId}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {isCalculating && (
              <p className="text-xs text-muted-foreground text-center">Calculando...</p>
            )}
            {calculation && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(calculation.subtotal)}</span>
                </div>
                {calculation.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (12%)</span>
                    <span>{formatPrice(calculation.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(calculation.total)}</span>
                </div>
              </div>
            )}

            <a
              href="/carrito"
              className="block w-full text-center py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Ver Carrito
            </a>
            <a
              href="/checkout"
              className="block w-full text-center py-2.5 bg-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Ir al Checkout
            </a>
            <button
              onClick={clearCart}
              className="block w-full text-center py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
