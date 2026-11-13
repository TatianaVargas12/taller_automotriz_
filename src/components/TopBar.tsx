import React from 'react';
import { Menu, Plus, Search, Smartphone } from 'lucide-react';
import { ScreenRoute } from '../types/workshop';

interface TopBarProps {
  activeScreen: ScreenRoute;
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  shopFloorMode: boolean;
  onToggleShopFloorMode: () => void;
  onOpenNewOrder: () => void;
  onOpenMobileMenu: () => void;
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
};

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  globalSearch,
  onGlobalSearchChange,
  shopFloorMode,
  onToggleShopFloorMode,
  onOpenNewOrder,
  onOpenMobileMenu,
}) => {
  const meta = SCREEN_TITLES[activeScreen];
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

      <div className="flex items-center gap-3 shrink-0">
        {/* Global Plate / VIN / Order Search */}
        <div className="relative hidden md:block w-64 xl:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Buscar placa, VIN, cliente u OT..."
            className={`w-full ${controlHeight} pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15 transition-shadow`}
          />
        </div>

        {/* Shop Floor 48px Touch Ergonomics Switch */}
        <button
          type="button"
          onClick={onToggleShopFloorMode}
          aria-pressed={shopFloorMode}
          title="Aumenta la altura de controles a 48px para tablets en bahía"
          className={`${controlHeight} px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
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
          className={`${controlHeight} px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors whitespace-nowrap shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden</span>
        </button>
      </div>
    </header>
  );
};
