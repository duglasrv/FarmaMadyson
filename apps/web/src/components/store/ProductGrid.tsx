import ProductCard from './ProductCard';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProductGridProps {
  products: any[];
  onAddToCart?: (variantId: string) => void;
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  onAddToCart,
  emptyMessage = 'No se encontraron productos.',
}: ProductGridProps) {
  const items = Array.isArray(products) ? products : [];

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
