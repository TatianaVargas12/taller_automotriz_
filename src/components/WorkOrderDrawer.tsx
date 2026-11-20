import React, { useState } from 'react';
import {
  ClipboardCheck,
  Clock,
  FileText,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  InventoryItem,
  ServiceBay,
  Technician,
  WorkOrder,
  WorkOrderStatus,
} from '../types/workshop';
import { StatusBadge } from './StatusBadge';
import {
  computeOrderTotals,
  formatCurrency,
  formatTimer,
} from '../utils/formatters';

interface WorkOrderDrawerProps {
  order: WorkOrder | null;
  bays: ServiceBay[];
  technicians: Technician[];
  inventory: InventoryItem[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: WorkOrderStatus) => void;
  onUpdateBay: (orderId: string, bayId: string | null) => void;
  onUpdateTechnician: (orderId: string, techId: string | null) => void;
  onToggleTimer: (orderId: string) => void;
  onUpdateNotes: (orderId: string, notes: string) => void;
  onAddLaborLine: (
    orderId: string,
    description: string,
    hours: number,
    hourlyRate: number
  ) => void;
  onRemoveLaborLine: (orderId: string, lineId: string) => void;
  onAddPartFromInventory: (orderId: string, item: InventoryItem, qty: number) => void;
  onRemovePartLine: (orderId: string, lineId: string) => void;
  onOpenDvi: (orderId: string) => void;
}

const ALL_STATUSES: WorkOrderStatus[] = [
  'Pendiente',
  'En Diagnóstico',
  'En Reparación',
  'En Espera (Repuestos)',
  'Finalizada/Entregada',
  'Alerta / Cancelada',
];

export const WorkOrderDrawer: React.FC<WorkOrderDrawerProps> = ({
  order,
  bays,
  technicians,
  inventory,
  onClose,
  onUpdateStatus,
  onUpdateBay,
  onUpdateTechnician,
  onToggleTimer,
  onUpdateNotes,
  onAddLaborLine,
  onRemoveLaborLine,
  onAddPartFromInventory,
  onRemovePartLine,
  onOpenDvi,
}) => {
  const [laborDesc, setLaborDesc] = useState('');
  const [laborHours, setLaborHours] = useState('1.0');
  const [laborRate, setLaborRate] = useState('75');
  const [selectedInvId, setSelectedInvId] = useState(inventory[0]?.id || '');
  const [partQty, setPartQty] = useState('1');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  if (!order) return null;

  const { laborSubtotal, partsSubtotal, subtotal, tax, total } =
    computeOrderTotals(order);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de orden ${order.code}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white h-full shadow-[0_10px_15px_-3px_rgba(15,23,42,0.1),0_4px_6px_-4px_rgba(15,23,42,0.05)] border-l border-[#E2E8F0] flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono tnum text-sm font-bold text-[#2563EB]">
                {order.code}
              </span>
              <span className="font-mono tnum text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                {order.plate}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-[#0F172A] truncate">
              {order.vehicle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInvoicePreview((v) => !v)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {showInvoicePreview ? 'Volver a Edición' : 'Vista Presupuesto'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDvi(order.id);
              }}
              className="h-9 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              DVI
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de orden"
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showInvoicePreview ? (
            /* Printable Quote / Invoice Summary */
            <div className="border border-[#E2E8F0] rounded-xl p-6 space-y-6 bg-white">
              <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    AutoTaller Pro · Presupuesto Oficial
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Centro de Servicio Norte · CIF B-84920194
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono tnum text-sm font-bold text-[#2563EB]">
                    {order.code}
                  </p>
                  <p className="text-xs text-[#64748B]">{order.intakeDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Cliente
                  </p>
                  <p className="font-semibold text-[#0F172A] mt-1">
                    {order.customerName}
                  </p>
                  <p className="text-[#64748B] font-mono tnum">
                    {order.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Vehículo
                  </p>
                  <p className="font-semibold text-[#0F172A] mt-1">
                    {order.vehicle} ({order.plate})
                  </p>
                  <p className="text-[#64748B] font-mono tnum">
                    VIN: {order.vin} · {order.mileageKm.toLocaleString('es-ES')} km
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0]">
                  <tr>
                    <th className="py-2 px-3 font-bold uppercase text-[#64748B]">
                      Concepto
                    </th>
                    <th className="py-2 px-3 font-bold uppercase text-[#64748B] text-right">
                      Cant / Hrs
                    </th>
                    <th className="py-2 px-3 font-bold uppercase text-[#64748B] text-right">
                      Precio Unit.
                    </th>
                    <th className="py-2 px-3 font-bold uppercase text-[#64748B] text-right">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(order.laborLines || []).map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                        [MO] {l.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum">
                        {l.hours.toFixed(1)} h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum">
                        {formatCurrency(l.hourlyRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum font-semibold">
                        {formatCurrency(l.hours * l.hourlyRate)}
                      </td>
                    </tr>
                  ))}
                  {(order.partLines || []).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                        <span className="font-mono text-[#64748B] mr-1.5">
                          {p.sku}
                        </span>
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum">
                        {p.qty} ud
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum">
                        {formatCurrency(p.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tnum font-semibold">
                        {formatCurrency(p.qty * p.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Base Imponible</span>
                    <span className="font-mono tnum font-semibold text-[#0F172A]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>IVA ({Math.round(order.taxRate * 100)}%)</span>
                    <span className="font-mono tnum font-semibold text-[#0F172A]">
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#0F172A] pt-2 border-t border-[#E2E8F0]">
                    <span>Total Presupuesto</span>
                    <span className="font-mono tnum text-[#2563EB]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Vehicle & Dispatch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                    Estado de Orden
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      onUpdateStatus(order.id, e.target.value as WorkOrderStatus)
                    }
                    className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A]"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                    Bahía Asignada
                  </label>
                  <select
                    value={order.bayId || ''}
                    onChange={(e) =>
                      onUpdateBay(order.id, e.target.value || null)
                    }
                    className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A]"
                  >
                    <option value="">En Patio (Sin Bahía)</option>
                    {bays.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        disabled={
                          b.workOrderId !== null && b.workOrderId !== order.id
                        }
                      >
                        {b.code} · {b.workOrderId && b.workOrderId !== order.id ? 'Ocupada' : 'Disponible'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                    Técnico Responsable
                  </label>
                  <select
                    value={order.technicianId || ''}
                    onChange={(e) =>
                      onUpdateTechnician(order.id, e.target.value || null)
                    }
                    className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A]"
                  >
                    <option value="">Sin asignar</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metadata & Timer Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] text-xs">
                <div className="space-y-1">
                  <p className="text-[#64748B]">
                    Cliente:{' '}
                    <span className="font-semibold text-[#0F172A]">
                      {order.customerName}
                    </span>{' '}
                    · <span className="font-mono tnum">{order.customerPhone}</span>
                  </p>
                  <p className="text-[#64748B] font-mono tnum">
                    VIN: {order.vin} · {order.mileageKm.toLocaleString('es-ES')} km · Combustible {order.fuelLevel}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono tnum text-sm font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-[#64748B]" />
                    {formatTimer(order.elapsedSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleTimer(order.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                      order.timerRunning
                        ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                        : 'bg-[#0F172A] text-white'
                    }`}
                  >
                    {order.timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Iniciar Reloj
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Reported Issue & Technician Diagnostic Notes */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-[#64748B]">
                    Síntoma Reportado en Recepción
                  </h3>
                  <p className="mt-1 text-sm text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                    {order.reportedIssue}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                    Bitácora Técnica y Diagnóstico
                  </label>
                  <textarea
                    rows={2}
                    value={order.diagnosticNotes}
                    onChange={(e) => onUpdateNotes(order.id, e.target.value)}
                    className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              {/* Labor Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    Mano de Obra ({order.laborLines.length})
                  </h3>
                  <span className="font-mono tnum text-xs font-bold text-[#0F172A]">
                    {formatCurrency(laborSubtotal)}
                  </span>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden divide-y divide-[#E2E8F0]">
                  {(order.laborLines || []).map((line) => (
                    <div
                      key={line.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs bg-white"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">
                          {line.description}
                        </p>
                        <p className="text-[#64748B] mt-0.5 font-mono tnum">
                          {line.hours.toFixed(1)} hrs × {formatCurrency(line.hourlyRate)}/h · {line.technicianName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono tnum font-bold text-[#0F172A]">
                          {formatCurrency(line.hours * line.hourlyRate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveLaborLine(order.id, line.id)}
                          aria-label="Eliminar mano de obra"
                          className="p-1 text-[#64748B] hover:text-[#DC2626]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!laborDesc.trim()) return;
                    onAddLaborLine(
                      order.id,
                      laborDesc.trim(),
                      Math.max(0.2, Number(laborHours) || 1),
                      Math.max(10, Number(laborRate) || 75)
                    );
                    setLaborDesc('');
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={laborDesc}
                    onChange={(e) => setLaborDesc(e.target.value)}
                    placeholder="Añadir operación de mano de obra..."
                    className="flex-1 h-9 px-3 border border-[#E2E8F0] rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    className="w-20 h-9 px-2 border border-[#E2E8F0] rounded-lg font-mono tnum text-xs"
                    title="Horas"
                  />
                  <input
                    type="number"
                    min="10"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    className="w-24 h-9 px-2 border border-[#E2E8F0] rounded-lg font-mono tnum text-xs"
                    title="Tarifa €/h"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir MO
                  </button>
                </form>
              </div>

              {/* Parts Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    Repuestos y Consumibles ({order.partLines.length})
                  </h3>
                  <span className="font-mono tnum text-xs font-bold text-[#0F172A]">
                    {formatCurrency(partsSubtotal)}
                  </span>
                </div>

                {(order.partLines || []).length > 0 && (
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden divide-y divide-[#E2E8F0]">
                    {(order.partLines || []).map((p) => (
                      <div
                        key={p.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs bg-white"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F172A]">
                            <span className="font-mono text-[#2563EB] mr-1.5">
                              {p.sku}
                            </span>
                            {p.name}
                          </p>
                          <p className="text-[#64748B] mt-0.5 font-mono tnum">
                            {p.qty} ud × {formatCurrency(p.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono tnum font-bold text-[#0F172A]">
                            {formatCurrency(p.qty * p.unitPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemovePartLine(order.id, p.id)}
                            aria-label="Eliminar repuesto"
                            className="p-1 text-[#64748B] hover:text-[#DC2626]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const item = inventory.find((i) => i.id === selectedInvId) || inventory[0];
                    if (!item) return;
                    onAddPartFromInventory(
                      order.id,
                      item,
                      Math.max(1, Number(partQty) || 1)
                    );
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <select
                    value={selectedInvId}
                    onChange={(e) => setSelectedInvId(e.target.value)}
                    className="flex-1 h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A]"
                  >
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.sku} — {i.name} ({formatCurrency(i.salePrice)} · Stock: {i.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(e.target.value)}
                    className="w-20 h-9 px-2 border border-[#E2E8F0] rounded-lg font-mono tnum text-xs"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cargar Pieza
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Totals */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-[#64748B] space-x-4">
            <span>
              Subtotal:{' '}
              <strong className="font-mono tnum text-[#0F172A]">
                {formatCurrency(subtotal)}
              </strong>
            </span>
            <span>
              IVA (21%):{' '}
              <strong className="font-mono tnum text-[#0F172A]">
                {formatCurrency(tax)}
              </strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-[#64748B] mr-2">
              Total Orden:
            </span>
            <span className="font-mono tnum text-xl font-bold text-[#2563EB]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};
