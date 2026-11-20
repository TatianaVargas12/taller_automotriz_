import React from 'react';
import { WorkOrderStatus } from '../types/workshop';

interface StatusBadgeProps {
  status: WorkOrderStatus;
  compact?: boolean;
}

const STATUS_STYLE_MAP: Record<
  WorkOrderStatus,
  { bg: string; text: string; dot: string; shortLabel: string }
> = {
  'Finalizada/Entregada': {
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#16A34A]',
    dot: 'bg-[#16A34A]',
    shortLabel: 'Finalizada',
  },
  'En Reparación': {
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#2563EB]',
    dot: 'bg-[#2563EB]',
    shortLabel: 'En Reparación',
  },
  'En Diagnóstico': {
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#7C3AED]',
    dot: 'bg-[#7C3AED]',
    shortLabel: 'En Diagnóstico',
  },
  'En Espera (Repuestos)': {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
    shortLabel: 'Espera Repuestos',
  },
  Pendiente: {
    bg: 'bg-[#FEF9C3]',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
    shortLabel: 'Pendiente',
  },
  'Alerta / Cancelada': {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#DC2626]',
    dot: 'bg-[#DC2626]',
    shortLabel: 'Alerta / SLA',
  },
};

const DEFAULT_STATUS_STYLE = {
  bg: 'bg-[#eeeee6]',
  text: 'text-[#62645c]',
  dot: 'bg-[#62645c]',
  shortLabel: 'Estado',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const cfg = STATUS_STYLE_MAP[status] || DEFAULT_STATUS_STYLE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-[14px] tracking-[0.04em] uppercase whitespace-nowrap shrink-0 ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {compact ? cfg.shortLabel : (status || cfg.shortLabel)}
    </span>
  );
};
