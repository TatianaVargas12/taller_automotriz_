import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Pause,
  Play,
  Wrench,
} from 'lucide-react';
import {
  ServiceBay,
  Technician,
  WorkOrder,
  WorkOrderStatus,
} from '../types/workshop';
import { StatusBadge } from '../components/StatusBadge';
import { computeOrderTotals, formatCurrency, formatTimer } from '../utils/formatters';

interface OperationsViewProps {
  workOrders: WorkOrder[];
  bays: ServiceBay[];
  technicians: Technician[];
  shopFloorMode: boolean;
  onSelectOrder: (orderId: string) => void;
  onOpenDvi: (orderId: string) => void;
  onToggleTimer: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: WorkOrderStatus) => void;
  onAssignOrderToBay: (orderId: string, bayId: string, techId: string) => void;
}

const KANBAN_STAGES: WorkOrderStatus[] = [
  'Pendiente',
  'En Diagnóstico',
  'En Reparación',
  'En Espera (Repuestos)',
  'Finalizada/Entregada',
];

export const OperationsView: React.FC<OperationsViewProps> = ({
  workOrders,
  bays,
  technicians,
  shopFloorMode,
  onSelectOrder,
  onOpenDvi,
  onToggleTimer,
  onUpdateStatus,
  onAssignOrderToBay,
}) => {
  const [boardMode, setBoardMode] = useState<'bays' | 'kanban'>('bays');
  const [assigningBayId, setAssigningBayId] = useState<string | null>(null);
  const [selectedOrderForBay, setSelectedOrderForBay] = useState<string>('');
  const [selectedTechForBay, setSelectedTechForBay] = useState<string>(technicians[0]?.id || '');

  const activeOrders = workOrders.filter(
    (o) => o.status !== 'Finalizada/Entregada' && o.status !== 'Alerta / Cancelada'
  );
  const occupiedBays = bays.filter((b) => b.workOrderId !== null).length;
  const alertsOrWaiting = workOrders.filter(
    (o) => o.status === 'En Espera (Repuestos)' || o.status === 'Alerta / Cancelada'
  ).length;
  const totalEstimatedRevenue = workOrders
    .filter((o) => o.status !== 'Alerta / Cancelada')
    .reduce((acc, o) => acc + computeOrderTotals(o).total, 0);

  const unassignedOrders = workOrders.filter(
    (o) =>
      !o.bayId &&
      o.status !== 'Finalizada/Entregada' &&
      o.status !== 'Alerta / Cancelada'
  );

  const btnHeight = shopFloorMode ? 'h-12' : 'h-10';

  const getNextStage = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const idx = KANBAN_STAGES.indexOf(current);
    if (idx >= 0 && idx < KANBAN_STAGES.length - 1) {
      return KANBAN_STAGES[idx + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip: 4 Structured Metric Cells */}
      <section
        aria-label="Resumen operativo del taller"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Órdenes Activas en Taller
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tnum text-[#0F172A]">
              {activeOrders.length}
            </span>
            <span className="text-xs font-medium text-[#2563EB]">
              {workOrders.filter((o) => o.priority === 'Flota SLA').length} con SLA Flota
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Ocupación de Bahías
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tnum text-[#0F172A]">
              {occupiedBays}/{bays.length}
            </span>
            <span className="text-xs font-medium text-[#16A34A] font-mono tnum">
              {Math.round((occupiedBays / bays.length) * 100)}% capacidad
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Bloqueos / Espera Repuestos
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tnum text-[#0F172A]">
              {alertsOrWaiting}
            </span>
            <span className="text-xs font-medium text-[#D97706]">
              Requieren seguimiento
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.02em]">
            Facturación en Curso (IVA inc.)
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tnum text-[#0F172A]">
              {formatCurrency(totalEstimatedRevenue)}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              Turno actual
            </span>
          </div>
        </div>
      </section>

      {/* Toolbar: View Switcher & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">
            {boardMode === 'bays'
              ? 'Planta de Servicio · Bahías en Vivo'
              : 'Flujo de Trabajo · Tablero por Etapa'}
          </h2>
          <p className="text-sm text-[#64748B]">
            {boardMode === 'bays'
              ? 'Control en tiempo real de elevadores, técnicos asignados y cronómetros de mano de obra.'
              : 'Supervisión visual del avance de órdenes desde recepción hasta entrega al cliente.'}
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-white border border-[#E2E8F0] rounded-lg self-start">
          <button
            type="button"
            onClick={() => setBoardMode('bays')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              boardMode === 'bays'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Bahías de Servicio ({bays.length})
          </button>
          <button
            type="button"
            onClick={() => setBoardMode('kanban')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              boardMode === 'kanban'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Tablero Kanban
          </button>
        </div>
      </div>

      {/* Mode 1: Live Service Bays Floor */}
      {boardMode === 'bays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bays.map((bay) => {
            const order = workOrders.find((o) => o.id === bay.workOrderId);
            const tech = order
              ? technicians.find((t) => t.id === order.technicianId)
              : undefined;

            return (
              <div
                key={bay.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_2px_4px_-2px_rgba(15,23,42,0.04)] transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Bay Header */}
                <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tnum text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                        {bay.code}
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] truncate">
                        {bay.name.replace(`${bay.code} · `, '').replace(/Bahía \d+ · /, '')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#64748B] truncate">
                      {bay.liftType}
                    </p>
                  </div>

                  {order ? (
                    <StatusBadge status={order.status} compact />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] bg-[#F1F5F9] text-[#475569] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      Disponible
                    </span>
                  )}
                </div>

                {/* Bay Body */}
                {order ? (
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono tnum text-sm font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
                              {order.plate}
                            </span>
                            <span className="font-mono tnum text-xs font-semibold text-[#2563EB]">
                              {order.code}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-[#0F172A]">
                            {order.vehicle}
                          </h3>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {order.customerName} ·{' '}
                            <span className="font-mono tnum">
                              {order.mileageKm.toLocaleString('es-ES')} km
                            </span>
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-[#475569] line-clamp-2 leading-relaxed">
                        {order.reportedIssue}
                      </p>
                    </div>

                    {/* Technician & Timer Row */}
                    <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {tech ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                              {tech.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0F172A] truncate">
                                {tech.name}
                              </p>
                              <p className="text-[11px] text-[#64748B] truncate">
                                {tech.certification}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748B]">Sin técnico</span>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono tnum text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                            {formatTimer(order.elapsedSeconds)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleTimer(order.id)}
                            aria-label={
                              order.timerRunning
                                ? 'Pausar cronómetro'
                                : 'Iniciar cronómetro'
                            }
                            className={`p-1.5 rounded-md border transition-colors ${
                              order.timerRunning
                                ? 'bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8]'
                                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                            }`}
                          >
                            {order.timerRunning ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order.id)}
                          className={`flex-1 ${btnHeight} px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors`}
                        >
                          Abrir Orden
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDvi(order.id)}
                          className={`${btnHeight} px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap`}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          DVI
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    {assigningBayId === bay.id ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-[#0F172A]">
                          Despachar vehículo a {bay.code}
                        </p>
                        {unassignedOrders.length > 0 ? (
                          <>
                            <select
                              value={selectedOrderForBay}
                              onChange={(e) => setSelectedOrderForBay(e.target.value)}
                              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                            >
                              <option value="">Seleccionar orden pendiente...</option>
                              {unassignedOrders.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.code} · {u.plate} · {u.vehicle}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedTechForBay}
                              onChange={(e) => setSelectedTechForBay(e.target.value)}
                              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                            >
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.certification})
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={!selectedOrderForBay}
                                onClick={() => {
                                  if (selectedOrderForBay) {
                                    onAssignOrderToBay(
                                      selectedOrderForBay,
                                      bay.id,
                                      selectedTechForBay
                                    );
                                    setAssigningBayId(null);
                                    setSelectedOrderForBay('');
                                  }
                                }}
                                className="flex-1 h-10 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                              >
                                Confirmar Ingreso
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssigningBayId(null)}
                                className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-[#64748B] py-2">
                            No hay órdenes pendientes en patio sin bahía asignada.
                            <button
                              type="button"
                              onClick={() => setAssigningBayId(null)}
                              className="block mt-2 text-[#2563EB] font-semibold"
                            >
                              Volver
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-3 my-auto">
                        <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B]">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">
                            Puesto libre para asignación
                          </p>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {unassignedOrders.length > 0
                              ? `${unassignedOrders.length} orden(es) esperando elevador`
                              : 'Listo para recepción inmediata'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningBayId(bay.id);
                            setSelectedOrderForBay(unassignedOrders[0]?.id || '');
                          }}
                          className={`${btnHeight} px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors`}
                        >
                          Asignar Vehículo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Technician Stage Kanban Board */}
      {boardMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageOrders = workOrders.filter((o) => o.status === stage);
            return (
              <div
                key={stage}
                className="bg-[#F1F5F9]/70 border border-[#E2E8F0] rounded-xl p-3 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <StatusBadge status={stage} compact />
                  <span className="font-mono tnum text-xs font-bold text-[#64748B]">
                    {stageOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageOrders.length === 0 ? (
                    <div className="bg-white/60 border border-dashed border-[#CBD5E1] rounded-lg p-4 text-center text-xs text-[#64748B]">
                      Sin vehículos en esta etapa
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const nextStage = getNextStage(order.status);
                      const tech = technicians.find(
                        (t) => t.id === order.technicianId
                      );
                      const { total } = computeOrderTotals(order);

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-lg border border-[#E2E8F0] p-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] hover:border-[#2563EB]/50 transition-colors space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono tnum text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                              {order.plate}
                            </span>
                            <span className="font-mono tnum text-[11px] font-semibold text-[#64748B]">
                              {order.code}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.id)}
                            className="text-left block w-full group"
                          >
                            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                              {order.vehicle}
                            </p>
                            <p className="text-xs text-[#64748B] truncate mt-0.5">
                              {order.customerName}
                            </p>
                          </button>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
                            <span className="text-[#64748B] truncate">
                              {tech ? tech.initials + ' · ' + tech.name.split(' ')[0] : 'Sin asignar'}
                            </span>
                            <span className="font-mono tnum font-semibold text-[#0F172A]">
                              {formatCurrency(total)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectOrder(order.id)}
                              className="flex-1 py-1.5 px-2 rounded-md border border-[#E2E8F0] text-[11px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                            >
                              Detalles
                            </button>
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(order.id, nextStage)}
                                title={`Avanzar a ${nextStage}`}
                                className="py-1.5 px-2 rounded-md bg-[#DBEAFE] hover:bg-[#BFDBFE] text-[#1D4ED8] text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                {nextStage === 'Finalizada/Entregada' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5" />
                                )}
                                Avanzar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
