'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  ShieldCheck,
  Lock,
  Clock,
  Pill,
  Heart,
  Baby,
  Stethoscope,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Quote,
  FileText,
  Package,
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
  _count?: { products: number };
}

const categoryIcons: Record<string, React.ReactNode> = {
  medicamentos: <Pill className="w-7 h-7" />,
  'vitaminas-suplementos': <Sparkles className="w-7 h-7" />,
  'cuidado-personal': <Heart className="w-7 h-7" />,
  'equipo-medico': <Stethoscope className="w-7 h-7" />,
  'bebe-mama': <Baby className="w-7 h-7" />,
};

/* ─── Category Carousel Hook ─── */
function useCategoryCarousel(itemCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isPaused = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one card width + gap
    const cardWidth = el.querySelector<HTMLElement>('[data-carousel-item]')?.offsetWidth || 200;
    const amount = dir === 'left' ? -(cardWidth + 16) : cardWidth + 16;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (itemCount === 0) return;
    const startAuto = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (isPaused.current) return;
        const el = scrollRef.current;
        if (!el) return;
        // If at the end, loop back
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const cardWidth = el.querySelector<HTMLElement>('[data-carousel-item]')?.offsetWidth || 200;
          el.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
        }
      }, 3000);
    };
    startAuto();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [itemCount]);

  const onMouseEnter = () => { isPaused.current = true; };
  const onMouseLeave = () => { isPaused.current = false; };

  return { scrollRef, canScrollLeft, canScrollRight, scroll, updateScrollState, onMouseEnter, onMouseLeave };
}

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

function useInView() {
  const [visible, setVisible] = useState(false);
  const obsRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (obsRef.current) obsRef.current.disconnect();
    if (!node || visible) return;
    obsRef.current = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          obsRef.current?.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obsRef.current.observe(node);
  }, [visible]);

  return { ref, visible };
}

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const catSection = useInView();
  const dealsSection = useInView();
  const featuredSection = useInView();
  const testimonialsSection = useInView();

  const catCarousel = useCategoryCarousel(categories.length);

  useEffect(() => {
    apiClient
      .get('/banners/public')
      .then(({ data }) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => {});

    apiClient
      .get('/products', { params: { sortBy: 'popular', limit: 8 } })
      .then(({ data }) => {
        const products = data.data || data;
        setFeatured(Array.isArray(products) ? products : []);
      })
      .catch(() => {});

    apiClient
      .get('/products', { params: { limit: 30 } })
      .then(({ data }) => {
        const products = data.data || data;
        const list = Array.isArray(products) ? products : [];
        const withDiscount = list.filter(
          (p: any) => p.variants?.[0]?.compareAtPrice && Number(p.variants[0].compareAtPrice) > Number(p.variants[0].salePrice)
        );
        setDeals(withDiscount.length > 0 ? withDiscount.slice(0, 8) : list.slice(0, 4));
      })
      .catch(() => {});

    apiClient
      .get('/categories', { params: { parentOnly: true } })
      .then(({ data }) => setCategories(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => {});
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActiveBanner((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div>
      {/* ======== HERO SECTION — White, clean, brand-forward ======== */}
      <section className="relative bg-gradient-to-b from-white to-purple-50 overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-block text-purple-400 text-[13px] font-semibold uppercase tracking-widest">
                FARMA MADYSON
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] text-ink">
                Tu bienestar<br />
                <span className="text-purple-600">comienza aquí</span>
              </h1>
              <p className="text-charcoal text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Medicamentos de calidad al mejor precio, con envío a tu puerta en Chimaltenango y toda Guatemala.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-300 shadow-brand-md hover:shadow-brand-lg"
                >
                  Explorar productos
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/ofertas"
                  className="inline-flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-600 px-7 py-3.5 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300"
                >
                  Ver ofertas
                </Link>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4">
                <span className="flex items-center gap-2 text-sm text-slate">
                  <Truck className="w-4 h-4 text-teal-600" />
                  Envío en 24h
                </span>
                <span className="flex items-center gap-2 text-sm text-slate">
                  <Pill className="w-4 h-4 text-teal-600" />
                  +1,300 productos
                </span>
                <span className="flex items-center gap-2 text-sm text-slate">
                  <Lock className="w-4 h-4 text-teal-600" />
                  Compra segura
                </span>
              </div>
            </div>

            {/* Right — Visual element */}
            <div className="hidden lg:flex justify-center relative">
              <div className="relative">
                {/* Main circle */}
                <div className="w-[380px] h-[380px] rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shadow-brand-lg">
                  <div className="w-[300px] h-[300px] rounded-full bg-white flex items-center justify-center shadow-brand-md">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                        <Pill className="w-10 h-10 text-purple-600" />
                      </div>
                      <p className="text-3xl font-extrabold text-ink">+1,300</p>
                      <p className="text-slate text-sm mt-1">Productos disponibles</p>
                    </div>
                  </div>
                </div>
                {/* Floating card — Rating */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-brand-lg p-4 flex items-center gap-3 animate-float">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">4.9/5.0</p>
                    <p className="text-xs text-slate">Calificación</p>
                  </div>
                </div>
                {/* Floating card — Delivery */}
                <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-brand-lg p-4 flex items-center gap-3 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Mismo día</p>
                    <p className="text-xs text-slate">Entrega rápida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== DYNAMIC BANNERS ======== */}
      {banners.length > 0 && (
        <section className="py-6 bg-white">
          <div className="container mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden shadow-brand-md">
              {banners.map((b: any, i: number) => (
                <div
                  key={b.id}
                  className={`transition-opacity duration-700 ${i === activeBanner ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'}`}
                >
                  {b.linkUrl ? (
                    <Link href={b.linkUrl} className="block">
                      <img src={b.imageUrl} alt={b.title} className="w-full h-48 sm:h-64 lg:h-80 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-6 sm:p-8">
                        <h3 className="text-white text-xl sm:text-2xl font-bold">{b.title}</h3>
                        {b.subtitle && <p className="text-white/80 text-sm mt-1">{b.subtitle}</p>}
                      </div>
                    </Link>
                  ) : (
                    <>
                      <img src={b.imageUrl} alt={b.title} className="w-full h-48 sm:h-64 lg:h-80 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-6 sm:p-8">
                        <h3 className="text-white text-xl sm:text-2xl font-bold">{b.title}</h3>
                        {b.subtitle && <p className="text-white/80 text-sm mt-1">{b.subtitle}</p>}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {/* Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {banners.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeBanner ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======== CATEGORIES — Carousel ======== */}
      {categories.length > 0 && (
        <section ref={catSection.ref} className="py-16 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className={`text-center mb-10 ${catSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                Explora nuestras categorías
              </h2>
              <p className="text-slate mt-2">
                Encuentra lo que necesitas de forma rápida y sencilla
              </p>
            </div>

            {/* Carousel wrapper */}
            <div
              className={`relative group ${catSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '150ms' }}
              onMouseEnter={catCarousel.onMouseEnter}
              onMouseLeave={catCarousel.onMouseLeave}
            >
              {/* Left arrow */}
              {catCarousel.canScrollLeft && (
                <button
                  onClick={() => catCarousel.scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-mist shadow-brand-md flex items-center justify-center text-slate hover:text-purple-600 hover:border-purple-200 transition-all duration-200 -translate-x-1 sm:-translate-x-3"
                  aria-label="Anterior categoría"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Scrollable track */}
              <div
                ref={catCarousel.scrollRef}
                onScroll={catCarousel.updateScrollState}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categorias/${cat.slug}`}
                    data-carousel-item
                    className="group/card flex-shrink-0 snap-start flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-mist hover:border-purple-200 hover:shadow-brand-md transition-all duration-300 text-center
                      w-[calc(40%-8px)] sm:w-[calc(16.666%-14px)] lg:w-[calc(16.666%-14px)]"
                  >
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover/card:bg-purple-600 group-hover/card:text-white transition-all duration-300">
                      {categoryIcons[cat.slug] || <Pill className="w-7 h-7" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-ink group-hover/card:text-purple-600 transition-colors block">
                        {cat.name}
                      </span>
                      {cat._count?.products != null && (
                        <span className="text-xs text-silver">{cat._count.products} productos</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right arrow */}
              {catCarousel.canScrollRight && (
                <button
                  onClick={() => catCarousel.scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-mist shadow-brand-md flex items-center justify-center text-slate hover:text-purple-600 hover:border-purple-200 transition-all duration-200 translate-x-1 sm:translate-x-3"
                  aria-label="Siguiente categoría"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======== OFERTAS ESPECIALES — Lavender background ======== */}
      {deals.length > 0 && (
        <section ref={dealsSection.ref} className="bg-purple-50 py-16">
          <div className="container mx-auto px-4">
            <div className={`flex items-center justify-between mb-8 ${dealsSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                    Ofertas especiales
                  </h2>
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                    🏷️ Ahorra
                  </span>
                </div>
                <p className="text-slate mt-1">Los mejores precios en productos seleccionados</p>
              </div>
              <Link
                href="/ofertas"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Ver todas las ofertas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className={dealsSection.visible ? 'animate-fade-in-up' : 'opacity-0'} style={{ animationDelay: '200ms' }}>
              <ProductGrid
                products={deals}
                onAddToCart={(variantId) => addItem(variantId, 1)}
              />
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link
                href="/ofertas"
                className="inline-flex items-center gap-1 text-sm font-medium text-purple-600"
              >
                Ver todas las ofertas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ======== PRODUCTOS POPULARES ======== */}
      <section ref={featuredSection.ref} className="container mx-auto px-4 py-16">
        <div className={`flex items-center justify-between mb-8 ${featuredSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Los más buscados
            </h2>
            <p className="text-slate mt-1">Los productos más vendidos esta semana</p>
          </div>
          <Link
            href="/productos"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className={featuredSection.visible ? 'animate-fade-in-up' : 'opacity-0'} style={{ animationDelay: '200ms' }}>
          <ProductGrid
            products={featured}
            onAddToCart={(variantId) => addItem(variantId, 1)}
          />
        </div>
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/productos"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600"
          >
            Ver todos los productos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ======== BANNER — Servicio de recetas ======== */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-8 sm:p-10 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="relative z-10">
              <FileText className="w-10 h-10 mb-4 text-teal-200" />
              <h3 className="text-xl sm:text-2xl font-bold">¿Necesitas medicamento con receta?</h3>
              <p className="text-teal-100 text-sm mt-2 max-w-xs leading-relaxed">
                Sube tu receta y nosotros hacemos el resto. Tu salud es lo primero.
              </p>
              <Link
                href="/subir-receta"
                className="inline-flex items-center gap-2 mt-5 bg-white text-teal-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors"
              >
                Subir mi receta <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-8 sm:p-10 text-white">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
            <div className="relative z-10">
              <Sparkles className="w-10 h-10 mb-4 text-purple-200" />
              <h3 className="text-xl sm:text-2xl font-bold">Vitaminas y Suplementos</h3>
              <p className="text-purple-100 text-sm mt-2 max-w-xs leading-relaxed">
                Fortalece tu sistema inmune con nuestra selección de vitaminas premium.
              </p>
              <Link
                href="/categorias/vitaminas-suplementos"
                className="inline-flex items-center gap-2 mt-5 bg-white text-purple-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
              >
                Ver productos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======== TESTIMONIALS — Snow background ======== */}
      <section ref={testimonialsSection.ref} className="bg-snow py-16">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-10 ${testimonialsSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Miles de familias confían en nosotros
            </h2>
            <p className="text-slate mt-2">
              Experiencias reales de nuestros clientes en Chimaltenango
            </p>
          </div>

          {/* Desktop: grid */}
          <div className={`hidden md:grid md:grid-cols-3 gap-6 ${testimonialsSection.visible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-mist shadow-brand-sm hover:shadow-brand-md transition-shadow duration-300">
                <Quote className="w-8 h-8 text-purple-200 mb-3" />
                <p className="text-sm text-charcoal leading-relaxed">{t.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-ink">{t.name}</p>
                    <p className="text-xs text-silver">Cliente verificado</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: carousel */}
          <div className="md:hidden">
            <div className="bg-white rounded-2xl p-6 border border-mist shadow-brand-sm">
              <Quote className="w-8 h-8 text-purple-200 mb-3" />
              <p className="text-sm text-charcoal leading-relaxed">
                {testimonials[testimonialIndex]?.text}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-ink">
                    {testimonials[testimonialIndex]?.name}
                  </p>
                  <p className="text-xs text-silver">Cliente verificado</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonials[testimonialIndex]?.rating ?? 0 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                className="w-9 h-9 rounded-full bg-white border border-mist flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate" />
              </button>
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === testimonialIndex ? 'bg-purple-600' : 'bg-mist'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                className="w-9 h-9 rounded-full bg-white border border-mist flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======== SLOGAN CIERRE ======== */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-700 py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Donde comienza el bienestar
          </h2>
          <p className="text-purple-200 mt-3 text-base sm:text-lg">
            Farma Madyson — Cuidamos de ti y de tu bolsillo
          </p>
        </div>
      </section>
    </div>
  );
}
