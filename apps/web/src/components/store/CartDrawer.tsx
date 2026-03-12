'use client';

import { X, Plus, Minus, Trash2, ShoppingBag, ShieldCheck, Lock } from 'lucide-react';
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
      {/* ═══ Backdrop — fade-in ═══ */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ═══ Drawer — slide from right ═══ */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-brand-xl flex flex-col animate-slide-in-right">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
            Mi Carrito
            <span className="text-sm font-normal text-silver">
              ({items.length} {items.length === 1 ? 'producto' : 'productos'})
            </span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-purple-50 text-slate transition-colors duration-200"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Items scroll area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-purple-200" />
              </div>
              <p className="text-charcoal font-semibold text-base">Tu carrito está vacío</p>
              <p className="text-silver text-sm mt-1.5">
                ¡Explora nuestros productos y encuentra lo que necesitas!
              </p>
              <a
                href="/productos"
                className="inline-block mt-6 px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors duration-200"
              >
                Ver Productos
              </a>
            </div>
          ) : (
            calculation?.items.map((item, idx) => (
              <div
                key={item.variantId}
                className="flex gap-3.5 p-3.5 bg-snow rounded-xl border border-mist hover:shadow-brand-sm transition-shadow duration-200"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image */}
                <div className="w-18 h-18 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-mist">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='none'%3E%3Crect width='64' height='64' rx='12' fill='%23F8F9FA'/%3E%3Cpath d='M20 44l8-10 6 7 8-12 8 15H20z' fill='%23D1D5DB'/%3E%3Ccircle cx='26' cy='26' r='4' fill='%23D1D5DB'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-silver text-xs">
                      Sin img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal truncate leading-snug">
                    {item.name}
                  </p>
                  <div className="mt-0.5">
                    <PriceDisplay price={item.unitPrice} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    {/* Quantity controls */}
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-mist flex items-center justify-center
                                 hover:bg-purple-50 hover:border-purple-200 text-slate
                                 transition-all duration-200"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center text-charcoal">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-mist flex items-center justify-center
                                 hover:bg-purple-50 hover:border-purple-200 text-slate
                                 transition-all duration-200"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="ml-auto p-1.5 rounded-lg text-silver hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Out of stock warning */}
          {calculation?.outOfStockItems && calculation.outOfStockItems.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <p className="font-semibold mb-1">Productos sin stock suficiente:</p>
              <ul className="list-disc list-inside text-red-600">
                {calculation.outOfStockItems.map((item: { variantId: string; name: string }) => (
                  <li key={item.variantId}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Footer / Totals ── */}
        {items.length > 0 && (
          <div className="border-t border-mist bg-snow px-5 py-4 space-y-4">
            {/* Calculating spinner */}
            {isCalculating && (
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-xs text-silver">Calculando totales...</span>
              </div>
            )}

            {/* Totals */}
            {calculation && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate">
                  <span>Subtotal</span>
                  <span className="text-charcoal font-medium">{formatPrice(calculation.subtotal)}</span>
                </div>
                {calculation.taxAmount > 0 && (
                  <div className="flex justify-between text-slate">
                    <span>IVA (12%)</span>
                    <span className="text-charcoal font-medium">{formatPrice(calculation.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-base pt-2.5 border-t border-mist">
                  <span className="text-charcoal">Total</span>
                  <span className="text-purple-600 text-lg">{formatPrice(calculation.total)}</span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-2.5">
              <a
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-white
                           rounded-xl font-semibold text-sm shadow-amber-glow
                           hover:bg-amber-600 hover:shadow-lg
                           active:scale-[0.98] transition-all duration-200"
              >
                <Lock className="w-4 h-4" />
                Ir al Checkout
              </a>
              <a
                href="/carrito"
                className="block w-full text-center py-2.5 bg-purple-600 text-white
                           rounded-xl font-semibold text-sm
                           hover:bg-purple-700
                           active:scale-[0.98] transition-all duration-200"
              >
                Ver Carrito Completo
              </a>
            </div>

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="block w-full text-center py-1.5 text-xs text-silver hover:text-red-500 transition-colors duration-200"
            >
              Vaciar carrito
            </button>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-[11px] text-silver">Transacción 100% segura</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
