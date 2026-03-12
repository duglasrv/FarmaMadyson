interface StockBadgeProps {
  stock: number;
}

export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
        Agotado
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
        Quedan {stock}
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      En stock
    </span>
  );
}
