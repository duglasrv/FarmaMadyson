'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart-store';
import { apiClient } from '@/lib/api-client';
import CartDrawer from './CartDrawer';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [allCatsOpen, setAllCatsOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Top bar */}
        <div className="bg-primary text-primary-foreground text-xs">
          <div className="container mx-auto px-4 py-1.5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <a href="mailto:farmamadyson@gmail.com" className="flex items-center gap-1 hover:text-white/80 transition-colors">
                <Phone className="w-3 h-3" />
                farmamadyson@gmail.com
              </a>
              <span className="hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Chimaltenango, Guatemala
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block">Envío gratis a partir de Q200</span>
              {isAuthenticated ? (
                <Link href="/mi-cuenta" className="hover:text-white transition-colors">Mi Cuenta</Link>
              ) : (
                <Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
              aria-label="Menú"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-primary">
                Farma<span className="text-secondary">Madyson</span>
              </span>
            </Link>

            {/* Search - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-2xl"
            >
              <div className="relative w-full flex">
                {/* All Categories dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAllCatsOpen(!allCatsOpen)}
                    className="h-full px-4 bg-primary text-white rounded-l-lg text-sm font-medium flex items-center gap-1 hover:bg-primary-dark transition-colors whitespace-nowrap"
                  >
                    Categorías
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {allCatsOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAllCatsOpen(false)} />
                      <ul className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-lg border border-border py-2 min-w-56 z-20 max-h-80 overflow-y-auto">
                        {categories.map((cat) => (
                          <li key={cat.id}>
                            <Link
                              href={`/categorias/${cat.slug}`}
                              onClick={() => setAllCatsOpen(false)}
                              className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary transition-colors"
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar medicamentos, vitaminas, suplementos..."
                  className="flex-1 px-4 py-2.5 border-y border-border bg-muted/20 focus:outline-none focus:bg-white focus:border-primary text-sm"
                />
                <button
                  type="submit"
                  className="px-5 bg-secondary text-white rounded-r-lg hover:bg-secondary-dark transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Upload Prescription - Desktop */}
              <Link
                href="/subir-receta"
                className="hidden xl:flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
                title="Subir receta médica"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden xl:block text-xs font-medium">Subir<br/>Receta</span>
              </Link>

              {/* User */}
              {isAuthenticated ? (
                <Link
                  href="/mi-cuenta"
                  className="hidden sm:flex items-center gap-2 px-2 py-2 text-foreground hover:text-primary transition-colors"
                  title="Mi cuenta"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:block text-xs font-medium leading-tight">
                    Mi<br/>Cuenta
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-2 py-2 text-foreground hover:text-primary transition-colors"
                  title="Iniciar sesión"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:block text-xs font-medium leading-tight">
                    Iniciar<br/>Sesión
                  </span>
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-2 sm:px-3 py-2 text-foreground hover:text-primary transition-colors"
                title="Carrito de compras"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 left-5 bg-accent text-accent-foreground text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
                <span className="hidden lg:block text-xs font-medium">Carrito</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category nav - Desktop */}
        <nav className="hidden lg:block border-t border-border bg-gradient-to-r from-primary to-primary-dark">
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-0 text-sm">
              <li>
                <Link
                  href="/productos"
                  className="px-4 py-2.5 inline-block font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Todos los Productos
                </Link>
              </li>
              {categories.slice(0, 7).map((cat) => (
                <li key={cat.id} className="relative group">
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="px-4 py-2.5 inline-flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {cat.name}
                    {cat.children && cat.children.length > 0 && (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Link>
                  {cat.children && cat.children.length > 0 && (
                    <ul className="absolute top-full left-0 hidden group-hover:block bg-white shadow-xl rounded-b-lg border border-border py-2 min-w-48 z-50">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categorias/${child.slug}`}
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li className="ml-auto">
                <Link
                  href="/ofertas"
                  className="px-4 py-2.5 inline-block font-semibold text-accent hover:text-accent-light transition-colors"
                >
                  🔥 Ofertas
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Mobile search */}
        <div className="lg:hidden border-t border-border px-4 py-2 bg-muted/30">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar medicamentos..."
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </form>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white shadow-xl max-h-[70vh] overflow-y-auto">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/productos"
                    className="block px-3 py-2.5 rounded-lg hover:bg-muted font-medium text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Todos los Productos
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className="block px-3 py-2.5 rounded-lg hover:bg-muted text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Link
                  href="/subir-receta"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <FileText className="w-4 h-4 text-primary" />
                  Subir Receta
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/mi-cuenta"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="w-4 h-4 text-primary" />
                    Mi Cuenta
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="w-4 h-4 text-primary" />
                    Iniciar Sesión
                  </Link>
                )}
              </div>
              {!isAuthenticated && (
                <div className="pt-2 border-t border-border">
                  <Link
                    href="/login"
                    className="block w-full text-center py-2.5 bg-primary text-white rounded-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
