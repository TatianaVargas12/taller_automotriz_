import React, { useState } from 'react';
import { Building2, Car, Mail, MapPin, Phone, Plus, User } from 'lucide-react';
import { Customer, CustomerVehicle, WorkOrder } from '../types/workshop';
import { StatusBadge } from '../components/StatusBadge';
import { computeOrderTotals, formatCurrency } from '../utils/formatters';

interface CustomersViewProps {
  customers: Customer[];
  workOrders: WorkOrder[];
  shopFloorMode: boolean;
  onSelectOrder: (orderId: string) => void;
  onCreateOrderForVehicle: (customer: Customer, vehicle: CustomerVehicle) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  workOrders,
  shopFloorMode,
  onSelectOrder,
  onCreateOrderForVehicle,
  onAddCustomer,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Flota' | 'Particular'>(
    'Todos'
  );
  const [showNewClient, setShowNewClient] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Flota' | 'Particular'>('Particular');
  const [newTaxId, setNewTaxId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('2023');

  const filteredCustomers = customers.filter(
    (c) => typeFilter === 'Todos' || c.type === typeFilter
  );
  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0];

  const customerOrders = selectedCustomer
    ? workOrders.filter((o) => o.customerId === selectedCustomer.id)
    : [];

  const btnHeight = shopFloorMode ? 'h-12' : 'h-10';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['Todos', 'Flota', 'Particular'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {t === 'Todos' ? 'Todos los Clientes' : `Cuentas ${t}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowNewClient((v) => !v)}
          className={`${btnHeight} px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto`}
        >
          <Plus className="w-4 h-4" />
          Registrar Cliente / Flota
        </button>
      </div>

      {showNewClient && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim() || !newPlate.trim()) return;
            onAddCustomer({
              name: newName.trim(),
              type: newType,
              taxId: newTaxId.trim() || 'B-00000000',
              phone: newPhone.trim() || '+34 600 000 000',
              email: newEmail.trim() || 'contacto@cliente.es',
              address: 'Dirección registrada en recepción',
              vehicles: [
                {
                  id: `veh-${Date.now()}`,
                  plate: newPlate.trim().toUpperCase(),
                  vin: `WVWZZZ${Math.random().toString(36).substring(2, 13).toUpperCase()}`,
                  year: Number(newYear) || 2023,
                  make: newMake.trim() || 'Toyota',
                  model: newModel.trim() || 'Corolla Fleet',
                  mileageKm: 25000,
                  lastServiceDate: '2026-11-13',
                  nextServiceKm: 40000,
                },
              ],
            });
            setNewName('');
            setNewPlate('');
            setNewMake('');
            setNewModel('');
            setShowNewClient(false);
          }}
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre completo o Razón Social"
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'Flota' | 'Particular')}
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
          >
            <option value="Particular">Particular</option>
            <option value="Flota">Flota Corporativa</option>
          </select>
          <input
            type="text"
            value={newTaxId}
            onChange={(e) => setNewTaxId(e.target.value)}
            placeholder="NIF / CIF"
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono text-xs"
          />
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Teléfono de contacto"
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
          />
          <input
            type="text"
            required
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
            placeholder="Matrícula / Placa (ej: 4412-NMP)"
            className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono text-xs uppercase"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
              placeholder="Marca"
              className="w-1/2 h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              type="text"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Modelo"
              className="w-1/2 h-10 px-3 border border-[#E2E8F0] rounded-lg text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 h-10 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
            >
              Guardar Ficha
            </button>
            <button
              type="button"
              onClick={() => setShowNewClient(false)}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] divide-y divide-[#E2E8F0] overflow-hidden">
          {filteredCustomers.map((customer) => {
            const active = selectedCustomer?.id === customer.id;
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedCustomerId(customer.id)}
                className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                  active ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {customer.type === 'Flota' ? (
                      <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-[#64748B] shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-[#0F172A] truncate">
                      {customer.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 font-mono tnum">
                    {customer.taxId} · {customer.vehicles.length} vehículo(s)
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] shrink-0">
                  {customer.type}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Detail Panel */}
        {selectedCustomer && (
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#2563EB]">
                    Cuenta {selectedCustomer.type} · {selectedCustomer.taxId}
                  </span>
                  <h2 className="text-xl font-bold text-[#0F172A] mt-1">
                    {selectedCustomer.name}
                  </h2>
                </div>
                <div className="text-xs text-[#64748B] space-y-1.5">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-mono tnum text-[#0F172A]">
                      {selectedCustomer.phone}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedCustomer.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedCustomer.address}</span>
                  </p>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="pt-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Unidades Registradas ({(selectedCustomer.vehicles || []).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedCustomer.vehicles || []).map((veh) => (
                    <div
                      key={veh.id}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono tnum text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                            {veh.plate}
                          </span>
                          <h4 className="text-sm font-semibold text-[#0F172A] mt-2">
                            {veh.year} {veh.make} {veh.model}
                          </h4>
                          <p className="font-mono tnum text-[11px] text-[#64748B] mt-0.5">
                            VIN: {veh.vin}
                          </p>
                        </div>
                        <Car className="w-5 h-5 text-[#64748B]" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                        <span className="font-mono tnum">
                          {veh.mileageKm.toLocaleString('es-ES')} km
                        </span>
                        <span className="font-mono tnum">
                          Próx. Serv: {veh.nextServiceKm.toLocaleString('es-ES')} km
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCreateOrderForVehicle(selectedCustomer, veh)}
                        className="w-full h-9 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                      >
                        Abrir Orden de Servicio
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service History Table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Historial de Órdenes de Servicio
                </h3>
              </div>
              {customerOrders.length === 0 ? (
                <p className="p-6 text-sm text-[#64748B]">
                  No hay órdenes históricas registradas para esta cuenta.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                          Orden
                        </th>
                        <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                          Vehículo / Placa
                        </th>
                        <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                          Estado
                        </th>
                        <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B] text-right">
                          Importe
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {customerOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          onClick={() => onSelectOrder(ord.id)}
                          className="cursor-pointer hover:bg-[#EFF6FF]/60"
                        >
                          <td className="py-3 px-4 font-mono tnum text-xs font-bold text-[#2563EB]">
                            {ord.code}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className="font-semibold text-[#0F172A]">
                              {ord.vehicle}
                            </span>{' '}
                            <span className="font-mono text-[#64748B]">
                              ({ord.plate})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={ord.status} compact />
                          </td>
                          <td className="py-3 px-4 text-right font-mono tnum text-xs font-bold text-[#0F172A]">
                            {formatCurrency(computeOrderTotals(ord).total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
