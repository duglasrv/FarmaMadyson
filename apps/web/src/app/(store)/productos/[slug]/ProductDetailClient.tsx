'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Minus, Plus, ChevronRight, Shield, Truck, Heart } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import PriceDisplay from '@/components/store/PriceDisplay';
import StockBadge from '@/components/store/StockBadge';
import PrescriptionBadge from '@/components/store/PrescriptionBadge';

interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  presentation: string;
  computedStock?: number;
}

interface PharmaceuticalInfo {
  genericName?: string;
  activeIngredient?: string;
  concentration?: string;
  administrationRoute?: string;
  therapeuticAction?: string;
  indications?: string;
  contraindications?: string;
  sideEffects?: string;
  dosage?: string;
  storageConditions?: string;
  registroSanitario?: string;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  requiresPrescription: boolean;
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  variants: Variant[];
  pharmaceuticalInfo?: PharmaceuticalInfo | null;
  tags?: { name: string }[];
}

export default function ProductDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'pharma' | 'info'>('description');
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/products/slug/${slug}`)
      .then(({ data }) => {
        // Map API fields to component interface
        const mapped: ProductDetail = {
          ...data,
          requiresPrescription: data.pharmaInfo?.requiresPrescription ?? false,
          pharmaceuticalInfo: data.pharmaInfo ?? null,
          variants: (data.variants || []).map((v: Record<string, unknown>) => ({
            ...v,
            price: Number(v.salePrice) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            computedStock: v.stock ?? v.computedStock ?? 0,
            presentation: v.name || v.presentation || 'Unidad',
          })),
        };
        setProduct(mapped);
        setSelectedVariant(mapped.variants?.[0] || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted/50 rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 bg-muted/50 rounded w-1/3" />
            <div className="h-8 bg-muted/50 rounded w-2/3" />
            <div className="h-6 bg-muted/50 rounded w-1/4" />
            <div className="h-12 bg-muted/50 rounded w-1/2 mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El producto que buscas no existe o fue eliminado.
        </p>
        <Link href="/productos" className="text-primary hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const inStock = (selectedVariant?.computedStock ?? 0) > 0;
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' fill='%23f3f4f6'%3E%3Crect width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ESin imagen%3C/text%3E%3C/svg%3E";
  const mainImage = product.images?.[selectedImage] || placeholderSvg;

  const handleAddToCart = () => {
    if (selectedVariant && inStock) {
      addItem(selectedVariant.id, quantity);
      setQuantity(1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/productos" className="hover:text-primary">Productos</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/categorias/${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-white rounded-xl border border-border overflow-hidden">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-contain p-8"
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderSvg; }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-lg border overflow-hidden ${
                    i === selectedImage ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = placeholderSvg; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <Link
              href={`/productos?brandId=${product.brand.id}`}
              className="text-sm text-muted-foreground uppercase tracking-wide hover:text-primary"
            >
              {product.brand.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>

          {product.requiresPrescription && <PrescriptionBadge />}

          {selectedVariant && (
            <div className="space-y-4">
              <PriceDisplay
                price={selectedVariant.price}
                compareAtPrice={selectedVariant.compareAtPrice}
                size="lg"
              />
              <StockBadge stock={selectedVariant.computedStock ?? 0} />
            </div>
          )}

          {/* Variant selector */}
          {product.variants.length > 1 && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Presentación
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {v.presentation}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-muted"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium text-sm border-l border-r border-border min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(selectedVariant?.computedStock ?? 99, q + 1),
                  )
                }
                className="px-3 py-2 hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {inStock ? 'Agregar al Carrito' : 'Agotado'}
            </button>

            <button className="p-3 border border-border rounded-lg hover:bg-muted transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="w-4 h-4 text-secondary" />
              Envío a Chimaltenango
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-secondary" />
              Producto original
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b border-border">
          {[
            { key: 'description', label: 'Descripción' },
            ...(product.pharmaceuticalInfo
              ? [{ key: 'pharma', label: 'Información Farmacéutica' }]
              : []),
            { key: 'info', label: 'Información Adicional' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose prose-sm max-w-none text-foreground">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="text-muted-foreground">Sin descripción disponible.</p>
              )}
            </div>
          )}

          {activeTab === 'pharma' && product.pharmaceuticalInfo && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Nombre Genérico', value: product.pharmaceuticalInfo.genericName },
                { label: 'Principio Activo', value: product.pharmaceuticalInfo.activeIngredient },
                { label: 'Concentración', value: product.pharmaceuticalInfo.concentration },
                { label: 'Vía de Administración', value: product.pharmaceuticalInfo.administrationRoute },
                { label: 'Acción Terapéutica', value: product.pharmaceuticalInfo.therapeuticAction },
                { label: 'Indicaciones', value: product.pharmaceuticalInfo.indications },
                { label: 'Contraindicaciones', value: product.pharmaceuticalInfo.contraindications },
                { label: 'Efectos Secundarios', value: product.pharmaceuticalInfo.sideEffects },
                { label: 'Dosificación', value: product.pharmaceuticalInfo.dosage },
                { label: 'Almacenamiento', value: product.pharmaceuticalInfo.storageConditions },
                { label: 'Registro Sanitario', value: product.pharmaceuticalInfo.registroSanitario },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="p-3 bg-muted/30 rounded-lg">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {item.label}
                    </dt>
                    <dd className="text-sm mt-1 text-foreground">{item.value}</dd>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'info' && selectedVariant && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">SKU</span>
                <span>{selectedVariant.sku}</span>
              </div>
              {product.brand && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Marca/Laboratorio</span>
                  <span>{product.brand.name}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Categoría</span>
                  <span>{product.category.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Presentación</span>
                <span>{selectedVariant.presentation}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Requiere Receta</span>
                <span>{product.requiresPrescription ? 'Sí' : 'No'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
