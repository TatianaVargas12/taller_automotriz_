import React, { useState } from 'react';
import { ClipboardCheck, Eye, Filter, Search, X } from 'lucide-react';
import {
  ServiceBay,
  Technician,
  WorkOrder,
  WorkOrderStatus,
} from '../types/workshop';
import { StatusBadge } from '../components/StatusBadge';
import { computeOrderTotals, formatCurrency } from '../utils/formatters';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  bays: ServiceBay[];
  technicians: Technician[];
  globalSearch: string;
  shopFloorMode: boolean;
  onSelectOrder: (orderId: string) => void;
  onOpenDvi: (orderId: string) => void;
  onClearGlobalSearch: () => void;
}

const STATUS_FILTERS: ('Todas' | WorkOrderStatus)[] = [
  'Todas',
  'Pendiente',
  'En Diagnóstico',
  'En Reparación',
  'En Espera (Repuestos)',
  'Finalizada/Entregada',
  'Alerta / Cancelada',
];

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  bays,
  technicians,
  globalSearch,
  shopFloorMode,
  onSelectOrder,
  onOpenDvi,
  onClearGlobalSearch,
}) => {
  const [statusFilter, setStatusFilter] = useState<'Todas' | WorkOrderStatus>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [localSearch, setLocalSearch] = useState<string>('');

  const effectiveSearch = (localSearch || globalSearch).trim().toLowerCase();

  const filtered = workOrders.filter((order) => {
    const matchesStatus =
      statusFilter === 'Todas' || order.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'Todas' || order.priority === priorityFilter;
    const matchesQuery =
      !effectiveSearch ||
      order.code.toLowerCase().includes(effectiveSearch) ||
      order.plate.toLowerCase().includes(effectiveSearch) ||
      order.vin.toLowerCase().includes(effectiveSearch) ||
      order.vehicle.toLowerCase().includes(effectiveSearch) ||
      order.customerName.toLowerCase().includes(effectiveSearch);

    return matchesStatus && matchesPriority && matchesQuery;
  });

  const controlHeight = shopFloorMode ? 'h-12' : 'h-10';

  return (
    <div className="space-y-5">
      {/* Persistent Work-Order Filter Ribbon */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filtrar por placa, VIN, código OT o cliente..."
              className={`w-full ${controlHeight} pl-9 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15`}
            />
            {(localSearch || globalSearch) && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onClearGlobalSearch();
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <span className="text-xs font-semibold text-[#64748B]">Prioridad:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`${controlHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB]`}
              >
                <option value="Todas">Todas</option>
                <option value="Urgente">Urgente</option>
                <option value="Flota SLA">Flota SLA</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((st) => {
            const count =
              st === 'Todas'
                ? workOrders.length
                : workOrders.filter((o) => o.status === st).length;
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`font-mono tnum text-[11px] px-1.5 py-0.2 rounded ${
                    active ? 'bg-slate-700 text-white' : 'bg-white text-[#0F172A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Work Orders Ledger Data Grid */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base font-semibold text-[#0F172A]">
              No se encontraron órdenes con los criterios actuales
            </p>
            <p className="text-sm text-[#64748B]">
              Ajusta la búsqueda por placa/VIN o restablece los filtros de estado.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Todas');
                setPriorityFilter('Todas');
                setLocalSearch('');
                onClearGlobalSearch();
              }}
              className="h-10 px-4 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0] z-10">
                <tr>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Orden / Placa
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Vehículo y VIN
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Cliente
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Estado
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Bahía / Técnico
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Entrega Est.
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-right">
                    Total Est.
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((order, idx) => {
                  const tech = technicians.find((t) => t.id === order.technicianId);
                  const bay = bays.find((b) => b.id === order.bayId);
                  const { total } = computeOrderTotals(order);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      className={`cursor-pointer transition-colors hover:bg-[#EFF6FF]/60 ${
                        idx % 2 === 1 ? 'bg-[#F8FAFC]/60' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono tnum text-xs font-bold text-[#2563EB]">
                          {order.code}
                        </div>
                        <div className="mt-1 inline-block font-mono tnum text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                          {order.plate}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-[#0F172A]">
                          {order.vehicle}
                        </div>
                        <div className="text-xs font-mono tnum text-[#64748B] mt-0.5">
                          VIN: {order.vin} · {order.mileageKm.toLocaleString('es-ES')} km
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-[#0F172A]">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {order.customerType} · {order.priority}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-[#0F172A]">
                          {bay ? bay.code : 'En Patio'}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {tech ? tech.name : 'Sin asignar'}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono tnum text-[#0F172A]">
                        {order.estimatedCompletion}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono tnum text-sm font-bold text-[#0F172A]">
                        {formatCurrency(total)}
                      </td>

                      <td
                        className="py-3 px-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDvi(order.id)}
                            title="Abrir Inspección DVI"
                            className="p-2 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A]"
                          >
                            <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.id)}
                            title="Ver Detalle de Orden"
                            className="p-2 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
