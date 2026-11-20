import React from 'react';
import { LogOut, Menu, Plus, Search, Smartphone } from 'lucide-react';
import { ScreenRoute } from '../types/workshop';
import { AuthUser } from '../types/auth';

interface TopBarProps {
  activeScreen: ScreenRoute;
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  shopFloorMode: boolean;
  onToggleShopFloorMode: () => void;
  onOpenNewOrder: () => void;
  onOpenMobileMenu: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onNavigate?: (screen: ScreenRoute) => void;
}

const SCREEN_TITLES: Record<ScreenRoute, { section: string; title: string }> = {
  operations: {
    section: 'AutoTaller Pro',
    title: 'Panel Operativo y Bahías',
  },
  orders: {
    section: 'AutoTaller Pro',
    title: 'Libro Maestro de Órdenes',
  },
  dvi: {
    section: 'AutoTaller Pro',
    title: 'Inspección Digital de Vehículo (DVI)',
  },
  inventory: {
    section: 'AutoTaller Pro',
    title: 'Inventario de Repuestos y Almacén',
  },
  customers: {
    section: 'AutoTaller Pro',
    title: 'Directorio de Clientes y Flotas',
  },
  profile: {
    section: 'AutoTaller Pro',
    title: 'Perfil de Operador y Estación de Trabajo',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  globalSearch,
  onGlobalSearchChange,
  shopFloorMode,
  onToggleShopFloorMode,
  onOpenNewOrder,
  onOpenMobileMenu,
  currentUser,
  onLogout,
  onNavigate,
}) => {
  const meta = SCREEN_TITLES[activeScreen] || {
    section: 'AutoTaller Pro',
    title: 'Panel Principal',
  };
  const controlHeight = shopFloorMode ? 'h-12' : 'h-10';

  return (
    <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
          className="lg:hidden p-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] whitespace-nowrap">
            <span>{meta.section}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#0F172A] truncate">
              {meta.title}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Plate / VIN / Order Search */}
        <div className="relative hidden md:block w-56 xl:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Buscar placa, VIN, cliente..."
            className={`w-full ${controlHeight} pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15 transition-shadow`}
          />
        </div>

        {/* Shop Floor 48px Touch Ergonomics Switch */}
        <button
          type="button"
          onClick={onToggleShopFloorMode}
          aria-pressed={shopFloorMode}
          title="Aumenta la altura de controles a 48px para tablets en bahía"
          className={`${controlHeight} px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            shopFloorMode
              ? 'bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8]'
              : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">
            {shopFloorMode ? 'Modo Taller (48px)' : 'Modo Taller'}
          </span>
        </button>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onOpenNewOrder}
          className={`${controlHeight} px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Orden</span>
        </button>

        {/* User Session Strip */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => onNavigate?.('profile')}
              title="Ver Mi Perfil"
              className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors cursor-pointer text-left ${
                activeScreen === 'profile'
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: currentUser.avatarColor || '#2563EB' }}
              >
                {currentUser.initials}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <span className="block text-xs font-bold text-[#0F172A] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] text-[#64748B] truncate max-w-[120px]">
                  {currentUser.roleLabel}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión"
              aria-label="Cerrar sesión"
              className={`${controlHeight} px-2.5 rounded-lg border border-[#E2E8F0] hover:border-red-300 hover:bg-red-50 text-[#64748B] hover:text-red-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
