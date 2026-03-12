'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import PriceDisplay from '@/components/store/PriceDisplay';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, calculation, isCalculating, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Tu carrito está vacío</h1>
        <p className="text-muted-foreground mb-6">
          Explora nuestros productos y agrega lo que necesites
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Carrito de Compras</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {calculation?.items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 p-4 bg-white rounded-xl border border-border"
            >
              <div className="w-24 h-24 flex-shrink-0 bg-muted/30 rounded-lg overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                <PriceDisplay price={item.unitPrice} size="sm" />
                {item.taxExempt && (
                  <span className="text-xs text-green-600">Exento de IVA</span>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-4 py-1.5 text-sm font-medium border-l border-r border-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="px-3 py-1.5 hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      {formatPrice(item.subtotal)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {calculation?.outOfStockItems && calculation.outOfStockItems.length > 0 && (
            <div className="p-4 bg-destructive/10 rounded-xl text-destructive text-sm">
              <p className="font-medium mb-1">Productos sin stock suficiente:</p>
              <ul className="list-disc list-inside">
                {calculation.outOfStockItems.map((item: { variantId: string; name: string }) => (
                  <li key={item.variantId}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/productos"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Seguir comprando
            </Link>
            <button
              onClick={clearCart}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-xl border border-border p-6 space-y-4 sticky top-28">
            <h2 className="font-semibold text-lg">Resumen</h2>

            {isCalculating ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted/50 rounded" />
                <div className="h-4 bg-muted/50 rounded" />
                <div className="h-6 bg-muted/50 rounded" />
              </div>
            ) : calculation ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>{formatPrice(calculation.subtotal)}</span>
                </div>
                {calculation.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (12%)</span>
                    <span>{formatPrice(calculation.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {calculation.shippingCost === 0
                      ? 'Gratis'
                      : formatPrice(calculation.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(calculation.total)}</span>
                </div>
              </div>
            ) : null}

            <Link
              href="/checkout"
              className="block w-full text-center py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Proceder al Checkout
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              Los precios incluyen IVA cuando aplique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
