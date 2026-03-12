'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';

const menuItems = [
  { href: '/mi-cuenta', label: 'Resumen', icon: LayoutDashboard },
  { href: '/mi-cuenta/pedidos', label: 'Mis Pedidos', icon: ShoppingBag },
  { href: '/mi-cuenta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/mi-cuenta/direcciones', label: 'Direcciones', icon: MapPin },
  { href: '/mi-cuenta/perfil', label: 'Mi Perfil', icon: User },
];

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/mi-cuenta');
    }
  }, [isLoading, isAuthenticated, router]);

  // Admin users should use the admin panel, not customer account
  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      router.replace('/admin');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Mi Cuenta</h1>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
                <nav className="py-2">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'text-primary bg-primary/5 font-medium'
                            : 'text-foreground hover:bg-muted hover:text-primary'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
