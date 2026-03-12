'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import ProductGrid from '@/components/store/ProductGrid';
import CategoryMenu from '@/components/store/CategoryMenu';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  brand?: { name: string } | null;
  category?: { name: string } | null;
  requiresPrescription: boolean;
  variants: {
    id: string;
    price: number;
    compareAtPrice?: number | null;
    presentation: string;
    computedStock?: number;
  }[];
}

interface Filters {
  categorySlug?: string;
  brandId?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  sortBy?: string;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'name',
    inStock: false,
  });
  const addItem = useCartStore((s) => s.addItem);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: 20,
      };
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.categorySlug) params.categorySlug = filters.categorySlug;
      if (filters.brandId) params.brandId = filters.brandId;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;

      const { data } = await apiClient.get('/products', { params });
      const items = data.data || data;
      setProducts(Array.isArray(items) ? items : []);
      setTotal(data.meta?.total || data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setFilters((f) => ({ ...f, categorySlug: cat }));
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} productos encontrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.sortBy}
            onChange={(e) => {
              setFilters((f) => ({ ...f, sortBy: e.target.value }));
              setPage(1);
            }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="name">Nombre A-Z</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="newest">Más recientes</option>
            <option value="popular">Más populares</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1 text-sm px-3 py-2 border border-border rounded-lg hover:bg-muted"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside
          className={`w-64 flex-shrink-0 space-y-4 ${
            showFilters ? 'block' : 'hidden lg:block'
          }`}
        >
          <CategoryMenu />

          <div className="bg-white rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Filtros</h3>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Precio mínimo (Q)
              </label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Precio máximo (Q)
              </label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm"
                placeholder="1000"
                min="0"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => setFilters((f) => ({ ...f, inStock: e.target.checked }))}
                className="rounded border-border"
              />
              Solo con stock
            </label>

            <button
              onClick={() => {
                setFilters({ sortBy: 'name', inStock: false });
                setPage(1);
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                  <div className="aspect-square bg-muted/50 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-muted/50 rounded w-1/3" />
                    <div className="h-4 bg-muted/50 rounded w-full" />
                    <div className="h-3 bg-muted/50 rounded w-1/2" />
                    <div className="h-8 bg-muted/50 rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid
              products={products}
              onAddToCart={(variantId) => addItem(variantId, 1)}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      p === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted/50 rounded w-48" /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-64 bg-muted/50 rounded-xl" />)}</div></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}
