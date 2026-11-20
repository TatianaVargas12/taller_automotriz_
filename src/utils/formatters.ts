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
  const laborLines = order?.laborLines || [];
  const partLines = order?.partLines || [];
  const laborSubtotal = laborLines.reduce(
    (sum, line) => sum + (line?.hours || 0) * (line?.hourlyRate || 0),
    0
  );
  const partsSubtotal = partLines.reduce(
    (sum, line) => sum + (line?.qty || 0) * (line?.unitPrice || 0),
    0
  );
  const subtotal = laborSubtotal + partsSubtotal;
  const taxRate = typeof order?.taxRate === 'number' ? order.taxRate : 0.21;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  return {
    laborSubtotal,
    partsSubtotal,
    subtotal,
    tax,
    total,
  };
}
