import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Customer,
  ServiceBay,
  Technician,
  WorkOrder,
} from '../types/workshop';

interface NewWorkOrderModalProps {
  open: boolean;
  customers: Customer[];
  bays: ServiceBay[];
  technicians: Technician[];
  prefill?: { customerId: string; plate: string; vin: string; vehicle: string; mileageKm: number } | null;
  onClose: () => void;
  onCreateOrder: (order: WorkOrder) => void;
}

export const NewWorkOrderModal: React.FC<NewWorkOrderModalProps> = ({
  open,
  customers,
  bays,
  technicians,
  prefill,
  onClose,
  onCreateOrder,
}) => {
  const [customerId, setCustomerId] = useState(
    prefill?.customerId || customers[0]?.id || ''
  );
  const [plate, setPlate] = useState(prefill?.plate || '');
  const [vin, setVin] = useState(prefill?.vin || '');
  const [vehicle, setVehicle] = useState(prefill?.vehicle || '');
  const [mileageKm, setMileageKm] = useState(
    prefill ? String(prefill.mileageKm) : '45000'
  );
  const [priority, setPriority] = useState<WorkOrder['priority']>('Normal');
  const [bayId, setBayId] = useState<string>('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [reportedIssue, setReportedIssue] = useState('');

  if (!open) return null;

  const availableBays = bays.filter((b) => b.workOrderId === null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId) || customers[0];
    const orderNum = Math.floor(2055 + Math.random() * 40);
    const assignedTech = technicians.find((t) => t.id === technicianId);

    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: `OT-${orderNum}`,
      plate: (plate.trim() || '7731-MKT').toUpperCase(),
      vin: (vin.trim() || 'WDB9066571P882104').toUpperCase(),
      vehicle: vehicle.trim() || '2023 Volkswagen Crafter 35',
      mileageKm: Number(mileageKm) || 45000,
      fuelLevel: 70,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      customerPhone: customer.phone,
      status: bayId ? 'En Diagnóstico' : 'Pendiente',
      priority,
      bayId: bayId || null,
      technicianId: technicianId || null,
      advisorName: 'Laura Giménez',
      intakeDate: '2026-11-13 11:20',
      estimatedCompletion: 'Hoy · 18:30',
      elapsedSeconds: 0,
      timerRunning: Boolean(bayId),
      reportedIssue:
        reportedIssue.trim() ||
        'Revisión programada de mantenimiento y diagnóstico preventivo.',
      diagnosticNotes: 'Recepción registrada desde mostrador de servicio.',
      checklistTasks: [
        {
          id: `t-${Date.now()}-1`,
          label: 'Recepción e inspección visual 360°',
          done: true,
        },
        {
          id: `t-${Date.now()}-2`,
          label: 'Escaneo electrónico de centralitas OBD-II',
          done: false,
        },
      ],
      dviItems: [
        {
          id: `dvi-${Date.now()}-1`,
          category: 'Frenos y Suspensión',
          label: 'Espesor pastillas de freno delanteras',
          specValue: '>= 4.0 mm',
          measuredValue: '',
          unit: 'mm',
          state: null,
          notes: '',
          diagramType: 'brakes',
        },
        {
          id: `dvi-${Date.now()}-2`,
          category: 'Sistema Eléctrico',
          label: 'Voltaje de batería y carga alternador',
          specValue: '12.6V / 14.2V',
          measuredValue: '',
          unit: 'V',
          state: null,
          notes: '',
          diagramType: 'battery',
        },
      ],
      laborLines: [
        {
          id: `lab-${Date.now()}`,
          description: 'Inspección y diagnóstico inicial en taller',
          hours: 1.0,
          hourlyRate: 75,
          technicianName: assignedTech ? assignedTech.name : 'Por asignar',
          completed: false,
        },
      ],
      partLines: [],
      taxRate: 0.21,
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-wo-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_10px_15px_-3px_rgba(15,23,42,0.1),0_4px_6px_-4px_rgba(15,23,42,0.05)] w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 id="new-wo-title" className="text-lg font-semibold text-[#0F172A]">
              Recepción de Vehículo · Nueva Orden de Trabajo
            </h2>
            <p className="text-xs text-[#64748B]">
              Registra datos de ingreso, placa, VIN y asigna bahía si está disponible.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Cliente / Cuenta Flota
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setCustomerId(cid);
                  const c = customers.find((x) => x.id === cid);
                  if (c && c.vehicles[0]) {
                    setPlate(c.vehicles[0].plate);
                    setVin(c.vehicles[0].vin);
                    setVehicle(
                      `${c.vehicles[0].year} ${c.vehicles[0].make} ${c.vehicles[0].model}`
                    );
                    setMileageKm(String(c.vehicles[0].mileageKm));
                  }
                }}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Prioridad Operativa
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as WorkOrder['priority'])
                }
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                <option value="Normal">Normal</option>
                <option value="Flota SLA">Flota SLA</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Placa / Matrícula
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ej: 8492-KLM"
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Número VIN (17 dígitos)
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Ej: WF0XXXTTGXNJ48219"
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Año / Marca / Modelo
              </label>
              <input
                type="text"
                required
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ej: 2023 Ford Transit 350"
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Odómetro (km)
              </label>
              <input
                type="number"
                min="0"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono tnum text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Asignar Bahía (Opcional)
              </label>
              <select
                value={bayId}
                onChange={(e) => setBayId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                <option value="">Dejar en Patio (Pendiente)</option>
                {availableBays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Técnico Asignado
              </label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                <option value="">Por asignar</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.certification})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Motivo de Ingreso / Síntomas Reportados
            </label>
            <textarea
              rows={3}
              required
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              placeholder="Describe ruidos, códigos de falla, kilometraje de mantenimiento o solicitud del conductor..."
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#0F172A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold"
            >
              Crear Orden de Trabajo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
