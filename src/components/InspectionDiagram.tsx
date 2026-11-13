import React from 'react';
import { InspectionTriState } from '../types/workshop';

interface InspectionDiagramProps {
  type: 'brakes' | 'tires' | 'battery' | 'engine';
  state: InspectionTriState;
  measured?: string;
  unit?: string;
}

export const InspectionDiagram: React.FC<InspectionDiagramProps> = ({
  type,
  state,
  measured,
  unit,
}) => {
  const accent =
    state === 'Fail'
      ? '#DC2626'
      : state === 'Pass'
      ? '#16A34A'
      : '#64748B';
  const surface =
    state === 'Fail'
      ? '#FEF2F2'
      : state === 'Pass'
      ? '#F0FDF4'
      : '#F8FAFC';

  return (
    <div
      className="relative w-full h-36 rounded-lg border border-[#E2E8F0] overflow-hidden flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: surface }}
    >
      <div className="flex flex-col justify-between h-full z-10 max-w-[52%]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
            {type === 'brakes' && 'Eje Delantero · Disco / Pastilla'}
            {type === 'tires' && 'Banda Rodadura · Profundidad'}
            {type === 'battery' && 'Batería AGM · Prueba Carga'}
            {type === 'engine' && 'Correa Auxiliar · Distribución'}
          </span>
          <p className="mt-1 text-lg font-bold font-mono tnum text-[#0F172A]">
            {measured || '—'} {unit}
          </p>
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: accent }}
        >
          {state === 'Fail' && 'Fuera de tolerancia OEM'}
          {state === 'Pass' && 'Dentro de especificación'}
          {(state === 'N/A' || state === null) && 'Sin medición registrada'}
        </span>
      </div>

      <svg
        viewBox="0 0 120 90"
        className="w-28 h-24 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        {type === 'brakes' && (
          <g>
            <circle cx="56" cy="45" r="34" stroke="#94A3B8" strokeWidth="2" fill="#FFFFFF" />
            <circle cx="56" cy="45" r="26" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="56" cy="45" r="11" stroke="#475569" strokeWidth="2" fill="#E2E8F0" />
            <path
              d="M78 20 C92 32, 92 58, 78 70 L68 62 C78 52, 78 38, 68 28 Z"
              fill={accent}
              fillOpacity="0.18"
              stroke={accent}
              strokeWidth="2"
            />
            <line x1="88" y1="45" x2="106" y2="45" stroke={accent} strokeWidth="1.5" />
          </g>
        )}

        {type === 'tires' && (
          <g>
            <rect x="24" y="12" width="72" height="66" rx="8" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
            <line x1="42" y1="12" x2="42" y2="78" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="60" y1="12" x2="60" y2="78" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="78" y1="12" x2="78" y2="78" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M24 30 H42 M42 42 H60 M60 30 H78 M78 46 H96" stroke="#94A3B8" strokeWidth="2" />
            <rect x="52" y="24" width="16" height="36" rx="2" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.75" />
          </g>
        )}

        {type === 'battery' && (
          <g>
            <rect x="20" y="24" width="80" height="50" rx="6" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
            <rect x="30" y="16" width="14" height="8" rx="2" fill="#DC2626" />
            <rect x="76" y="16" width="14" height="8" rx="2" fill="#0F172A" />
            <path d="M34 48 H42 M38 44 V52" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
            <path d="M78 48 H86" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M55 34 L49 48 H57 L53 62 L66 45 H58 Z"
              fill={accent}
              fillOpacity="0.22"
              stroke={accent}
              strokeWidth="1.5"
            />
          </g>
        )}

        {type === 'engine' && (
          <g>
            <circle cx="38" cy="34" r="14" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
            <circle cx="38" cy="34" r="5" fill="#94A3B8" />
            <circle cx="84" cy="36" r="12" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
            <circle cx="84" cy="36" r="4" fill="#94A3B8" />
            <circle cx="60" cy="64" r="11" fill="#FFFFFF" stroke={accent} strokeWidth="2" />
            <circle cx="60" cy="64" r="4" fill={accent} />
            <path
              d="M26 26 L86 24 L95 40 L70 72 L49 72 L24 40 Z"
              stroke={accent}
              strokeWidth="2"
              strokeDasharray="4 2"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
