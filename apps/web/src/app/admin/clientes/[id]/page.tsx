'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldOff,
  Package,
  UserCog,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface Role {
  id: string;
  name: string;
  displayName: string;
}

interface Address {
  id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  zipCode: string | null;
  country: string;
  isDefault: boolean;
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  googleId: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  roles: Role[];
  orderCount: number;
  addresses: Address[];
}

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  _count: { items: number };
}

interface OrdersResponse {
  data: OrderItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-indigo-50 text-indigo-700',
  READY: 'bg-cyan-50 text-cyan-700',
  SHIPPED: 'bg-violet-50 text-violet-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function AdminClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const [ordersPage, setOrdersPage] = useState(1);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // User detail
  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['admin-user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
  });

  // User orders
  const { data: ordersData } = useQuery<OrdersResponse>({
    queryKey: ['admin-user-orders', userId, ordersPage],
    queryFn: () => api.get(`/users/${userId}/orders?page=${ordersPage}&limit=10`).then((r) => r.data),
    enabled: !!user,
  });

  // All roles for assignment
  const { data: allRoles = [] } = useQuery<any[]>({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
    enabled: showRoleModal,
  });

  // Toggle active
  const toggleActive = useMutation({
    mutationFn: () => api.patch(`/users/${userId}`, { isActive: !user?.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      showToast(user?.isActive ? 'Usuario desactivado' : 'Usuario activado');
    },
    onError: () => showToast('Error al cambiar estado', 'error'),
  });

  // Assign role
  const assignRole = useMutation({
    mutationFn: (roleId: string) => api.post(`/users/${userId}/roles`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowRoleModal(false);
      showToast('Rol asignado exitosamente');
    },
    onError: () => showToast('Error al asignar rol', 'error'),
  });

  // Remove role
  const removeRole = useMutation({
    mutationFn: (roleId: string) => api.delete(`/users/${userId}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      showToast('Rol removido');
    },
    onError: () => showToast('Error al remover rol', 'error'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Usuario no encontrado</p>
        <button onClick={() => router.push('/admin/clientes')} className="text-primary underline text-sm mt-2">
          Volver a la lista
        </button>
      </div>
    );
  }

  const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;
  const orders = ordersData?.data ?? [];
  const ordersMeta = ordersData?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Roles not yet assigned
  const availableRoles = allRoles.filter(
    (r: any) => !user.roles.some((ur) => ur.id === r.id),
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push('/admin/clientes')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {String(user.firstName?.[0] || user.email.charAt(0) || '?').toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              user.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Información</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{user.phone || 'Sin teléfono'}</span>
            </div>
            <div className="flex items-center gap-2">
              {user.isActive ? (
                <ShieldCheck className="w-4 h-4 text-green-600" />
              ) : (
                <ShieldOff className="w-4 h-4 text-red-500" />
              )}
              <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user.isVerified ? 'Email verificado' : 'Email no verificado'}</span>
            </div>
            {user.googleId && (
              <div className="text-xs text-muted-foreground">Vinculado con Google</div>
            )}
            <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
              <p>Registrado: {new Date(user.createdAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p>Último acceso: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Nunca'}</p>
            </div>
          </div>
        </div>

        {/* Roles Card */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Roles</h2>
            <button
              onClick={() => setShowRoleModal(true)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
              title="Asignar rol"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {user.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin roles asignados</p>
          ) : (
            <div className="space-y-2">
              {user.roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{role.displayName}</span>
                  </div>
                  <button
                    onClick={() => removeRole.mutate(role.id)}
                    className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
                    title="Remover rol"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Addresses Card */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Direcciones</h2>
          {user.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin direcciones registradas</p>
          ) : (
            <div className="space-y-3">
              {user.addresses.map((addr) => (
                <div key={addr.id} className="bg-muted/50 rounded-lg px-3 py-2 text-sm space-y-0.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{addr.label || 'Dirección'}</span>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">Principal</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs ml-6">
                    {addr.street}, {addr.city}, {addr.state}
                    {addr.zipCode && ` ${addr.zipCode}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Pedidos ({ordersMeta.total})</h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin pedidos registrados</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium text-xs uppercase"># Pedido</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase">Fecha</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase">Productos</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase">Estado</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const sc = statusColors[order.status];
                  const sColor = sc ? sc : 'bg-gray-100 text-gray-700';
                  const sl = statusLabels[order.status];
                  const sLabel = sl ? sl : order.status;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-6 py-3 font-mono text-xs">{order.orderNumber}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('es-GT')}
                      </td>
                      <td className="px-6 py-3 text-center">{order._count.items}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sColor}`}>
                          {sLabel}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">Q {Number(order.total).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {ordersMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Página {ordersMeta.page} de {ordersMeta.totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOrdersPage(ordersPage - 1)}
                    disabled={ordersPage === 1}
                    className="px-3 py-1 text-sm rounded hover:bg-muted disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setOrdersPage(ordersPage + 1)}
                    disabled={ordersPage >= ordersMeta.totalPages}
                    className="px-3 py-1 text-sm rounded hover:bg-muted disabled:opacity-30"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRoleModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">Asignar rol</h2>
              <button onClick={() => setShowRoleModal(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {availableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  El usuario ya tiene todos los roles disponibles
                </p>
              ) : (
                availableRoles.map((role: any) => (
                  <button
                    key={role.id}
                    onClick={() => assignRole.mutate(role.id)}
                    disabled={assignRole.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{role.displayName}</p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                    {assignRole.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
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
