import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Edit3,
  ExternalLink,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { ScreenRoute, ServiceBay, WorkOrder } from '../types/workshop';

interface ProfileViewProps {
  currentUser: AuthUser;
  workOrders: WorkOrder[];
  bays: ServiceBay[];
  onUpdateProfile: (updated: AuthUser) => void;
  onLogout: () => void;
  onNavigate: (screen: ScreenRoute) => void;
  onBack?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  workOrders,
  bays,
  onUpdateProfile,
  onLogout,
  onNavigate,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '+34 612 345 678');
  const [specialty, setSpecialty] = useState(
    currentUser.specialty || 'Gestión Operativa y Diagnóstico General'
  );
  const [assignedBay, setAssignedBay] = useState(
    currentUser.assignedBay || 'Bahía 01 · Elevador 4.0T'
  );
  const [shift, setShift] = useState(
    currentUser.shift || 'Lunes a Viernes 07:30 - 16:30 (Turno Principal)'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active orders assigned to or supervised by the current user
  const userOrders = workOrders.filter(
    (o) =>
      o.technicianId === currentUser.id ||
      o.advisorName === currentUser.name ||
      currentUser.role === 'supervisor' ||
      currentUser.role === 'admin'
  );

  const activeOrdersCount = userOrders.filter(
    (o) => o.status !== 'Finalizada/Entregada' && o.status !== 'Alerta / Cancelada'
  ).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

    const updated: AuthUser = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      initials: initials || currentUser.initials,
      phone: phone.trim(),
      specialty: specialty.trim(),
      assignedBay: assignedBay.trim(),
      shift: shift.trim(),
    };

    onUpdateProfile(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack ? onBack : () => onNavigate('operations')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{onBack ? 'Volver a la página principal' : 'Volver al Panel de Bahías'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
              isEditing
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancelar Edición' : 'Editar Información'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>¡Información del perfil actualizada exitosamente en el sistema de taller!</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Sincronizado</span>
        </div>
      )}

      {/* Profile Hero Header Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* User Big Avatar */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-2xl shrink-0 ring-4 ring-white/10"
              style={{ backgroundColor: currentUser.avatarColor || '#2563EB' }}
            >
              {currentUser.initials || (currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US')}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentUser.roleLabel || (currentUser.role === 'client' ? 'Cliente Registrado' : 'Usuario')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Turno Activo
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {currentUser.email}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {assignedBay}
                </span>
              </div>

              <p className="text-xs text-slate-400 pt-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                {currentUser.certification || 'Técnico Especialista Certificado · AutoTaller Pro'}
              </p>
            </div>
          </div>

          {/* Quick Security Badge */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 min-w-[200px] shrink-0 space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estación de Trabajo
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Terminal:</span>
              <span className="font-mono font-bold text-white">Norte #01</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Cifrado:</span>
              <span className="text-emerald-400 font-semibold font-mono">TLS 1.3</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">ISO 9001:</span>
              <span className="text-blue-400 font-semibold">Auditado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Live KPI Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Órdenes en Seguimiento
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 tnum">
              {activeOrdersCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              En Curso
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Bajo su gestión técnica</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Eficiencia Mano de Obra
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 tnum">
              97.4%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              +2.1% mes
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tiempos estándar vs cronómetro</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Inspecciones DVI
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 tnum">
              42
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              100% OEM
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Reportes multipunto validados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Cumplimiento SLA Flotas
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-blue-600 tnum">
              99.2%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              A tiempo
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Entregas dentro de ventana</span>
        </div>
      </div>

      {/* Main Grid: Details Form & Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operator Details & Edit Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ficha Técnica y Datos del Operador
              </h3>
              <p className="text-xs text-slate-500">
                Información de contacto, horario y asignación en el taller
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              ID: {currentUser.id}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  required
                  className="w-full h-10 px-3 bg-white disabled:bg-slate-50 border border-slate-300 disabled:border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Correo Electrónico (Institucional)
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Rol Oficial en Taller
                </label>
                <input
                  type="text"
                  value={currentUser.roleLabel || (currentUser.role === 'client' ? 'Cliente Registrado' : 'Usuario')}
                  disabled
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Teléfono de Contacto Interno
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full h-10 px-3 bg-white disabled:bg-slate-50 border border-slate-300 disabled:border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 disabled:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Especialidad Técnica / Área Principal
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={!isEditing}
                className="w-full h-10 px-3 bg-white disabled:bg-slate-50 border border-slate-300 disabled:border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 disabled:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Bahía Habitual / Elevador
                </label>
                <input
                  type="text"
                  value={assignedBay}
                  onChange={(e) => setAssignedBay(e.target.value)}
                  disabled={!isEditing}
                  className="w-full h-10 px-3 bg-white disabled:bg-slate-50 border border-slate-300 disabled:border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Turno de Operación
                </label>
                <input
                  type="text"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  disabled={!isEditing}
                  className="w-full h-10 px-3 bg-white disabled:bg-slate-50 border border-slate-300 disabled:border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 disabled:text-slate-600"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            )}
          </form>

          {/* Quick Details Checklist */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Ingreso</span>
              <span className="font-semibold text-slate-800">{currentUser.joinedDate || 'Enero 2023'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Bahías del Taller</span>
              <span className="font-semibold text-slate-800">{bays.length} bahías operativas</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Estado</span>
              <span className="font-semibold text-emerald-700">✓ Verificado</span>
            </div>
          </div>
        </div>

        {/* Right Column: Work Orders in Progress & Security (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Work Orders Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Órdenes en Taller ({userOrders.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {userOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onNavigate('orders')}
                  className="p-3 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">
                        {order.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {order.plate}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">
                      {order.vehicle}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {order.customerName}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 block">
                      {order.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {order.bayId ? `Bahía ${order.bayId.replace('b', '0')}` : 'Patio'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Access Credentials Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Seguridad y Auditoría de Acceso
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Última autenticación:</span>
                <span className="font-mono font-semibold text-slate-800">Hoy · 08:15 AM</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Protocolo de transporte:</span>
                <span className="font-mono text-emerald-600 font-bold">TLS 1.3 / HTTPS</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Permisos asignados:</span>
                <span className="font-semibold text-slate-800">Bahías, DVI & Cronómetros</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 leading-relaxed">
              La sesión se encuentra vinculada a la estación de trabajo y cuenta con trazabilidad completa de cambios conforme a la norma ISO 9001.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
