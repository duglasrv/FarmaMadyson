'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Save, Users, Trash2 } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

const RESOURCE_LABELS: Record<string, string> = {
  product: 'Productos',
  category: 'Categorías',
  brand: 'Marcas',
  order: 'Pedidos',
  inventory: 'Inventario',
  supplier: 'Proveedores',
  purchase_order: 'Órdenes de Compra',
  user: 'Usuarios',
  settings: 'Configuración',
  report: 'Reportes',
  promotion: 'Promociones',
  prescription: 'Recetas',
};

const ACTION_LABELS: Record<string, string> = {
  manage: 'Gestión Total',
  create: 'Crear',
  read: 'Leer',
  update: 'Editar',
  delete: 'Eliminar',
  update_status: 'Cambiar Estado',
  verify_payment: 'Verificar Pago',
  view_movements: 'Ver Movimientos',
  manage_roles: 'Gestionar Roles',
  update_general: 'Configuración General',
  manage_pages: 'Gestionar Páginas',
  view_sales: 'Ver Ventas',
  view_all: 'Ver Todos',
};

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: role, isLoading: loadingRole } = useQuery({
    queryKey: ['admin-role', id],
    queryFn: () => api.get(`/roles/${id}`).then((r) => r.data),
  });

  const { data: permGroups, isLoading: loadingPerms } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => api.get('/roles/permissions').then((r) => r.data),
  });

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  if (role && !initialized) {
    setDisplayName(role.displayName || '');
    setDescription(role.description || '');
    setSelectedPerms(new Set(role.permissions.map((p: { id: string }) => p.id)));
    setInitialized(true);
  }

  const updateRole = useMutation({
    mutationFn: () =>
      api.patch(`/roles/${id}`, {
        displayName,
        description: description || undefined,
        permissionIds: Array.from(selectedPerms),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: () => api.delete(`/roles/${id}`),
    onSuccess: () => router.push('/admin/configuracion/roles'),
  });

  const togglePerm = (permId: string) =>
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });

  const toggleResource = (perms: { id: string }[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((pid) => selectedPerms.has(pid));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const pid of ids) {
        if (allSelected) next.delete(pid);
        else next.add(pid);
      }
      return next;
    });
  };

  if (loadingRole || loadingPerms || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSystemLocked = role.isSystem && role.name !== 'admin';
  const resources = Object.entries(
    permGroups as Record<string, { id: string; action: string; description: string | null }[]>,
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/configuracion/roles" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{role.displayName}</h1>
            <p className="text-sm text-muted-foreground font-mono">{role.name}</p>
          </div>
        </div>
        {!role.isSystem && (
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de eliminar este rol?')) deleteRole.mutate();
            }}
            className="flex items-center gap-2 text-destructive hover:bg-red-50 px-3 py-2 rounded-lg text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        )}
      </div>

      {isSystemLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Este es un rol del sistema y no puede ser editado.
        </div>
      )}

      {!isSystemLocked && (
        <>
          {/* Info */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold">Información</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre para mostrar
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Descripción
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">
              Permisos ({selectedPerms.size} seleccionados)
            </h2>
            <div className="space-y-3">
              {resources.map(([resource, perms]) => {
                const allSelected = perms.every((p) => selectedPerms.has(p.id));
                const someSelected = perms.some((p) => selectedPerms.has(p.id));
                return (
                  <div key={resource} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleResource(perms)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">
                        {RESOURCE_LABELS[resource] || resource}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {resource}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 ml-7">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPerms.has(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">
                            {ACTION_LABELS[perm.action] || perm.action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={() => updateRole.mutate()}
              disabled={updateRole.isPending}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateRole.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          {updateRole.isSuccess && (
            <p className="text-sm text-green-600">Cambios guardados correctamente.</p>
          )}
        </>
      )}

      {/* Users with this role */}
      {role.users?.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Usuarios con este rol ({role.users.length})
          </h2>
          <div className="divide-y divide-border">
            {role.users.map(
              (user: { id: string; firstName: string; lastName: string; email: string }) => (
                <div key={user.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
