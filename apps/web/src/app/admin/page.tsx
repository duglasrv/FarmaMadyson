'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PENDING_PAYMENT: 'Pago Pendiente',
  PENDING_PRESCRIPTION: 'Receta Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  PENDING_PAYMENT: '#F97316',
  PENDING_PRESCRIPTION: '#8B5CF6',
  CONFIRMED: '#3B82F6',
  PREPARING: '#6366F1',
  SHIPPED: '#14B8A6',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
  REFUNDED: '#6B7280',
};

const DONUT_COLORS = [
  '#F59E0B', '#F97316', '#8B5CF6', '#3B82F6',
  '#6366F1', '#14B8A6', '#10B981', '#EF4444', '#6B7280',
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpis, salesChart, topProducts, ordersByStatus, recentOrders, recentAlerts } =
    data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de FarmaMadyson</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas del Día"
          value={formatPrice(kpis?.salesToday?.amount || 0)}
          subtitle={`${kpis?.salesToday?.count || 0} pedidos`}
          icon={DollarSign}
          color="text-green-600 bg-green-50"
        />
        <KpiCard
          title="Pedidos Pendientes"
          value={kpis?.pendingOrders || 0}
          subtitle="Requieren atención"
          icon={ShoppingBag}
          color="text-amber-600 bg-amber-50"
        />
        <KpiCard
          title="Stock Bajo"
          value={kpis?.lowStockCount || 0}
          subtitle="Productos por reabastecer"
          icon={AlertTriangle}
          color="text-red-600 bg-red-50"
        />
        <KpiCard
          title="Por Vencer (30 días)"
          value={kpis?.expiringSoonCount || 0}
          subtitle="Lotes próximos a expirar"
          icon={Clock}
          color="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ventas Últimos 7 Días</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + 'T12:00:00');
                    return d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' });
                  }}
                  fontSize={12}
                />
                <YAxis fontSize={12} tickFormatter={(v: number) => `Q${v}`} />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value)), 'Ventas']}
                  labelFormatter={(label) => {
                    const d = new Date(label + 'T12:00:00');
                    return d.toLocaleDateString('es-GT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    });
                  }}
                />
                <Bar dataKey="total" fill="#1B7B8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Donut */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Pedidos por Estado</h3>
          <div className="h-64 flex items-center justify-center">
            {ordersByStatus?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {ordersByStatus.map(
                      (entry: { status: string; count: number }, i: number) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || DONUT_COLORS[i % DONUT_COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value, _, props) => [
                      value,
                      STATUS_LABELS[(props as { payload: { status: string } }).payload.status] || (props as { payload: { status: string } }).payload.status,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {ordersByStatus?.slice(0, 5).map(
              (s: { status: string; count: number }) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.status] || '#6B7280' }}
                    />
                    <span className="text-muted-foreground">
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </div>
                  <span className="font-medium">{s.count}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Top 10 Productos Más Vendidos
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topProducts || []}
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="productName"
                width={110}
                fontSize={11}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'quantity' ? `${value} uds` : formatPrice(Number(value)),
                  name === 'quantity' ? 'Cantidad' : 'Ingresos',
                ]}
              />
              <Bar dataKey="quantity" fill="#5B2D90" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Últimos Pedidos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium"># Orden</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders?.map(
                  (order: {
                    id: string;
                    orderNumber: string;
                    totalAmount: number;
                    status: string;
                    user: { firstName: string; lastName: string };
                  }) => (
                    <tr key={order.id}>
                      <td className="py-2 font-medium text-primary">{order.orderNumber}</td>
                      <td className="py-2 text-muted-foreground">
                        {order.user.firstName} {order.user.lastName}
                      </td>
                      <td className="py-2">{formatPrice(Number(order.totalAmount))}</td>
                      <td className="py-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[order.status] || '#6B7280'}20`,
                            color: STATUS_COLORS[order.status] || '#6B7280',
                          }}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      Sin pedidos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Alertas Recientes</h3>
          <div className="space-y-2">
            {recentAlerts?.map(
              (alert: {
                id: string;
                type: string;
                message: string;
                productName: string;
                variantName: string;
                sku: string;
              }) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      alert.type === 'LOW_STOCK' || alert.type === 'OUT_OF_STOCK'
                        ? 'text-red-500'
                        : 'text-amber-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.productName} — {alert.variantName}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground">SKU: {alert.sku}</p>
                  </div>
                </div>
              ),
            )}
            {(!recentAlerts || recentAlerts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay alertas activas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
