import React, { useState } from 'react';
import { Minus, PackagePlus, Plus, Search, ShoppingCart } from 'lucide-react';
import { InventoryItem } from '../types/workshop';
import { formatCurrency } from '../utils/formatters';

interface InventoryViewProps {
  inventory: InventoryItem[];
  shopFloorMode: boolean;
  onAdjustStock: (itemId: string, delta: number) => void;
  onToggleReorder: (itemId: string) => void;
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
}

const CATEGORIES: ('Todas' | InventoryItem['category'])[] = [
  'Todas',
  'Frenos',
  'Filtros y Lubricantes',
  'Suspensión',
  'Eléctrico',
  'Motor',
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  shopFloorMode,
  onAdjustStock,
  onToggleReorder,
  onAddInventoryItem,
}) => {
  const [category, setCategory] = useState<'Todas' | InventoryItem['category']>('Todas');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [newCat, setNewCat] = useState<InventoryItem['category']>('Frenos');
  const [binLocation, setBinLocation] = useState('');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('4');
  const [unitCost, setUnitCost] = useState('45');
  const [salePrice, setSalePrice] = useState('85');

  const controlHeight = shopFloorMode ? 'h-12' : 'h-10';

  const filtered = inventory.filter((item) => {
    const matchesCat = category === 'Todas' || item.category === category;
    const matchesLow = !lowStockOnly || item.stock <= item.minStock;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.binLocation.toLowerCase().includes(q);
    return matchesCat && matchesLow && matchesQuery;
  });

  const outOfStockCount = inventory.filter((i) => i.stock === 0).length;
  const lowStockCount = inventory.filter(
    (i) => i.stock > 0 && i.stock <= i.minStock
  ).length;
  const inventoryValue = inventory.reduce(
    (sum, i) => sum + i.stock * i.unitCost,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Valorización de Almacén (Costo)
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tnum text-[#0F172A]">
            {formatCurrency(inventoryValue)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Referencias en Stock Mínimo
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tnum text-[#D97706]">
            {lowStockCount} SKUs
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Referencias Agotadas (Quiebre)
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tnum text-[#DC2626]">
            {outOfStockCount} SKUs
          </p>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por SKU, nombre, marca o estante..."
              className={`w-full ${controlHeight} pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15`}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setLowStockOnly((v) => !v)}
              className={`${controlHeight} px-3.5 rounded-lg border text-xs font-semibold transition-colors ${
                lowStockOnly
                  ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]'
                  : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              Solo Stock Bajo / Agotado
            </button>

            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className={`${controlHeight} px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors`}
            >
              <PackagePlus className="w-4 h-4" />
              Registrar Repuesto
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                category === cat
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Inline New Inventory Item Drawer */}
        {showNewForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sku.trim() || !name.trim()) return;
              onAddInventoryItem({
                sku: sku.trim().toUpperCase(),
                name: name.trim(),
                brand: brand.trim() || 'OEM Genérico',
                category: newCat,
                binLocation: binLocation.trim() || 'Estante Z-01',
                stock: Math.max(0, Number(stock) || 0),
                minStock: Math.max(1, Number(minStock) || 2),
                unitCost: Math.max(0, Number(unitCost) || 0),
                salePrice: Math.max(0, Number(salePrice) || 0),
              });
              setSku('');
              setName('');
              setBrand('');
              setBinLocation('');
              setShowNewForm(false);
            }}
            className="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU (ej: BRK-TRW-902)"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono text-xs uppercase"
            />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Descripción de la pieza"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marca / Fabricante OEM"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs"
            />
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as InventoryItem['category'])}
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs"
            >
              {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={binLocation}
              onChange={(e) => setBinLocation(e.target.value)}
              placeholder="Ubicación (Estante A-12)"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock inicial"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono tnum text-xs"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="PVP (€)"
              className="h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono tnum text-xs"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 h-10 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
              >
                Guardar Pieza
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                  SKU / Ubicación
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                  Pieza y Fabricante
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                  Categoría
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                  Estado Stock
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-center">
                  Existencias
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-right">
                  Costo / PVP
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-right">
                  Reposición
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((item, idx) => {
                const isOut = item.stock === 0;
                const isLow = item.stock > 0 && item.stock <= item.minStock;

                return (
                  <tr
                    key={item.id}
                    className={idx % 2 === 1 ? 'bg-[#F8FAFC]/60' : 'bg-white'}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono tnum text-xs font-bold text-[#0F172A]">
                        {item.sku}
                      </span>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {item.binLocation}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#64748B]">{item.brand}</p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-[#475569]">
                      {item.category}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] bg-[#FEE2E2] text-[#DC2626]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                          Agotado
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] bg-[#FEF3C7] text-[#F59E0B]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] bg-[#DCFCE7] text-[#16A34A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          Disponible
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, -1)}
                          aria-label={`Descontar stock de ${item.name}`}
                          className="w-7 h-7 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#0F172A]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono tnum text-sm font-bold text-[#0F172A] w-12 text-center">
                          {item.stock}
                          <span className="text-[11px] font-normal text-[#64748B]">
                            /{item.minStock}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, 1)}
                          aria-label={`Sumar stock de ${item.name}`}
                          className="w-7 h-7 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#0F172A]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <span className="font-mono tnum text-sm font-bold text-[#0F172A]">
                        {formatCurrency(item.salePrice)}
                      </span>
                      <p className="font-mono tnum text-[11px] text-[#64748B]">
                        Costo: {formatCurrency(item.unitCost)}
                      </p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => onToggleReorder(item.id)}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                          item.reorderRequested
                            ? 'bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]'
                            : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {item.reorderRequested ? 'PO Solicitada' : 'Pedir a Proveedor'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
