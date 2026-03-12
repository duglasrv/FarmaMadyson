import { formatPrice } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { current: 'text-sm font-semibold', old: 'text-xs' },
  md: { current: 'text-base font-bold', old: 'text-sm' },
  lg: { current: 'text-2xl font-bold', old: 'text-base' },
};

export default function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
}: PriceDisplayProps) {
  const cls = sizeClasses[size];
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <span className={`${cls.current} text-purple-600`}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className={`${cls.old} text-silver line-through`}>
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
