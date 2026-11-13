import { WorkOrder } from '../types/workshop';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTimer(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function computeOrderTotals(order: WorkOrder) {
  const laborSubtotal = order.laborLines.reduce(
    (sum, line) => sum + line.hours * line.hourlyRate,
    0
  );
  const partsSubtotal = order.partLines.reduce(
    (sum, line) => sum + line.qty * line.unitPrice,
    0
  );
  const subtotal = laborSubtotal + partsSubtotal;
  const tax = subtotal * order.taxRate;
  const total = subtotal + tax;
  return {
    laborSubtotal,
    partsSubtotal,
    subtotal,
    tax,
    total,
  };
}
