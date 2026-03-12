'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  ClipboardList,
  X,
  Loader2,
  Truck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import DataTable from '@/components/admin/DataTable';

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  notes?: string;
  isActive: boolean;
  rating?: number;
}

interface PurchaseOrderHistory {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

// ── Supplier Form Modal ─────────────────────────────────────────────
function SupplierModal({
  isOpen,
  supplier,
  onClose,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (data: Partial<Supplier>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: supplier?.name || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    rfc: supplier?.rfc || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  });

  if (!isOpen) return null;

  const update = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      rfc: form.rfc.trim() || undefined,
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Nombre del proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => update('contactName', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Persona de contacto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="7890-1234"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <textarea
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Dirección del proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">NIT / RFC</label>
            <input
              type="text"
              value={form.rfc}
              onChange={(e) => update('rfc', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="12345678-9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Notas internas"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">Activo</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {supplier ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── History Modal ───────────────────────────────────────────────────
function HistoryModal({
  supplier,
  onClose,
}: {
  supplier: Supplier;
  onClose: () => void;
}) {
  const { data: history = [], isLoading } = useQuery<PurchaseOrderHistory[]>({
    queryKey: ['supplier-history', supplier.id],
    queryFn: () => api.get(`/suppliers/${supplier.id}/history`).then((r) => r.data),
  });

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-50 text-blue-700',
    PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700',
    RECEIVED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    PARTIALLY_RECEIVED: 'Parcial',
    RECEIVED: 'Recibida',
    CANCELLED: 'Cancelada',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Historial — {supplier.name}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin órdenes de compra registradas</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium text-xs uppercase"># OC</th>
                  <th className="pb-2 font-medium text-xs uppercase">Fecha</th>
                  <th className="pb-2 font-medium text-xs uppercase">Estado</th>
                  <th className="pb-2 font-medium text-xs uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/20">
                    <td className="py-2 font-mono text-xs">{po.orderNumber}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(po.createdAt).toLocaleDateString('es-GT')}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          statusColors[po.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[po.status] || po.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">Q {Number(po.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AdminProveedoresPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['admin-suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => api.post('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      setModalOpen(false);
      setEditingSupplier(null);
      showToast('Proveedor creado exitosamente');
    },
    onError: () => showToast('Error al crear el proveedor', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      api.patch(`/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      setModalOpen(false);
      setEditingSupplier(null);
      showToast('Proveedor actualizado exitosamente');
    },
    onError: () => showToast('Error al actualizar el proveedor', 'error'),
  });

  const handleSave = (data: Partial<Supplier>) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter by search
  const filtered = search
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.contactName?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : suppliers;

  const columns = [
    {
      header: 'Proveedor',
      cell: (row: Supplier) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          {row.contactName && (
            <p className="text-xs text-muted-foreground">{row.contactName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Contacto',
      cell: (row: Supplier) => (
        <div className="space-y-0.5">
          {row.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'NIT',
      cell: (row: Supplier) => (
        <span className="text-xs font-mono text-muted-foreground">{row.rfc || '—'}</span>
      ),
    },
    {
      header: 'Estado',
      cell: (row: Supplier) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            row.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      cell: (row: Supplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingSupplier(row);
              setModalOpen(true);
            }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHistorySupplier(row)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title="Historial de compras"
          >
            <ClipboardList className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        totalCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, contacto, email..."
        isLoading={isLoading}
      />

      {/* Modals */}
      <SupplierModal
        isOpen={modalOpen}
        supplier={editingSupplier}
        onClose={() => {
          setModalOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {historySupplier && (
        <HistoryModal
          supplier={historySupplier}
          onClose={() => setHistorySupplier(null)}
        />
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
