import React from 'react';
import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { ScreenRoute } from '../types/workshop';
import { AuthUser } from '../types/auth';

interface SidebarProps {
  activeScreen: ScreenRoute;
  onNavigate: (screen: ScreenRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    activeOrders: number;
    pendingDvi: number;
    lowStock: number;
  };
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  collapsed,
  onToggleCollapse,
  counts,
  currentUser,
  onLogout,
}) => {
  const navItems: {
    id: ScreenRoute;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'operations', label: 'Panel Operativo', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Órdenes de Trabajo',
      icon: Wrench,
      badge: counts.activeOrders,
    },
    {
      id: 'dvi',
      label: 'Inspección Digital DVI',
      icon: ClipboardCheck,
      badge: counts.pendingDvi,
    },
    {
      id: 'inventory',
      label: 'Inventario y Repuestos',
      icon: Package,
      badge: counts.lowStock > 0 ? counts.lowStock : undefined,
    },
    { id: 'customers', label: 'Clientes y Flotas', icon: Users },
  ];

  return (
    <aside
      className={`bg-[#0F172A] text-white flex flex-col shrink-0 transition-[width] duration-200 border-r border-slate-800 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/90">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="block text-[15px] font-bold tracking-tight text-white truncate">
                AutoTaller Pro
              </span>
              <span className="block text-[11px] font-medium text-slate-400 truncate">
                Centro de Servicio Norte
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center mx-auto">
            <Wrench className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Contraer barra lateral"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="py-2 flex justify-center border-b border-slate-800/90">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir barra lateral"
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Navegación principal">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
            Operaciones
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </span>
              {!collapsed && item.badge !== undefined && (
                <span
                  className={`font-mono tnum text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {/* Mi Cuenta / Perfil de Operario */}
        <div className="pt-2 mt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            title={collapsed ? 'Ver Mi Perfil' : undefined}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeScreen === 'profile'
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <User className="w-4 h-4 shrink-0 text-blue-400" />
              {!collapsed && <span className="truncate">Ver Mi Perfil</span>}
            </span>
            {!collapsed && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {currentUser?.initials || 'ID'}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* User Session Profile Footer */}
      <div className="p-3 border-t border-slate-800/90">
        {currentUser && (
          <div
            className={`flex items-center gap-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              title="Ver Mi Perfil"
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer group"
            >
              <div
                className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                style={{ backgroundColor: currentUser.avatarColor || '#1D4ED8' }}
              >
                {currentUser.initials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser.roleLabel}
                  </p>
                </div>
              )}
            </button>

            {!collapsed && (
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
