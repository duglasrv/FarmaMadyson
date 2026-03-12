'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import ProductGrid from '@/components/store/ProductGrid';
import SearchBar from '@/components/store/SearchBar';

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

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    apiClient
      .get('/products/search', { params: { q: query, limit: 40 } })
      .then(({ data }) => {
        const items = data.data || data;
        setProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-xl mx-auto mb-8">
        <SearchBar initialQuery={query} />
      </div>

      {query ? (
        <>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Resultados para &ldquo;{query}&rdquo;
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {loading ? 'Buscando...' : `${products.length} productos encontrados`}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                  <div className="aspect-square bg-muted/50 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-full" />
                    <div className="h-3 bg-muted/50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid
              products={products}
              onAddToCart={(variantId) => addItem(variantId, 1)}
              emptyMessage="No se encontraron productos para tu búsqueda."
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Buscar productos</h1>
          <p className="text-muted-foreground">
            Escribe el nombre del medicamento o producto que buscas
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6 text-center"><p className="text-muted-foreground">Cargando...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
