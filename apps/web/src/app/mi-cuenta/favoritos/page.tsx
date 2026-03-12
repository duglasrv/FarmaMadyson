'use client';

import { useEffect, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/wishlist')
      .then(({ data }) => setFavorites(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      await apiClient.delete(`/wishlist/${id}`);
      setFavorites((f) => f.filter((item) => item.id !== id));
    } catch {}
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Mis Favoritos</h2>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="aspect-square bg-muted/50 rounded-lg mb-2" />
              <div className="h-4 bg-muted/50 rounded" />
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No tienes productos favoritos.</p>
          <Link href="/productos" className="text-primary hover:underline text-sm mt-2 inline-block">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {favorites.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <Link href={`/productos/${item.product?.slug}`} className="block aspect-square bg-muted/30">
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-4"
                  />
                )}
              </Link>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.product?.name}</p>
                {item.product?.variants?.[0] && (
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatPrice(item.product.variants[0].price)}
                  </p>
                )}
                <button
                  onClick={() => removeFavorite(item.id)}
                  className="mt-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
