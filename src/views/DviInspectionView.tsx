import React, { useState } from 'react';
import { Check, Plus, Wrench } from 'lucide-react';
import {
  DviCheckItem,
  InspectionTriState,
  WorkOrder,
} from '../types/workshop';
import { StatusBadge } from '../components/StatusBadge';
import { InspectionDiagram } from '../components/InspectionDiagram';

interface DviInspectionViewProps {
  workOrders: WorkOrder[];
  selectedOrderId: string;
  shopFloorMode: boolean;
  onSelectOrderId: (id: string) => void;
  onUpdateDviItem: (
    orderId: string,
    itemId: string,
    patch: Partial<DviCheckItem>
  ) => void;
  onToggleChecklistTask: (orderId: string, taskId: string) => void;
  onAddDviFailureToEstimate: (orderId: string, item: DviCheckItem) => void;
  onAddNewDviPoint: (
    orderId: string,
    category: DviCheckItem['category'],
    label: string,
    specValue: string
  ) => void;
}

const CATEGORIES: ('Todos' | DviCheckItem['category'])[] = [
  'Todos',
  'Frenos y Suspensión',
  'Motor y Fluidos',
  'Neumáticos y Alineación',
  'Sistema Eléctrico',
];

export const DviInspectionView: React.FC<DviInspectionViewProps> = ({
  workOrders,
  selectedOrderId,
  shopFloorMode,
  onSelectOrderId,
  onUpdateDviItem,
  onToggleChecklistTask,
  onAddDviFailureToEstimate,
  onAddNewDviPoint,
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<'Todos' | DviCheckItem['category']>('Todos');
  const [newPointLabel, setNewPointLabel] = useState('');
  const [newPointSpec, setNewPointSpec] = useState('');
  const [newPointCategory, setNewPointCategory] =
    useState<DviCheckItem['category']>('Frenos y Suspensión');

  const inspectableOrders = workOrders.filter(
    (o) => o.status !== 'Alerta / Cancelada'
  );
  const currentOrder =
    workOrders.find((o) => o.id === selectedOrderId) || inspectableOrders[0];

  if (!currentOrder) return null;

  const dviItems = currentOrder.dviItems.filter(
    (item) => categoryFilter === 'Todos' || item.category === categoryFilter
  );

  const passCount = currentOrder.dviItems.filter((i) => i.state === 'Pass').length;
  const failCount = currentOrder.dviItems.filter((i) => i.state === 'Fail').length;
  const naCount = currentOrder.dviItems.filter((i) => i.state === 'N/A').length;
  const evaluatedCount = passCount + failCount + naCount;
  const totalCount = currentOrder.dviItems.length;

  const diagramItems = currentOrder.dviItems.filter((i) => i.diagramType);
  const touchBtnHeight = shopFloorMode ? 'h-12' : 'h-10';

  return (
    <div className="space-y-6">
      {/* Vehicle Selector & DVI Summary Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <label
                htmlFor="dvi-order-select"
                className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1"
              >
                Vehículo en Inspección
              </label>
              <select
                id="dvi-order-select"
                value={currentOrder.id}
                onChange={(e) => onSelectOrderId(e.target.value)}
                className={`${touchBtnHeight} min-w-[280px] px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15`}
              >
                {inspectableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} · {o.plate} — {o.vehicle}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:pt-5 flex items-center gap-2">
              <StatusBadge status={currentOrder.status} />
              <span className="font-mono tnum text-xs text-[#64748B]">
                VIN: {currentOrder.vin}
              </span>
            </div>
          </div>

          {/* DVI Live Tally */}
          <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E2E8F0]">
            <div className="text-center px-3">
              <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#16A34A]">
                Pass
              </span>
              <span className="font-mono tnum text-xl font-bold text-[#0F172A]">
                {passCount}
              </span>
            </div>
            <div className="h-8 w-px bg-[#E2E8F0]" />
            <div className="text-center px-3">
              <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#DC2626]">
                Fail
              </span>
              <span className="font-mono tnum text-xl font-bold text-[#DC2626]">
                {failCount}
              </span>
            </div>
            <div className="h-8 w-px bg-[#E2E8F0]" />
            <div className="text-center px-3">
              <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                Progreso
              </span>
              <span className="font-mono tnum text-xl font-bold text-[#2563EB]">
                {evaluatedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Tri-state DVI Checklist */}
        <div className="xl:col-span-8 space-y-4">
          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] divide-y divide-[#E2E8F0]">
            {dviItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#64748B]">
                No hay puntos de inspección registrados en esta categoría para {currentOrder.code}.
              </div>
            ) : (
              dviItems.map((item) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5">
                        {item.label}
                      </h3>
                      {item.specValue && (
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Especificación OEM:{' '}
                          <span className="font-mono tnum font-semibold text-[#0F172A]">
                            {item.specValue}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Tri-State [ Pass / Fail / N/A ] Button Group */}
                    <div
                      role="group"
                      aria-label={`Resultado de ${item.label}`}
                      className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 shrink-0 self-start sm:self-center"
                    >
                      {(['Pass', 'Fail', 'N/A'] as Exclude<InspectionTriState, null>[]).map(
                        (option) => {
                          const selected = item.state === option;
                          let activeStyle = 'text-[#64748B] hover:text-[#0F172A]';
                          if (selected && option === 'Pass') {
                            activeStyle = 'bg-[#16A34A] text-white shadow-sm';
                          } else if (selected && option === 'Fail') {
                            activeStyle = 'bg-[#DC2626] text-white shadow-sm';
                          } else if (selected && option === 'N/A') {
                            activeStyle = 'bg-[#475569] text-white shadow-sm';
                          }

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                onUpdateDviItem(currentOrder.id, item.id, {
                                  state: option,
                                })
                              }
                              className={`${
                                shopFloorMode ? 'h-10 px-4' : 'h-8 px-3.5'
                              } rounded-md text-xs font-bold uppercase tracking-[0.03em] transition-colors ${activeStyle}`}
                            >
                              {option}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Measured Value & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                        Lectura Medida {item.unit ? `(${item.unit})` : ''}
                      </label>
                      <input
                        type="text"
                        value={item.measuredValue || ''}
                        onChange={(e) =>
                          onUpdateDviItem(currentOrder.id, item.id, {
                            measuredValue: e.target.value,
                          })
                        }
                        placeholder="Ej: 4.5"
                        className={`w-full ${touchBtnHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg font-mono tnum text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15`}
                      />
                    </div>
                    <div className="sm:col-span-9">
                      <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                        Observaciones del Técnico
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) =>
                          onUpdateDviItem(currentOrder.id, item.id, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Hallazgo técnico o recomendación..."
                        className={`w-full ${touchBtnHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/15`}
                      />
                    </div>
                  </div>

                  {item.state === 'Fail' && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-xs font-semibold text-[#DC2626]">
                        Hallazgo crítico detectado en inspección
                      </span>
                      {item.addedToEstimate ? (
                        <span className="text-xs font-semibold text-[#16A34A] inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Añadido al presupuesto de {currentOrder.code}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onAddDviFailureToEstimate(currentOrder.id, item)
                          }
                          className="h-9 px-3 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Agregar Mano de Obra a Presupuesto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Add Custom Inspection Point */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPointLabel.trim()) return;
                onAddNewDviPoint(
                  currentOrder.id,
                  newPointCategory,
                  newPointLabel.trim(),
                  newPointSpec.trim() || 'Verificación visual'
                );
                setNewPointLabel('');
                setNewPointSpec('');
              }}
              className="p-5 bg-[#F8FAFC] flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="sm:w-48">
                <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                  Sistema
                </label>
                <select
                  value={newPointCategory}
                  onChange={(e) =>
                    setNewPointCategory(e.target.value as DviCheckItem['category'])
                  }
                  className={`w-full ${touchBtnHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A]`}
                >
                  {CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                  Nuevo Punto de Inspección
                </label>
                <input
                  type="text"
                  value={newPointLabel}
                  onChange={(e) => setNewPointLabel(e.target.value)}
                  placeholder="Ej: Holgura rótula axial izquierda..."
                  className={`w-full ${touchBtnHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]`}
                />
              </div>
              <div className="sm:w-36">
                <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] mb-1">
                  Tolerancia
                </label>
                <input
                  type="text"
                  value={newPointSpec}
                  onChange={(e) => setNewPointSpec(e.target.value)}
                  placeholder="Ej: 0 mm juego"
                  className={`w-full ${touchBtnHeight} px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]`}
                />
              </div>
              <button
                type="submit"
                className={`${touchBtnHeight} px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap`}
              >
                <Plus className="w-4 h-4" />
                Añadir Punto
              </button>
            </form>
          </div>
        </div>

        {/* Right 4 cols: Technical Tasks Checkboxes & Visual Diagnostic Schematics */}
        <div className="xl:col-span-4 space-y-6">
          {/* Technical Checklist (20x20px custom checkboxes from spec) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Protocolo de Tareas de Bahía
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verificación secuencial asignada a {currentOrder.code}
              </p>
            </div>

            <div className="space-y-3">
              {currentOrder.checklistTasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-start gap-3 cursor-pointer select-none group"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={task.done}
                    onClick={() => onToggleChecklistTask(currentOrder.id, task.id)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      task.done
                        ? 'bg-[#2563EB] border-[1.5px] border-[#2563EB] text-white'
                        : 'bg-white border-[1.5px] border-[#64748B] group-hover:border-[#2563EB]'
                    }`}
                  >
                    {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span
                    className={`text-sm leading-snug ${
                      task.done
                        ? 'line-through text-[#64748B]'
                        : 'text-[#0F172A] font-medium'
                    }`}
                  >
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Visual Inspection Gallery (Vector Diagnostic Schematics) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Esquemas Técnicos de Hallazgo
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Representación dimensional de mediciones críticas
              </p>
            </div>

            {diagramItems.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">
                Sin esquemas vinculados en esta orden.
              </p>
            ) : (
              <div className="space-y-3">
                {diagramItems.map((item) => (
                  <InspectionDiagram
                    key={item.id}
                    type={item.diagramType!}
                    state={item.state}
                    measured={item.measuredValue}
                    unit={item.unit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
