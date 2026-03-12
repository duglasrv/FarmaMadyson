'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {user?.roles?.[0] || 'Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
