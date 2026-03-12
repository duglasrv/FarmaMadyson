import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import PriceDisplay from './PriceDisplay';
import StockBadge from './StockBadge';
import PrescriptionBadge from './PrescriptionBadge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    brand?: { name: string } | null;
    category?: { name: string } | null;
    requiresPrescription?: boolean;
    pharmaInfo?: { requiresPrescription?: boolean } | null;
    variants: {
      id: string;
      salePrice: string | number;
      compareAtPrice?: string | number | null;
      name?: string;
      presentation?: string;
      stock?: number;
      computedStock?: number;
    }[];
  };
  onAddToCart?: (variantId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const variant = product.variants[0];
  if (!variant) return null;

  const price = Number(variant.salePrice);
  const compareAt = variant.compareAtPrice ? Number(variant.compareAtPrice) : null;
  const stock = variant.stock ?? variant.computedStock ?? 0;
  const inStock = stock > 0;
  const image = product.images?.[0] || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23f3f4f6%27%3E%3Crect width=%27300%27 height=%27300%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2714%27 fill=%27%239ca3af%27%3ESin imagen%3C/text%3E%3C/svg%3E';
  const needsRx = product.requiresPrescription ?? product.pharmaInfo?.requiresPrescription ?? false;
  const variantLabel = variant.presentation ?? variant.name ?? '';

  return (
    <div className="group bg-white rounded-2xl border border-mist overflow-hidden shadow-brand-sm hover:shadow-brand-lg hover:-translate-y-0.5 transition-all duration-300">
      <Link href={`/productos/${product.slug}`} className="block relative aspect-square overflow-hidden bg-snow">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-103 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23f3f4f6%27%3E%3Crect width=%27300%27 height=%27300%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2714%27 fill=%27%239ca3af%27%3ESin imagen%3C/text%3E%3C/svg%3E';
          }}
        />
        {needsRx && (
          <div className="absolute top-2 left-2">
            <PrescriptionBadge />
          </div>
        )}
        {compareAt && compareAt > price && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{Math.round(((compareAt - price) / compareAt) * 100)}%
          </div>
        )}
      </Link>

      <div className="p-4 space-y-2">
        {product.brand && (
          <span className="text-xs text-silver uppercase tracking-wider font-medium">
            {product.brand.name}
          </span>
        )}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-sm font-semibold text-ink line-clamp-2 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        {variantLabel && (
          <p className="text-xs text-silver">{variantLabel}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <PriceDisplay price={price} compareAtPrice={compareAt} />
          <StockBadge stock={stock} />
        </div>

        <button
          onClick={() => inStock && onAddToCart?.(variant.id)}
          disabled={!inStock}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-glow active:scale-[0.97]"
        >
          <ShoppingCart className="w-4 h-4" />
          {inStock ? 'Agregar al Carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  );
}
