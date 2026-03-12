'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

interface PaginatedResponse {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [resources, setResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' };
      if (action) params.action = action;
      if (resource) params.resource = resource;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await apiClient.get<PaginatedResponse>('/audit-logs', { params });
      setLogs(data.data);
      setMeta(data.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, action, resource, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    apiClient.get<string[]>('/audit-logs/resources').then(({ data }) => setResources(data)).catch(() => {});
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Registro de Auditoría
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historial de acciones realizadas en el sistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
          </select>

          <select
            value={resource}
            onChange={(e) => { setResource(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos los recursos</option>
            {resources.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Desde"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acción</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recurso</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID Recurso</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-foreground text-xs">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{log.resource}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {log.resourceId ? log.resourceId.substring(0, 8) + '...' : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {meta.total} registros — Página {meta.page} de {meta.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedLog(null)}>
          <div
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Detalle de Auditoría</h3>
              <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Fecha</p>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Usuario</p>
                  <p className="font-medium">
                    {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'Sistema'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Acción</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-700'}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Recurso</p>
                  <p className="font-mono text-xs">{selectedLog.resource}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">ID Recurso</p>
                  <p className="font-mono text-xs">{selectedLog.resourceId || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">IP</p>
                  <p className="font-mono text-xs">{selectedLog.ipAddress || '—'}</p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">User Agent</p>
                  <p className="text-xs font-mono bg-muted/50 p-2 rounded break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Datos</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.oldData && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Datos anteriores</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
