export type UserRole = 'supervisor' | 'technician' | 'advisor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
  avatarColor?: string;
  badge?: string;
  phone?: string;
  specialty?: string;
  assignedBay?: string;
  shift?: string;
  certification?: string;
  joinedDate?: string;
}

export interface UserAccount extends AuthUser {
  password: string;
}

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'user-1',
    name: 'Laura Giménez',
    email: 'laura.gimenez@autotaller.pro',
    username: 'laura.gimenez',
    role: 'supervisor',
    roleLabel: 'Jefa de Taller & Servicio',
    initials: 'LG',
    avatarColor: '#2563EB',
    badge: 'Supervisión Total',
    phone: '+34 612 345 678',
    specialty: 'Gestión Operativa y Control de Flotas Corporativas',
    assignedBay: 'Supervisión Central y Bahía 01',
    shift: 'Lunes a Viernes 07:30 - 16:30 (Turno A)',
    certification: 'Auditor Líder ISO 9001 & Máster en Gestión de Posventa Automotriz',
    joinedDate: 'Enero 2022',
  },
  {
    id: 'user-2',
    name: 'Mateo Castellanos',
    email: 'mateo.c@autotaller.pro',
    username: 'mateo.c',
    role: 'technician',
    roleLabel: 'Master Tech ASE L1',
    initials: 'MC',
    avatarColor: '#16A34A',
    badge: 'Técnico Especialista',
    phone: '+34 612 876 543',
    specialty: 'Diagnóstico Electrónico, Inyección Diésel Common Rail y ADAS',
    assignedBay: 'Bahía 02 · Elevador 4.0T',
    shift: 'Lunes a Viernes 08:00 - 17:00 (Turno B)',
    certification: 'ASE Master Certified L1 & Bosch High-Voltage Systems 2',
    joinedDate: 'Marzo 2023',
  },
  {
    id: 'user-3',
    name: 'Roberto Silva',
    email: 'roberto.s@autotaller.pro',
    username: 'roberto.s',
    role: 'advisor',
    roleLabel: 'Asesor Comercial & Flotas',
    initials: 'RS',
    avatarColor: '#D97706',
    badge: 'Recepción y Flotas',
    phone: '+34 612 998 877',
    specialty: 'Asesoría de Servicio y Acuerdos de Nivel de Servicio (SLA)',
    assignedBay: 'Recepción Técnica & Bahía 03',
    shift: 'Lunes a Viernes 08:30 - 17:30 (Turno A)',
    certification: 'Gestor Certificado de Flotas Comerciales & Atención al Cliente',
    joinedDate: 'Noviembre 2023',
  },
  {
    id: 'user-4',
    name: 'Admin Central',
    email: 'admin@autotaller.pro',
    username: 'admin',
    role: 'admin',
    roleLabel: 'Administrador del Sistema',
    initials: 'AD',
    avatarColor: '#7C3AED',
    badge: 'Control Global',
    phone: '+34 612 000 111',
    specialty: 'Administración de Sistemas, Configuración de Bahías e Inventario',
    assignedBay: 'Consola Central de Operaciones',
    shift: 'Disponibilidad Continua / Monitoreo',
    certification: 'Administrador Certificado de Plataformas de Taller v2.4',
    joinedDate: 'Agosto 2021',
  },
];

export const DEMO_ACCOUNTS: UserAccount[] = DEMO_USERS.map((user) => ({
  ...user,
  password: 'autotaller2026!',
}));
