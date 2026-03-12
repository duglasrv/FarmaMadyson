'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import ProductGrid from '@/components/store/ProductGrid';

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

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: { id: string; name: string; slug: string } | null;
  children?: { id: string; name: string; slug: string }[];
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('name');
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    apiClient
      .get(`/categories/${slug}`)
      .then(({ data }) => setCategory(data))
      .catch(() => setCategory(null));
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    apiClient
      .get('/products', { params: { categorySlug: category.slug, page, limit: 20, sortBy: sort } })
      .then(({ data }) => {
        const items = data.data || data;
        setProducts(Array.isArray(items) ? items : []);
        setTotal(data.meta?.total || data.total || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, page, sort]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-primary">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/productos" className="hover:text-primary">Productos</Link>
        {category?.parent && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/categorias/${category.parent.slug}`} className="hover:text-primary">
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{category?.name || slug}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{category?.name || 'Categoría'}</h1>
          {category?.description && (
            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground">{total} productos</p>
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-white"
        >
          <option value="name">Nombre A-Z</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="newest">Más recientes</option>
        </select>
      </div>

      {/* Sub-categories */}
      {category?.children && category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/categorias/${sub.slug}`}
              className="px-4 py-2 text-sm bg-white border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

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
          emptyMessage="No hay productos en esta categoría."
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
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
  );
}
