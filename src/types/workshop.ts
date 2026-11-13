export type WorkOrderStatus =
  | 'Pendiente'
  | 'En Diagnóstico'
  | 'En Reparación'
  | 'En Espera (Repuestos)'
  | 'Finalizada/Entregada'
  | 'Alerta / Cancelada';

export type InspectionTriState = 'Pass' | 'Fail' | 'N/A' | null;

export type ScreenRoute =
  | 'operations'
  | 'orders'
  | 'dvi'
  | 'inventory'
  | 'customers';

export interface Technician {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  certification: string;
  activeBayId?: string;
}

export interface LaborLine {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  technicianName: string;
  completed: boolean;
}

export interface PartLine {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  inStock: boolean;
}

export interface DviCheckItem {
  id: string;
  category: 'Frenos y Suspensión' | 'Motor y Fluidos' | 'Neumáticos y Alineación' | 'Sistema Eléctrico';
  label: string;
  specValue?: string;
  measuredValue?: string;
  unit?: string;
  state: InspectionTriState;
  notes: string;
  diagramType?: 'brakes' | 'tires' | 'battery' | 'engine';
  addedToEstimate?: boolean;
}

export interface WorkOrder {
  id: string;
  code: string; // e.g. OT-2048
  plate: string;
  vin: string;
  vehicle: string; // Year Make Model
  mileageKm: number;
  fuelLevel: number; // %
  customerId: string;
  customerName: string;
  customerType: 'Flota' | 'Particular';
  customerPhone: string;
  status: WorkOrderStatus;
  priority: 'Normal' | 'Urgente' | 'Flota SLA';
  bayId: string | null;
  technicianId: string | null;
  advisorName: string;
  intakeDate: string;
  estimatedCompletion: string;
  elapsedSeconds: number;
  timerRunning: boolean;
  reportedIssue: string;
  diagnosticNotes: string;
  checklistTasks: { id: string; label: string; done: boolean }[];
  dviItems: DviCheckItem[];
  laborLines: LaborLine[];
  partLines: PartLine[];
  taxRate: number; // e.g., 0.16 or 0.21
}

export interface ServiceBay {
  id: string;
  code: string; // Bahía 01
  name: string;
  liftType: string;
  workOrderId: string | null;
  status: 'Ocupada' | 'Disponible' | 'Mantenimiento';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: 'Frenos' | 'Filtros y Lubricantes' | 'Suspensión' | 'Eléctrico' | 'Motor';
  binLocation: string;
  stock: number;
  minStock: number;
  unitCost: number;
  salePrice: number;
  reorderRequested?: boolean;
}

export interface CustomerVehicle {
  id: string;
  plate: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  mileageKm: number;
  lastServiceDate: string;
  nextServiceKm: number;
}

export interface Customer {
  id: string;
  name: string;
  type: 'Flota' | 'Particular';
  taxId: string;
  phone: string;
  email: string;
  address: string;
  vehicles: CustomerVehicle[];
}
