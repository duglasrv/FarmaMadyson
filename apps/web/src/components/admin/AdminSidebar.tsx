'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ShoppingBag,
  Users,
  FileHeart,
  Truck,
  ClipboardList,
  Percent,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  Star,
  ShoppingCart,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
  children?: { label: string; href: string; permission: string }[];
}

const menuConfig: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'report:view_sales' },
  { label: 'Punto de Venta', href: '/admin/pos', icon: ShoppingCart, permission: 'pos:sell' },
  { label: 'Ventas Locales', href: '/admin/ventas-pos', icon: Receipt, permission: 'pos:view_sales' },
  { label: 'Productos', href: '/admin/productos', icon: Package, permission: 'product:read' },
  { label: 'Categorías', href: '/admin/categorias', icon: FolderTree, permission: 'category:read' },
  {
    label: 'Inventario', href: '/admin/inventario', icon: Warehouse, permission: 'inventory:read',
    children: [
      { label: 'Stock Actual', href: '/admin/inventario', permission: 'inventory:read' },
      { label: 'Movimientos', href: '/admin/inventario/movimientos', permission: 'inventory:view_movements' },
      { label: 'Alertas', href: '/admin/inventario/alertas', permission: 'inventory:read' },
      { label: 'Por Vencer', href: '/admin/inventario/por-vencer', permission: 'inventory:read' },
    ],
  },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag, permission: 'order:read' },
  { label: 'Clientes', href: '/admin/clientes', icon: Users, permission: 'user:read' },
  { label: 'Recetas', href: '/admin/recetas', icon: FileHeart, permission: 'prescription:view_all' },
  { label: 'Proveedores', href: '/admin/proveedores', icon: Truck, permission: 'supplier:read' },
  { label: 'Órdenes de Compra', href: '/admin/compras', icon: ClipboardList, permission: 'purchase_order:read' },
  { label: 'Promociones', href: '/admin/promociones', icon: Percent, permission: 'promotion:read' },
  { label: 'Reseñas', href: '/admin/resenas', icon: Star, permission: 'review:read' },
  { label: 'Reportes', href: '/admin/reportes', icon: BarChart3, permission: 'report:view_sales' },
  {
    label: 'Configuración', href: '/admin/configuracion', icon: Settings, permission: 'settings:read',
    children: [
      { label: 'General', href: '/admin/configuracion', permission: 'settings:update_general' },
      { label: 'Banners', href: '/admin/banners', permission: 'banner:read' },
      { label: 'Roles y Permisos', href: '/admin/configuracion/roles', permission: 'settings:manage_roles' },
      { label: 'Páginas', href: '/admin/configuracion/paginas', permission: 'settings:manage_pages' },
      { label: 'Audit Log', href: '/admin/configuracion/audit-log', permission: 'settings:manage_settings' },
    ],
  },
];

function canAccess(permission: string, abilities: Array<{ action: string; subject: string }>): boolean {
  const [subject, action] = permission.split(':');
  return abilities.some(
    (a) =>
      (a.subject === subject && a.action === action) ||
      (a.subject === subject && a.action === 'manage') ||
      (a.subject === 'all' && a.action === 'manage'),
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const abilities = user?.abilities || [];
  const [expanded, setExpanded] = useState<string[]>([]);

  const filteredMenu = menuConfig.filter((item) => canAccess(item.permission, abilities));

  const toggleExpand = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">FM</span>
        </div>
        <div>
          <p className="font-bold text-sm text-foreground leading-tight">FarmaMadyson</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Panel Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isExpanded = expanded.includes(item.label);

          const visibleChildren = item.children?.filter((c) => canAccess(c.permission, abilities));

          if (visibleChildren && visibleChildren.length > 0) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-2 py-1.5 rounded text-xs transition-colors ${
                          pathname === child.href
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
