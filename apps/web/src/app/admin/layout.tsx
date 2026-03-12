'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && user) {
      const isAdmin = user.abilities?.some(
        (a) =>
          (a.subject === 'all' && a.action === 'manage') ||
          ['product', 'order', 'report', 'settings', 'inventory'].some(
            (s) => a.subject === s,
          ),
      );
      if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <AdminSidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
