import React, { useState } from 'react';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  LogOut,
  Plus,
  User,
  Wrench,
  X,
} from 'lucide-react';
import {
  Customer,
  ServiceBay,
  Technician,
  WorkOrder,
  WorkOrderStatus,
} from '../types/workshop';
import { StatusBadge } from './StatusBadge';
import { formatTimer } from '../utils/formatters';

interface AssignBayModalProps {
  open: boolean;
  bay: ServiceBay | null;
  workOrders: WorkOrder[];
  technicians: Technician[];
  customers: Customer[];
  onClose: () => void;
  onAssignOrder: (orderId: string, bayId: string, techId: string) => void;
  onQuickIntakeAndAssign: (
    bayId: string,
    techId: string,
    plate: string,
    vehicle: string,
    customerId: string,
    customerName: string,
    issue: string,
    priority: WorkOrder['priority']
  ) => void;
  onReleaseBay: (bayId: string) => void;
}

export const AssignBayModal: React.FC<AssignBayModalProps> = ({
  open,
  bay,
  workOrders,
  technicians,
  customers,
  onClose,
  onAssignOrder,
  onQuickIntakeAndAssign,
  onReleaseBay,
}) => {
  if (!open || !bay) return null;

  const currentOrder = workOrders.find((o) => o.id === bay.workOrderId) || null;
  const currentTech = currentOrder
    ? technicians.find((t) => t.id === currentOrder.technicianId)
    : null;

  // Tab mode for vacant bay
  const [activeTab, setActiveTab] = useState<'existing' | 'quick'>('existing');

  // Existing order assignment state
  const availableOrders = workOrders.filter(
    (o) =>
      o.id !== bay.workOrderId &&
      o.status !== 'Finalizada/Entregada' &&
      o.status !== 'Alerta / Cancelada'
  );

  const defaultOrderId =
    availableOrders.find((o) => !o.bayId)?.id || availableOrders[0]?.id || '';
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrderId);
  const [selectedTechId, setSelectedTechId] = useState<string>(
    technicians[0]?.id || ''
  );

  // Quick intake form state
  const [quickPlate, setQuickPlate] = useState('');
  const [quickVehicle, setQuickVehicle] = useState('');
  const [quickCustomerId, setQuickCustomerId] = useState(customers[0]?.id || '');
  const [quickIssue, setQuickIssue] = useState('');
  const [quickPriority, setQuickPriority] =
    useState<WorkOrder['priority']>('Normal');
  const [quickTechId, setQuickTechId] = useState(technicians[0]?.id || '');

  const handleConfirmExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    onAssignOrder(selectedOrderId, bay.id, selectedTechId);
    onClose();
  };

  const handleConfirmQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPlate.trim() || !quickVehicle.trim()) return;

    const customer =
      customers.find((c) => c.id === quickCustomerId) || customers[0];

    onQuickIntakeAndAssign(
      bay.id,
      quickTechId,
      quickPlate.trim().toUpperCase(),
      quickVehicle.trim(),
      customer?.id || 'cust-generic',
      customer?.name || 'Cliente Mostrador',
      quickIssue.trim() || 'Servicio directo en bahía',
      quickPriority
    );
    onClose();
  };

  const handleRelease = () => {
    onReleaseBay(bay.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono tnum text-xs font-bold text-white bg-[#2563EB] px-2 py-0.5 rounded">
                {bay.code}
              </span>
              <h3 className="text-base font-bold text-[#0F172A]">
                {currentOrder ? 'Gestión de Bahía Ocupada' : 'Asignar Vehículo a Bahía'}
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {bay.name} · <span className="font-medium text-[#0F172A]">{bay.liftType}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* CASE 1: BAY IS ALREADY OCCUPIED */}
          {currentOrder ? (
            <div className="space-y-6">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono tnum text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {currentOrder.code}
                    </span>
                    <span className="font-mono tnum text-sm font-bold text-[#0F172A]">
                      {currentOrder.plate}
                    </span>
                  </div>
                  <StatusBadge status={currentOrder.status} compact />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {currentOrder.vehicle}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Cliente: {currentOrder.customerName} ({currentOrder.customerType})
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="text-[#0F172A] font-medium">
                      Técnico: {currentTech?.name || 'Sin asignar'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatTimer(currentOrder.elapsedSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Occupied Actions */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Liberar o Reasignar Bahía</p>
                    <p className="mt-0.5 text-amber-800">
                      Puedes liberar el elevador para recibir otro vehículo, o transferir la orden a otro puesto/patio.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRelease}
                    className="w-full sm:flex-1 h-11 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Liberar Bahía (Desocupar Puesto)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto h-11 px-5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 2: BAY IS FREE - ASSIGN VEHICLE */
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('existing')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'existing'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Órdenes en Taller ({availableOrders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'quick'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Ingreso Rápido a Bahía</span>
                </button>
              </div>

              {/* TAB 1: EXISTING ORDERS */}
              {activeTab === 'existing' && (
                <form onSubmit={handleConfirmExisting} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                      Selecciona la Orden a Montar en Elevador:
                    </label>

                    {availableOrders.length > 0 ? (
                      <div className="max-h-56 overflow-y-auto space-y-2 border border-[#E2E8F0] rounded-xl p-2 bg-[#F8FAFC]">
                        {availableOrders.map((ord) => {
                          const isSelected = selectedOrderId === ord.id;
                          return (
                            <div
                              key={ord.id}
                              onClick={() => setSelectedOrderId(ord.id)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-white border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]'
                                  : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                              }`}
                            >
                              <div className="min-w-0 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[#2563EB]">
                                    {ord.code}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#0F172A] bg-slate-100 px-1.5 py-0.2 rounded">
                                    {ord.plate}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {ord.priority}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-[#0F172A] mt-1 truncate">
                                  {ord.vehicle}
                                </p>
                                <p className="text-[11px] text-[#64748B] truncate">
                                  {ord.customerName} · {ord.reportedIssue}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <StatusBadge status={ord.status} compact />
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? 'border-[#2563EB] bg-[#2563EB]'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B]">
                        No hay órdenes activas pendientes en patio. Usa la pestaña
                        "Ingreso Rápido a Bahía" para registrar un vehículo directo.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                      Técnico Mecánico Asignado:
                    </label>
                    <select
                      value={selectedTechId}
                      onChange={(e) => setSelectedTechId(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.specialty} ({t.certification})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedOrderId}
                      className="h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Asignación a {bay.code}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: QUICK INTAKE TO BAY */}
              {activeTab === 'quick' && (
                <form onSubmit={handleConfirmQuick} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                        Placa / Matrícula *
                      </label>
                      <input
                        type="text"
                        value={quickPlate}
                        onChange={(e) => setQuickPlate(e.target.value)}
                        required
                        placeholder="Ej: 4920-LMN"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold uppercase text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                        Vehículo (Año Marca Modelo) *
                      </label>
                      <input
                        type="text"
                        value={quickVehicle}
                        onChange={(e) => setQuickVehicle(e.target.value)}
                        required
                        placeholder="Ej: 2024 Toyota RAV4 Hybrid"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                        Cliente / Propietario
                      </label>
                      <select
                        value={quickCustomerId}
                        onChange={(e) => setQuickCustomerId(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                        Prioridad de Atención
                      </label>
                      <select
                        value={quickPriority}
                        onChange={(e) =>
                          setQuickPriority(e.target.value as WorkOrder['priority'])
                        }
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                        <option value="Flota SLA">Flota SLA (Express)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Técnico Responsable
                    </label>
                    <select
                      value={quickTechId}
                      onChange={(e) => setQuickTechId(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Motivo de Ingreso o Servicio Requerido
                    </label>
                    <textarea
                      rows={2}
                      value={quickIssue}
                      onChange={(e) => setQuickIssue(e.target.value)}
                      placeholder="Ej: Cambio de pastillas delanteras y diagnóstico de ruidos en frío..."
                      className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!quickPlate.trim() || !quickVehicle.trim()}
                      className="h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear e Ingresar Directo a {bay.code}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

