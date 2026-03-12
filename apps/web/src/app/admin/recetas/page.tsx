'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, FileHeart } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
};

interface Prescription {
  id: string;
  imageUrl: string;
  status: string;
  notes: string | null;
  patientName: string | null;
  patientPhone: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
  order: { id: string; orderNumber: string; status: string } | null;
}

export default function AdminPrescriptionsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [modalAction, setModalAction] = useState<'view' | 'approve' | 'reject' | null>(null);
  const queryClient = useQueryClient();

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ['admin-prescriptions', statusFilter],
    queryFn: () =>
      api
        .get('/prescriptions', { params: { status: statusFilter || undefined } })
        .then((r) => r.data),
  });

  const selected = prescriptions.find((p) => p.id === selectedId);

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/prescriptions/${id}/approve`, { notes: approveNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prescriptions'] });
      closeModal();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/prescriptions/${id}/reject`, { rejectionReason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prescriptions'] });
      closeModal();
    },
  });

  const openModal = (id: string, action: 'view' | 'approve' | 'reject') => {
    setSelectedId(id);
    setModalAction(action);
    setRejectReason('');
    setApproveNotes('');
  };

  const closeModal = () => {
    setSelectedId(null);
    setModalAction(null);
    setRejectReason('');
    setApproveNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileHeart className="w-6 h-6 text-primary" />
          Recetas Médicas
        </h1>
        <p className="text-sm text-muted-foreground">Revisa y aprueba recetas de los clientes</p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === '' ? 'Todas' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          No se encontraron recetas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-xl border border-border p-4 space-y-3">
              {/* Image Preview */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={rx.imageUrl}
                  alt="Receta"
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    STATUS_COLORS[rx.status]
                  }`}
                >
                  {STATUS_LABELS[rx.status]}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {rx.user.firstName} {rx.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{rx.user.email}</p>
                {rx.patientName && (
                  <p className="text-xs text-foreground">
                    <span className="text-muted-foreground">Paciente:</span> {rx.patientName}
                  </p>
                )}
                {rx.patientPhone && (
                  <p className="text-xs text-foreground">
                    <span className="text-muted-foreground">Tel:</span> {rx.patientPhone}
                  </p>
                )}
                {rx.order && (
                  <p className="text-xs text-primary">Orden: {rx.order.orderNumber}</p>
                )}
                {rx.notes && (
                  <p className="text-xs text-muted-foreground italic">&quot;{rx.notes}&quot;</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(rx.createdAt).toLocaleString('es-GT')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(rx.id, 'view')}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
                {rx.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => openModal(rx.id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => openModal(rx.id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAction && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {modalAction === 'view'
                    ? 'Receta Médica'
                    : modalAction === 'approve'
                      ? 'Aprobar Receta'
                      : 'Rechazar Receta'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={selected.imageUrl}
                  alt="Receta médica"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>

              {/* Patient Info */}
              <div className="text-sm space-y-1">
                <p>
                  <strong>Cliente:</strong> {selected.user.firstName} {selected.user.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selected.user.email}
                </p>
                {selected.patientName && (
                  <p>
                    <strong>Paciente:</strong> {selected.patientName}
                  </p>
                )}
                {selected.patientPhone && (
                  <p>
                    <strong>Teléfono:</strong> {selected.patientPhone}
                  </p>
                )}
                {selected.order && (
                  <p>
                    <strong>Orden:</strong> {selected.order.orderNumber}
                  </p>
                )}
                {selected.notes && (
                  <p>
                    <strong>Notas del cliente:</strong> {selected.notes}
                  </p>
                )}
              </div>

              {/* Action forms */}
              {modalAction === 'approve' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      placeholder="Notas sobre la receta..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(selected.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {approveMutation.isPending ? 'Aprobando...' : 'Confirmar Aprobación'}
                    </button>
                  </div>
                </div>
              )}

              {modalAction === 'reject' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Razón del rechazo *
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      required
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      placeholder="Explica la razón del rechazo..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!rejectReason.trim()) return;
                        rejectMutation.mutate(selected.id);
                      }}
                      disabled={rejectMutation.isPending || !rejectReason.trim()}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                    </button>
                  </div>
                </div>
              )}

              {modalAction === 'view' && selected.status !== 'PENDING' && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <strong>Estado:</strong>{' '}
                    <span className={STATUS_COLORS[selected.status]?.replace('bg-', 'text-').split(' ')[1] || ''}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </p>
                  {selected.reviewedAt && (
                    <p>
                      <strong>Revisada:</strong>{' '}
                      {new Date(selected.reviewedAt).toLocaleString('es-GT')}
                    </p>
                  )}
                  {selected.notes && (
                    <p>
                      <strong>Notas:</strong> {selected.notes}
                    </p>
                  )}
                  {selected.rejectionReason && (
                    <p>
                      <strong>Razón de rechazo:</strong> {selected.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {modalAction === 'view' && (
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
