'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import ProductGrid from '@/components/store/ProductGrid';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function OfertasPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large batch and filter client-side for products with compareAtPrice
      const { data } = await apiClient.get('/products', {
        params: { limit: 100, page: 1 },
      });
      const products = data.data || data;
      const list = Array.isArray(products) ? products : [];
      const withDiscount = list.filter(
        (p: any) =>
          p.variants?.[0]?.compareAtPrice &&
          Number(p.variants[0].compareAtPrice) > Number(p.variants[0].salePrice),
      );
      const perPage = 20;
      setTotalPages(Math.max(1, Math.ceil(withDiscount.length / perPage)));
      const start = (page - 1) * perPage;
      setDeals(withDiscount.slice(start, start + perPage));
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">Ofertas Especiales</h1>
            <p className="text-slate text-sm mt-0.5">
              Los mejores precios en productos seleccionados
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-mist animate-pulse">
              <div className="aspect-square bg-snow rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-snow rounded w-1/3" />
                <div className="h-4 bg-snow rounded w-full" />
                <div className="h-3 bg-snow rounded w-1/2" />
                <div className="h-8 bg-snow rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 mx-auto text-silver mb-4" />
          <p className="text-charcoal font-semibold text-lg">No hay ofertas por el momento</p>
          <p className="text-silver text-sm mt-1">Vuelve pronto para ver nuestras nuevas promociones</p>
        </div>
      ) : (
        <>
          <ProductGrid
            products={deals}
            onAddToCart={(variantId) => addItem(variantId, 1)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-mist flex items-center justify-center hover:bg-purple-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-purple-600 text-white'
                      : 'border border-mist hover:bg-purple-50 text-slate'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-mist flex items-center justify-center hover:bg-purple-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
