'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface StockAlert {
  id: string;
  variantId: string;
  type: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

const alertStyles: Record<string, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  LOW_STOCK: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  OUT_OF_STOCK: {
    icon: AlertOctagon,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  EXPIRING_SOON: {
    icon: Clock,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
};

const alertLabels: Record<string, string> = {
  LOW_STOCK: 'Stock bajo',
  OUT_OF_STOCK: 'Agotado',
  EXPIRING_SOON: 'Próximo a vencer',
};

export default function AdminAlertasPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: alerts = [], isLoading } = useQuery<StockAlert[]>({
    queryKey: ['inventory-alerts'],
    queryFn: () => api.get('/inventory/alerts').then((r) => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/inventory/alerts/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      showToast('Alerta resuelta');
    },
    onError: () => showToast('Error al resolver la alerta', 'error'),
  });

  // Group by type
  const groupedAlerts = alerts.reduce(
    (acc, alert) => {
      const key = alert.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(alert);
      return acc;
    },
    {} as Record<string, StockAlert[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas de Stock</h1>
          <p className="text-sm text-muted-foreground">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Cargando...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h2 className="text-lg font-semibold text-green-800">Sin alertas activas</h2>
          <p className="text-sm text-green-700 mt-1">Todos los niveles de stock están en orden</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([type, typeAlerts]) => {
            const s = alertStyles[type];
            const style = s ? s : { icon: AlertTriangle, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
            const Icon = style.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${style.text}`} />
                  <h2 className="font-semibold text-sm">
                    {alertLabels[type] || type} ({typeAlerts.length})
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {typeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start justify-between gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${style.text}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleString('es-GT', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-white border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
