'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, MapPin, Package } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';

export default function AccountOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    favoriteCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get('/orders/my', { params: { limit: 3 } })
      .then(({ data }) => {
        setRecentOrders(data.orders || []);
        setStats((s) => ({ ...s, totalOrders: data.total || 0 }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        ¡Hola, {user?.firstName}! 👋
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <ShoppingBag className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Pedidos totales</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <Package className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <Heart className="w-5 h-5 text-destructive mb-2" />
          <p className="text-2xl font-bold">{stats.favoriteCount}</p>
          <p className="text-xs text-muted-foreground">Favoritos</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <MapPin className="w-5 h-5 text-secondary mb-2" />
          <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Total gastado</p>
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Pedidos recientes</h3>
          <Link href="/mi-cuenta/pedidos" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
            Aún no tienes pedidos.{' '}
            <Link href="/productos" className="text-primary hover:underline">
              ¡Haz tu primera compra!
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/mi-cuenta/pedidos/${order.id}`}
                className="block bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString('es-GT')} ·{' '}
                      {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
