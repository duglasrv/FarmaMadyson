'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  Clock,
  Pill,
  Heart,
  Baby,
  Stethoscope,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
import ProductGrid from '@/components/store/ProductGrid';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  medicamentos: <Pill className="w-7 h-7" />,
  'vitaminas-suplementos': <Sparkles className="w-7 h-7" />,
  'cuidado-personal': <Heart className="w-7 h-7" />,
  'equipo-medico': <Stethoscope className="w-7 h-7" />,
  'bebe-mama': <Baby className="w-7 h-7" />,
};

const testimonials = [
  {
    name: 'María López',
    text: 'Excelente servicio, mis medicamentos llegaron rápido y bien empacados. La mejor farmacia en línea de Chimaltenango.',
    rating: 5,
  },
  {
    name: 'Carlos Hernández',
    text: 'Precios justos y productos originales. Me encanta poder pedir desde casa y que lleguen el mismo día.',
    rating: 5,
  },
  {
    name: 'Ana Morales',
    text: 'Muy fácil de usar la tienda. Encontré todo lo que necesitaba para mi bebé. Súper recomendada.',
    rating: 4,
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    apiClient
      .get('/products', { params: { sortBy: 'popular', limit: 8 } })
      .then(({ data }) => {
        const products = data.data || data;
        setFeatured(Array.isArray(products) ? products : []);
      })
      .catch(() => {});

    apiClient
      .get('/products', { params: { limit: 8 } })
      .then(({ data }) => {
        const products = data.data || data;
        const list = Array.isArray(products) ? products : [];
        const withDiscount = list.filter(
          (p: any) => p.variants?.[0]?.compareAtPrice && Number(p.variants[0].compareAtPrice) > Number(p.variants[0].salePrice)
        );
        setDeals(withDiscount.length > 0 ? withDiscount : list.slice(0, 4));
      })
      .catch(() => {});

    apiClient
      .get('/categories', { params: { parentOnly: true } })
      .then(({ data }) => setCategories(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => {});
  }, []);

  return (
    <div className="pb-12">
      {/* ======== HERO SECTION ======== */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero text */}
            <div className="text-white space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm px-4 py-1.5 rounded-full">
                <Truck className="w-4 h-4" />
                Envío gratis en compras mayores a Q200
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Tu salud es nuestra
                <span className="text-accent"> prioridad</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg max-w-lg mx-auto lg:mx-0">
                Medicamentos, vitaminas y productos de cuidado personal con entrega a domicilio en Chimaltenango, Guatemala.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent-light transition-colors"
                >
                  Comprar Ahora
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/categorias"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/25 transition-colors"
                >
                  Explorar Categorías
                </Link>
              </div>
              {/* Trust badges */}
              <div className="flex items-center gap-6 justify-center lg:justify-start pt-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-accent" />
                  Productos Originales
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-accent" />
                  Entrega Rápida
                </span>
              </div>
            </div>

            {/* Hero image / Stats card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Pill className="w-16 h-16 mx-auto mb-3 text-accent" />
                      <p className="text-2xl font-bold">+500</p>
                      <p className="text-white/70 text-sm">Productos disponibles</p>
                    </div>
                  </div>
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 animate-bounce-slow">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">4.9/5.0</p>
                    <p className="text-xs text-muted-foreground">Calificación</p>
                  </div>
                </div>
                {/* Floating card 2 */}
                <div className="absolute -top-4 -right-8 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Mismo día</p>
                    <p className="text-xs text-muted-foreground">Entrega rápida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== CATEGORIES SECTION ======== */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Compra por Categoría
            </h2>
            <p className="text-muted-foreground mt-2">
              Encuentra lo que necesitas de forma rápida y sencilla
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-border hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300">
                  {categoryIcons[cat.slug] || <Pill className="w-7 h-7" />}
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ======== TODAY'S DEALS ======== */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                  🔥 Ofertas del Día
                </h2>
                <p className="text-muted-foreground mt-1">Ahorra en los mejores productos</p>
              </div>
              <Link
                href="/ofertas"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ProductGrid
              products={deals}
              onAddToCart={(variantId) => addItem(variantId, 1)}
            />
            <div className="sm:hidden mt-4 text-center">
              <Link
                href="/ofertas"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Ver todas las ofertas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ======== PROMOTIONAL BANNERS ======== */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary to-secondary-dark p-6 sm:p-8 text-white group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">Bienestar</span>
              <h3 className="text-xl sm:text-2xl font-bold mt-3">Vitaminas y Suplementos</h3>
              <p className="text-white/80 text-sm mt-2 max-w-xs">
                Fortalece tu sistema inmune con nuestra selección de vitaminas premium.
              </p>
              <Link
                href="/categorias/vitaminas-suplementos"
                className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-accent hover:text-accent-light transition-colors"
              >
                Ver Productos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-dark p-6 sm:p-8 text-white group">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
            <div className="relative z-10">
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">Cuidado</span>
              <h3 className="text-xl sm:text-2xl font-bold mt-3">Cuidado Personal</h3>
              <p className="text-white/80 text-sm mt-2 max-w-xs">
                Los mejores productos para tu higiene y cuidado diario al mejor precio.
              </p>
              <Link
                href="/categorias/cuidado-personal"
                className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-accent hover:text-accent-light transition-colors"
              >
                Ver Productos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======== FEATURED PRODUCTS ======== */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground mt-1">Los más vendidos esta semana</p>
          </div>
          <Link
            href="/productos"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ProductGrid
          products={featured}
          onAddToCart={(variantId) => addItem(variantId, 1)}
        />
        <div className="sm:hidden mt-4 text-center">
          <Link
            href="/productos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            Ver todos los productos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ======== TESTIMONIALS ======== */}
      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-muted-foreground mt-2">
              Miles de clientes satisfechos en Chimaltenango
            </p>
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <Quote className="w-8 h-8 text-primary/20 mb-3" />
                <p className="text-sm text-foreground leading-relaxed">{t.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">Cliente verificado</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: carousel */}
          <div className="md:hidden">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <Quote className="w-8 h-8 text-primary/20 mb-3" />
              <p className="text-sm text-foreground leading-relaxed">
                {testimonials[testimonialIndex].text}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {testimonials[testimonialIndex].name}
                  </p>
                  <p className="text-xs text-muted-foreground">Cliente verificado</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === testimonialIndex ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======== CTA SECTION ======== */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">¿Necesitas ayuda con tu pedido?</h2>
          <p className="text-white/80 mt-2 max-w-lg mx-auto">
            Nuestro equipo está listo para ayudarte. Contáctanos por WhatsApp o visítanos en nuestra sucursal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a
              href="https://wa.me/50200000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Escribir por WhatsApp
            </a>
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 bg-white/15 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/25 transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
