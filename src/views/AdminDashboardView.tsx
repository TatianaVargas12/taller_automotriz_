import { useState, useEffect } from 'react';
import { AuthUser } from '../types/auth';
import { safeStorage } from '../utils/safeStorage';

interface AdminDashboardViewProps {
  currentUser?: AuthUser | null;
  onNavigateToClient: () => void;
  onOpenNewOrder: () => void;
  onSelectOrder?: (orderId: string) => void;
  onLogout: () => void;
  onNavigateToScreen?: (screen: string) => void;
  initialNav?: string;
}

export function AdminDashboardView({
  currentUser,
  onNavigateToClient,
  onOpenNewOrder,
  onSelectOrder,
  onLogout,
  onNavigateToScreen,
  initialNav = '01',
}: AdminDashboardViewProps) {
  // Navigation tabs: '01' (Resumen), '02' (Citas), '03' (Órdenes), '04' (Clientes), '05' (Presupuestos), '06' (Facturación), 'ajustes'
  const [selectedNav, setSelectedNav] = useState(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash.startsWith('admin-')) {
      const tab = hash.replace('admin-', '');
      if (['01', '02', '03', '04', '05', '06', 'ajustes'].includes(tab)) {
        return tab;
      }
    }
    const saved = safeStorage.getItem('autotaller_admin_tab');
    if (saved && ['01', '02', '03', '04', '05', '06', 'ajustes'].includes(saved)) {
      return saved;
    }
    return initialNav;
  });

  useEffect(() => {
    safeStorage.setItem('autotaller_admin_tab', selectedNav);
    window.history.replaceState(null, '', `#admin-${selectedNav}`);
  }, [selectedNav]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash.startsWith('admin-')) {
        const tab = hash.replace('admin-', '');
        if (['01', '02', '03', '04', '05', '06', 'ajustes'].includes(tab)) {
          setSelectedNav(tab);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // States for 01 Resumen
  const [resumenTab, setResumenTab] = useState<'curso' | 'entregados'>(() => {
    const saved = safeStorage.getItem('autotaller_resumen_tab');
    return saved === 'entregados' ? 'entregados' : 'curso';
  });
  useEffect(() => {
    safeStorage.setItem('autotaller_resumen_tab', resumenTab);
  }, [resumenTab]);

  const [selectedTech, setSelectedTech] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // States for 02 Citas
  const [citasPeriod, setCitasPeriod] = useState<'dia' | 'semana' | 'mes'>(() => {
    const saved = safeStorage.getItem('autotaller_citas_period');
    return (saved as any) || 'dia';
  });
  useEffect(() => {
    safeStorage.setItem('autotaller_citas_period', citasPeriod);
  }, [citasPeriod]);

  const [selectedCitaId, setSelectedCitaId] = useState<string>('c-7'); // María Sánchez default

  // States for 03 Órdenes de trabajo
  const [ordenesView, setOrdenesView] = useState<'tablero' | 'lista'>(() => {
    const saved = safeStorage.getItem('autotaller_ordenes_view');
    return (saved as any) || 'tablero';
  });
  useEffect(() => {
    safeStorage.setItem('autotaller_ordenes_view', ordenesView);
  }, [ordenesView]);

  // States for 04 Clientes
  const [selectedClientId, setSelectedClientId] = useState<string>('cl-1');
  const [clientSearch, setClientSearch] = useState<string>('');

  // States for 05 Presupuestos
  const [presupuestoTab, setPresupuestoTab] = useState<'todos' | 'aprobar'>('todos');
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<string>('p-1044');

  // States for 06 Facturación
  const [facturaTab, setFacturaTab] = useState<'todas' | 'pendientes' | 'pagadas'>('todas');
  const [selectedFacturaId, setSelectedFacturaId] = useState<string>('f-088');

  // States for Ajustes
  const [ajustesTab, setAjustesTab] = useState<'general' | 'seguridad' | 'integraciones'>('general');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Exact data from Figma Frame 3:2
  const figmaOrders = [
    {
      id: '#1042',
      client: 'Javier Martín',
      vehicle: 'Seat León · 4821 LKM',
      work: 'Cambio de aceite y filtros',
      status: 'En reparación',
      statusBg: 'bg-[#e3e8da]',
      statusText: 'text-[#415232]',
      tech: 'Pablo',
      delivery: 'Hoy, 13:00',
      highlighted: true,
      delivered: false,
    },
    {
      id: '#1043',
      client: 'Lucía García',
      vehicle: 'Renault Clio · 7193 JTR',
      work: 'Testigo de motor encendido',
      status: 'En diagnosis',
      statusBg: 'bg-[#e9e7dd]',
      statusText: 'text-[#62604e]',
      tech: 'Marcos',
      delivery: 'Por confirmar',
      highlighted: false,
      delivered: false,
    },
    {
      id: '#1044',
      client: 'Ana López',
      vehicle: 'Ford Focus · 2356 KPB',
      work: 'Sustitución de embrague',
      status: 'Por aprobar',
      statusBg: 'bg-[#f4e0d5]',
      statusText: 'text-[#9d351c]',
      tech: 'Pablo',
      delivery: 'Por confirmar',
      highlighted: false,
      delivered: false,
    },
    {
      id: '#1045',
      client: 'Carlos Ruiz',
      vehicle: 'VW Golf · 8902 HNB',
      work: 'Pastillas y discos delanteros',
      status: 'Listo para entregar',
      statusBg: 'bg-[#dfe9de]',
      statusText: 'text-[#365838]',
      tech: 'Marcos',
      delivery: 'Hoy, 12:30',
      highlighted: false,
      delivered: false,
    },
    {
      id: '#1046',
      client: 'Elena Torres',
      vehicle: 'Peugeot 208 · 5640 MFC',
      work: 'Ruido en la suspensión',
      status: 'En diagnosis',
      statusBg: 'bg-[#e9e7dd]',
      statusText: 'text-[#62604e]',
      tech: 'Pablo',
      delivery: 'Por confirmar',
      highlighted: false,
      delivered: false,
    },
    {
      id: '#1041',
      client: 'Roberto Méndez',
      vehicle: 'Audi A4 · 1289 KST',
      work: 'Inspección DVI y alineación',
      status: 'Entregado',
      statusBg: 'bg-[#e2e8f0]',
      statusText: 'text-[#475569]',
      tech: 'Pablo',
      delivery: 'Ayer, 18:30',
      highlighted: false,
      delivered: true,
    },
  ];

  // Filtering for 01 Resumen table
  const filteredOrders = figmaOrders.filter((order) => {
    if (resumenTab === 'curso' && order.delivered) return false;
    if (resumenTab === 'entregados' && !order.delivered) return false;
    if (selectedTech !== 'todos' && order.tech.toLowerCase() !== selectedTech.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        order.id.toLowerCase().includes(q) ||
        order.client.toLowerCase().includes(q) ||
        order.vehicle.toLowerCase().includes(q) ||
        order.work.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Data for 02 Citas (Frame 13:2)
  const citasData = [
    { id: 'c-1', hora: '08:00', cliente: 'Javier Martín', vehiculo: 'Seat León · 4821 LKM', motivo: 'Aceite y filtros', estado: 'Recibida', statusBg: 'bg-[#e9e7dd]', statusText: 'text-[#62645c]', tech: 'Pablo', box: 'Elevador 1' },
    { id: 'c-2', hora: '09:00', cliente: 'Lucía García', vehiculo: 'Renault Clio · 7193 JTR', motivo: 'Diagnosis de motor', estado: 'Recibida', statusBg: 'bg-[#e9e7dd]', statusText: 'text-[#62645c]', tech: 'Marcos', box: 'Bahía 2' },
    { id: 'c-3', hora: '09:30', cliente: 'Ana López', vehiculo: 'Ford Focus · 2356 KPB', motivo: 'Revisión de embrague', estado: 'Recibida', statusBg: 'bg-[#e9e7dd]', statusText: 'text-[#62645c]', tech: 'Pablo', box: 'Elevador 3' },
    { id: 'c-4', hora: '10:00', cliente: 'Carlos Ruiz', vehiculo: 'VW Golf · 8902 HNB', motivo: 'Frenos delanteros', estado: 'Recibida', statusBg: 'bg-[#e9e7dd]', statusText: 'text-[#62645c]', tech: 'Marcos', box: 'Elevador 4' },
    { id: 'c-5', hora: '10:30', cliente: 'Elena Torres', vehiculo: 'Peugeot 208 · 5640 MFC', motivo: 'Ruido en suspensión', estado: 'Recibida', statusBg: 'bg-[#e9e7dd]', statusText: 'text-[#62645c]', tech: 'Pablo', box: 'Fosa 5' },
    { id: 'c-6', hora: '12:30', cliente: 'Carlos Ruiz', vehiculo: 'VW Golf · 8902 HNB', motivo: 'Entrega de vehículo', estado: 'Confirmada', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', tech: 'Marcos', box: 'Zona Entrega' },
    { id: 'c-7', hora: '13:00', cliente: 'María Sánchez', vehiculo: 'Toyota Yaris · 3175 LPR', motivo: 'Revisión anual', estado: 'Confirmada', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', tech: 'Pablo', box: 'Elevador 1' },
    { id: 'c-8', hora: '16:00', cliente: 'Sergio Díaz', vehiculo: 'Opel Corsa · 6248 KST', motivo: 'Diagnosis electrónica', estado: 'Por confirmar', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', tech: 'Marcos', box: 'Recepción' },
  ];

  const selectedCita = citasData.find((c) => c.id === selectedCitaId) || citasData[6];

  // Data for 04 Clientes (Frame 13:342)
  const clientsData = [
    { id: 'cl-1', name: 'Javier Martín', car: 'Seat León · 4821 LKM', state: 'En taller', phone: '611 234 567', email: 'javier.martin@example.com', address: 'Calle Mayor 14, Madrid', plate: '4821 LKM', year: 2021, make: 'Seat', model: 'León 1.5 TSI', mileage: '42.100 km', totalServices: 4 },
    { id: 'cl-2', name: 'Lucía García', car: 'Renault Clio · 7193 JTR', state: 'En taller', phone: '622 345 678', email: 'lucia.garcia@example.com', address: 'Av. América 45, Madrid', plate: '7193 JTR', year: 2020, make: 'Renault', model: 'Clio 0.9 TCe', mileage: '68.900 km', totalServices: 2 },
    { id: 'cl-3', name: 'Ana López', car: 'Ford Focus · 2356 KPB', state: 'En taller', phone: '633 456 789', email: 'ana.lopez@example.com', address: 'Paseo Castellana 112, Madrid', plate: '2356 KPB', year: 2019, make: 'Ford', model: 'Focus 1.5 TDCi', mileage: '148.200 km', totalServices: 6 },
    { id: 'cl-4', name: 'Carlos Ruiz', car: 'VW Golf · 8902 HNB', state: 'En taller', phone: '644 567 890', email: 'carlos.ruiz@example.com', address: 'Calle Alcalá 280, Madrid', plate: '8902 HNB', year: 2021, make: 'Volkswagen', model: 'Golf 2.0 TDI', mileage: '98.400 km', totalServices: 5 },
    { id: 'cl-5', name: 'Elena Torres', car: 'Peugeot 208 · 5640 MFC', state: 'En taller', phone: '655 678 901', email: 'elena.torres@example.com', address: 'Calle Goya 73, Madrid', plate: '5640 MFC', year: 2022, make: 'Peugeot', model: '208 1.2 PureTech', mileage: '31.200 km', totalServices: 1 },
    { id: 'cl-6', name: 'María Sánchez', car: 'Toyota Yaris · 3175 LPR', state: 'Cita hoy', phone: '666 789 012', email: 'maria.sanchez@example.com', address: 'Calle Serrano 18, Madrid', plate: '3175 LPR', year: 2022, make: 'Toyota', model: 'Yaris Hybrid', mileage: '24.500 km', totalServices: 3 },
  ];

  const selectedClient = clientsData.find((c) => c.id === selectedClientId) || clientsData[0];

  // Data for 05 Presupuestos (Frame 13:512)
  const presupuestosData = [
    { id: 'p-1044', num: '#P-1044', client: 'Ana López', vehicle: 'Ford Focus · 2356 KPB', date: 'Hoy, 09:15', total: '680,00 €', subtotal: '680,00 €', iva: '142,80 €', totalConIva: '822,80 €', estado: 'Por aprobar', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', items: [{ name: 'Kit Embrague + Volante Bimasa LuK OEM', qty: 1, price: '387,50 €' }, { name: 'Mano de obra desmontaje y sustitución (4.5h x 65€)', qty: 1, price: '292,50 €' }] },
    { id: 'p-1048', num: '#P-1048', client: 'Marta Romero', vehicle: 'Citroën C3 · 9021 KMD', date: 'Ayer, 17:30', total: '245,00 €', subtotal: '245,00 €', iva: '51,45 €', totalConIva: '296,45 €', estado: 'Por aprobar', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', items: [{ name: 'Juego de amortiguadores delanteros Monroe', qty: 1, price: '165,00 €' }, { name: 'Mano de obra alineación y montaje (1.2h x 65€)', qty: 1, price: '80,00 €' }] },
    { id: 'p-1049', num: '#P-1049', client: 'Diego Navarro', vehicle: 'Seat Ibiza · 3314 JHG', date: '14 nov.', total: '128,00 €', subtotal: '128,00 €', iva: '26,88 €', totalConIva: '154,88 €', estado: 'Por aprobar', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', items: [{ name: 'Batería 70Ah Start-Stop Varta', qty: 1, price: '98,00 €' }, { name: 'Codificación BMS y sustitución', qty: 1, price: '30,00 €' }] },
    { id: 'p-1042', num: '#P-1042', client: 'Javier Martín', vehicle: 'Seat León · 4821 LKM', date: 'Hoy, 08:30', total: '151,50 €', subtotal: '151,50 €', iva: '31,81 €', totalConIva: '183,31 €', estado: 'Aceptado', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', items: [{ name: 'Aceite Sintético 5W-30 (5L)', qty: 1, price: '68,00 €' }, { name: 'Filtro aceite + habitáculo', qty: 1, price: '28,50 €' }, { name: 'Mano de obra cambio y revisión', qty: 1, price: '55,00 €' }] },
    { id: 'p-1045', num: '#P-1045', client: 'Carlos Ruiz', vehicle: 'VW Golf · 8902 HNB', date: 'Hoy, 09:00', total: '233,05 €', subtotal: '233,05 €', iva: '48,94 €', totalConIva: '281,99 €', estado: 'Aceptado', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', items: [{ name: 'Pastillas y discos Brembo 330mm', qty: 1, price: '168,05 €' }, { name: 'Mano de obra sustitución y purga', qty: 1, price: '65,00 €' }] },
  ];

  const selectedPresupuesto = presupuestosData.find((p) => p.id === selectedPresupuestoId) || presupuestosData[0];

  // Data for 06 Facturación (Frame 13:682)
  const facturasData = [
    { id: 'f-089', num: 'F-2026-089', client: 'Carlos Ruiz', fecha: 'Hoy, 12:40', base: '233,05 €', total: '281,89 €', estado: 'Pagada', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', method: 'Tarjeta TPV', items: 'Pastillas y discos delanteros' },
    { id: 'f-088', num: 'F-2026-088', client: 'Javier Martín', fecha: 'Hoy, 11:30', base: '151,50 €', total: '183,31 €', estado: 'Pendiente', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', method: 'Al recoger', items: 'Cambio de aceite y filtros' },
    { id: 'f-087', num: 'F-2026-087', client: 'Elena Torres', fecha: 'Ayer, 18:00', base: '264,46 €', total: '320,00 €', estado: 'Pendiente', statusBg: 'bg-[#f4e0d5]', statusText: 'text-[#9d351c]', method: 'Transferencia', items: 'Diagnosis y amortiguador' },
    { id: 'f-086', num: 'F-2026-086', client: 'Roberto Méndez', fecha: '12 nov.', base: '314,05 €', total: '380,00 €', estado: 'Pagada', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', method: 'Bizum Empresas', items: 'Inspección DVI y alineación' },
    { id: 'f-085', num: 'F-2026-085', client: 'Logística Express', fecha: '10 nov.', base: '266,00 €', total: '321,86 €', estado: 'Pagada', statusBg: 'bg-[#dfe9de]', statusText: 'text-[#365838]', method: 'Transferencia 30d', items: 'Mantenimiento flota Ford Transit' },
  ];

  const selectedFactura = facturasData.find((f) => f.id === selectedFacturaId) || facturasData[1];

  const handleSaveSettings = () => {
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
  };

  return (
    <div className="bg-[#f3f1ea] text-[#242720] min-h-screen w-full flex flex-col font-['Inter',sans-serif]">
      {/* Top Demo Bar */}
      <div className="bg-[#242720] text-[#c1c3b7] text-xs px-4 sm:px-8 py-2 flex items-center justify-between border-b border-[#45483e]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#be401f]"></span>
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Gestión del Taller
          </span>
          <span className="hidden md:inline text-[#a5a89a]">
            | {selectedNav === '01' ? 'Resumen' :
               selectedNav === '02' ? 'Citas' :
               selectedNav === '03' ? 'Órdenes de trabajo' :
               selectedNav === '04' ? 'Clientes y vehículos' :
               selectedNav === '05' ? 'Presupuestos' :
               selectedNav === '06' ? 'Facturación' :
               'Ajustes del taller'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToClient}
            className="flex items-center gap-1.5 text-white hover:text-[#e8a38a] font-medium transition-colors bg-[#3a3d32] hover:bg-[#484b3e] px-3.5 py-1 text-xs cursor-pointer rounded-full"
          >
            <span>Ver Web Pública (Cliente)</span>
            <span>↗</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-37px)]">
        {/* Sidebar */}
        <aside className="w-[232px] shrink-0 bg-[#242720] text-[#f3f1ea] flex flex-col justify-between hidden md:flex border-r border-[#45483e] select-none">
          <div>
            {/* Brand Header */}
            <div className="p-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#be401f] text-white font-bold flex items-center justify-center font-['Barlow_Condensed',sans-serif] text-xl shadow-sm shrink-0">
                  AP
                </div>
                <div>
                  <h1 className="font-['Barlow_Condensed',sans-serif] font-bold text-[22px] leading-[24px] text-[#f3f1ea] tracking-tight">
                    AUTOTALLER PRO
                  </h1>
                  <p className="text-[9px] font-medium text-[#c1c3b7] tracking-[0.16em] uppercase mt-0.5">
                    GESTIÓN DEL TALLER
                  </p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="mx-6 h-px bg-[#45483e] mb-6"></div>

            {/* Section Tag */}
            <div className="px-6 mb-3">
              <p className="text-[10px] font-medium text-[#c1c3b7] tracking-[0.16em] uppercase">
                ESPACIO DE TRABAJO
              </p>
            </div>

            {/* Nav Menu */}
            <nav className="flex flex-col px-3 space-y-1">
              {/* 01 Resumen */}
              <button
                onClick={() => setSelectedNav('01')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '01' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '01' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '01' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  01
                </span>
                <span className={`text-[13px] ${selectedNav === '01' ? 'font-semibold' : 'font-normal'}`}>
                  Resumen
                </span>
              </button>

              {/* 02 Citas */}
              <button
                onClick={() => setSelectedNav('02')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '02' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '02' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '02' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  02
                </span>
                <span className={`text-[13px] ${selectedNav === '02' ? 'font-semibold' : 'font-normal'}`}>
                  Citas
                </span>
              </button>

              {/* 03 Órdenes de trabajo */}
              <button
                onClick={() => setSelectedNav('03')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '03' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '03' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '03' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  03
                </span>
                <span className={`text-[13px] ${selectedNav === '03' ? 'font-semibold' : 'font-normal'}`}>
                  Órdenes de trabajo
                </span>
              </button>

              {/* 04 Clientes y vehículos */}
              <button
                onClick={() => setSelectedNav('04')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '04' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '04' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '04' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  04
                </span>
                <span className={`text-[13px] ${selectedNav === '04' ? 'font-semibold' : 'font-normal'}`}>
                  Clientes y vehículos
                </span>
              </button>

              {/* 05 Presupuestos */}
              <button
                onClick={() => setSelectedNav('05')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '05' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '05' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '05' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  05
                </span>
                <span className={`text-[13px] ${selectedNav === '05' ? 'font-semibold' : 'font-normal'}`}>
                  Presupuestos
                </span>
              </button>

              {/* 06 Facturación */}
              <button
                onClick={() => setSelectedNav('06')}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  selectedNav === '06' ? 'bg-[#3a3d32] text-[#fbfaf6]' : 'text-[#d0d1c6] hover:bg-[#2c3028]'
                }`}
              >
                {selectedNav === '06' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#be401f]" />}
                <span className={`text-[10px] font-mono font-medium ${selectedNav === '06' ? 'text-[#e8a38a]' : 'text-[#a5a89a]'}`}>
                  06
                </span>
                <span className={`text-[13px] ${selectedNav === '06' ? 'font-semibold' : 'font-normal'}`}>
                  Facturación
                </span>
              </button>
            </nav>

            <div className="mx-6 h-px bg-[#45483e] my-5"></div>

            <div className="px-6">
              <button
                onClick={() => setSelectedNav('ajustes')}
                className={`text-[13px] transition-colors cursor-pointer py-1 block w-full text-left ${
                  selectedNav === 'ajustes' ? 'text-white font-semibold' : 'text-[#d0d1c6] hover:text-white'
                }`}
              >
                Ajustes del taller
              </button>
            </div>
          </div>

          {/* Bottom Area */}
          <div className="p-6">
            <button
              onClick={onNavigateToClient}
              className="text-[#f3f1ea] hover:text-[#be401f] text-[13px] font-medium flex items-center gap-2 mb-4 transition-colors cursor-pointer"
            >
              <span>Ver página web</span>
              <span className="text-sm">↗</span>
            </button>

            <div className="h-px bg-[#45483e] mb-4"></div>

            <div>
              <p className="text-[#f3f1ea] text-[13px] font-semibold">
                {currentUser?.name || 'Administrador'}
              </p>
              <button
                onClick={onLogout}
                className="text-[#c1c3b7] hover:text-[#be401f] text-[12px] mt-1 transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main Work Surface */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f3f1ea]">
          {/* Barra Superior */}
          <header className="h-[80px] bg-[#fbfaf6] border-b border-[#d4d3c9] flex items-center justify-between px-6 sm:px-10 shrink-0">
            {/* Breadcrumb */}
            <div className="text-[13px] text-[#62645c] flex items-center gap-2">
              <span onClick={() => setSelectedNav('01')} className="hover:text-[#242720] cursor-pointer">Panel de administración</span>
              <span className="text-[#a5a89a]">/</span>
              <span className="text-[#242720] font-medium">
                {selectedNav === '01' ? 'Resumen' :
                 selectedNav === '02' ? 'Citas' :
                 selectedNav === '03' ? 'Órdenes de trabajo' :
                 selectedNav === '04' ? 'Clientes y vehículos' :
                 selectedNav === '05' ? 'Presupuestos' :
                 selectedNav === '06' ? 'Facturación' :
                 'Ajustes del taller'}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar matrícula, cliente u orden…"
                  className="bg-[#f3f1ea] border border-[#d4d3c9] focus:border-[#be401f] text-[#242720] placeholder-[#62645c] text-[13px] px-3.5 py-2 w-[240px] sm:w-[360px] outline-none transition-colors"
                />
              </div>

              {/* Ayuda */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-[13px] text-[#242720] font-medium hover:text-[#be401f] transition-colors cursor-pointer hidden sm:inline"
              >
                Ayuda
              </button>

              <div className="h-[26px] w-px bg-[#d4d3c9] hidden sm:block"></div>

              {/* Admin Profile */}
              <div className="flex flex-col text-right">
                <span className="text-[13px] font-semibold text-[#242720] leading-tight">
                  {currentUser?.name || 'Administrador'}
                </span>
                <span className="text-[10px] text-[#62645c] leading-tight mt-0.5">
                  Acceso completo
                </span>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT PER TAB */}
          <main className="flex-1 p-6 sm:p-10 max-w-[1440px] w-full mx-auto space-y-8">

            {/* ========================================= */}
            {/* VIEW 01: RESUMEN (Figma Frame 3:2)        */}
            {/* ========================================= */}
            {selectedNav === '01' && (
              <>
                <section className="flex flex-col space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        LUNES, 16 DE NOVIEMBRE DE 2026
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[44px] leading-[46px] tracking-tight uppercase">
                        EL TALLER, DE UN VISTAZO.
                      </h2>
                    </div>

                    <button
                      onClick={onOpenNewOrder}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span className="text-base leading-none">+</span>
                      <span>Nueva orden</span>
                    </button>
                  </div>

                  {/* 4 KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div onClick={() => setSelectedNav('02')} className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-5 shadow-xs flex flex-col justify-between h-[116px] cursor-pointer hover:border-[#242720] transition-colors">
                      <p className="text-[12px] font-medium text-[#62645c]">Citas de hoy</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[46px] leading-none text-[#242720]">8</span>
                        <span className="text-[11px] font-medium text-[#62645c]">3 por recibir</span>
                      </div>
                    </div>

                    <div onClick={() => setSelectedNav('03')} className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-5 shadow-xs flex flex-col justify-between h-[116px] cursor-pointer hover:border-[#242720] transition-colors">
                      <p className="text-[12px] font-medium text-[#62645c]">Vehículos en taller</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[46px] leading-none text-[#242720]">5</span>
                        <span className="text-[11px] font-medium text-[#62645c]">2 en diagnosis</span>
                      </div>
                    </div>

                    <div onClick={() => setSelectedNav('05')} className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-5 shadow-xs flex flex-col justify-between h-[116px] cursor-pointer hover:border-[#242720] transition-colors">
                      <p className="text-[12px] font-medium text-[#62645c]">Por aprobar</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[46px] leading-none text-[#242720]">3</span>
                        <span className="text-[11px] font-medium text-[#be401f]">Presupuestos enviados</span>
                      </div>
                    </div>

                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-5 shadow-xs flex flex-col justify-between h-[116px]">
                      <p className="text-[12px] font-medium text-[#62645c]">Listos para entregar</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[46px] leading-none text-[#242720]">1</span>
                        <span className="text-[11px] font-medium text-[#62645c]">Cliente avisado</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Table Section */}
                <section className="bg-[#fbfaf6] border border-[#d4d3c9] shadow-xs">
                  <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[26px] text-[#242720] tracking-tight">
                        VEHÍCULOS EN TALLER
                      </h3>
                      <button
                        onClick={() => setSelectedNav('03')}
                        className="text-[#be401f] text-[12px] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Ver todas las órdenes</span>
                        <span>↗</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#deded4] gap-3">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setResumenTab('curso')}
                          className={`relative pb-3 text-[13px] font-semibold transition-colors cursor-pointer ${
                            resumenTab === 'curso' ? 'text-[#242720]' : 'text-[#62645c] hover:text-[#242720]'
                          }`}
                        >
                          En curso (5)
                          {resumenTab === 'curso' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#be401f]" />}
                        </button>
                        <button
                          onClick={() => setResumenTab('entregados')}
                          className={`relative pb-3 text-[13px] font-normal transition-colors cursor-pointer ${
                            resumenTab === 'entregados' ? 'text-[#242720] font-semibold' : 'text-[#62645c] hover:text-[#242720]'
                          }`}
                        >
                          Entregados
                          {resumenTab === 'entregados' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#be401f]" />}
                        </button>
                      </div>

                      <div className="relative pb-2">
                        <button
                          onClick={() => setShowTechDropdown(!showTechDropdown)}
                          className="text-[12px] text-[#62645c] hover:text-[#242720] flex items-center gap-1 font-normal cursor-pointer"
                        >
                          <span>{selectedTech === 'todos' ? 'Todos los técnicos' : `Técnico: ${selectedTech}`}</span>
                          <span>↓</span>
                        </button>
                        {showTechDropdown && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-[#d4d3c9] shadow-md z-20 py-1 w-44 text-xs">
                            <button onClick={() => { setSelectedTech('todos'); setShowTechDropdown(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f3f1ea]">Todos los técnicos</button>
                            <button onClick={() => { setSelectedTech('Pablo'); setShowTechDropdown(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f3f1ea]">Pablo</button>
                            <button onClick={() => { setSelectedTech('Marcos'); setShowTechDropdown(false); }} className="w-full text-left px-3 py-1.5 hover:bg-[#f3f1ea]">Marcos</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#eeeee6] text-[#62645c] text-[10px] font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-6 font-semibold w-24">ORDEN</th>
                          <th className="py-2.5 px-6 font-semibold">CLIENTE / VEHÍCULO</th>
                          <th className="py-2.5 px-6 font-semibold">TRABAJO</th>
                          <th className="py-2.5 px-6 font-semibold">ESTADO</th>
                          <th className="py-2.5 px-6 font-semibold">TÉCNICO</th>
                          <th className="py-2.5 px-6 font-semibold">ENTREGA</th>
                          <th className="py-2.5 px-6 font-semibold text-right w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#deded4]">
                        {filteredOrders.map((ord) => (
                          <tr
                            key={ord.id}
                            onClick={() => { if (onSelectOrder) onSelectOrder(ord.id); }}
                            className={`hover:bg-[#f6f5ef] transition-colors cursor-pointer group ${ord.highlighted ? 'bg-[#f6f5ef]' : ''}`}
                          >
                            <td className="py-3 px-6 text-[12px] font-medium text-[#62645c] font-mono">{ord.id}</td>
                            <td className="py-3 px-6">
                              <p className="text-[13px] font-semibold text-[#242720] leading-snug">{ord.client}</p>
                              <p className="text-[11px] text-[#62645c] leading-snug">{ord.vehicle}</p>
                            </td>
                            <td className="py-3 px-6 text-[12px] text-[#242720]">{ord.work}</td>
                            <td className="py-3 px-6">
                              <span className={`inline-block px-3 py-1 text-[11px] font-medium ${ord.statusBg} ${ord.statusText}`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-[12px] text-[#242720]">{ord.tech}</td>
                            <td className="py-3 px-6 text-[12px] text-[#62645c]">{ord.delivery}</td>
                            <td className="py-3 px-6 text-right text-[18px] text-[#62645c] group-hover:text-[#be401f] transition-colors">↗</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Bottom Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Próximas Citas */}
                  <div className="lg:col-span-7 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-[#deded4] mb-4">
                        <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[26px] text-[#242720] tracking-tight">PRÓXIMAS CITAS</h3>
                        <button onClick={() => setSelectedNav('02')} className="text-[#be401f] text-[12px] font-semibold hover:underline cursor-pointer flex items-center gap-1">
                          <span>Abrir agenda</span>
                          <span>↗</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                          <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[20px] text-[#242720] w-14">12:30</span>
                          <div className="w-[2px] h-9 bg-[#be401f]" />
                          <div>
                            <p className="text-[13px] font-semibold text-[#242720]">Carlos Ruiz</p>
                            <p className="text-[11px] text-[#62645c]">VW Golf · Entrega de vehículo</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#62645c]">Confirmada</span>
                      </div>
                      <div className="ml-20 border-b border-[#deded4]"></div>

                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                          <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[20px] text-[#242720] w-14">13:00</span>
                          <div className="w-[2px] h-9 bg-[#deded4]" />
                          <div>
                            <p className="text-[13px] font-semibold text-[#242720]">María Sánchez</p>
                            <p className="text-[11px] text-[#62645c]">Toyota Yaris · Revisión anual</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#62645c]">Confirmada</span>
                      </div>
                      <div className="ml-20 border-b border-[#deded4]"></div>

                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                          <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[20px] text-[#242720] w-14">16:00</span>
                          <div className="w-[2px] h-9 bg-[#deded4]" />
                          <div>
                            <p className="text-[13px] font-semibold text-[#242720]">Sergio Díaz</p>
                            <p className="text-[11px] text-[#62645c]">Opel Corsa · Diagnosis</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#be401f]">Por confirmar</span>
                      </div>
                    </div>
                  </div>

                  {/* Presupuestos Pendientes */}
                  <div className="lg:col-span-5 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="pb-3 border-b border-[#deded4] mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[25px] text-[#242720] tracking-tight">PENDIENTES DE APROBACIÓN</h3>
                          <p className="text-[11px] text-[#62645c] mt-0.5">3 presupuestos esperando respuesta</p>
                        </div>
                        <button onClick={() => setSelectedNav('05')} className="text-[#be401f] text-xs font-semibold hover:underline">Ver todos ↗</button>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-[#deded4]">
                        <div>
                          <p className="text-[13px] font-semibold text-[#242720]">Ana López</p>
                          <p className="text-[11px] text-[#62645c]">Ford Focus · Enviado hoy</p>
                        </div>
                        <span className="text-[14px] font-semibold text-[#242720] font-mono">680,00 €</span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-[#deded4]">
                        <div>
                          <p className="text-[13px] font-semibold text-[#242720]">Marta Romero</p>
                          <p className="text-[11px] text-[#62645c]">Citroën C3 · Enviado ayer</p>
                        </div>
                        <span className="text-[14px] font-semibold text-[#242720] font-mono">245,00 €</span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-[13px] font-semibold text-[#242720]">Diego Navarro</p>
                          <p className="text-[11px] text-[#62645c]">Seat Ibiza · Hace 2 días</p>
                        </div>
                        <span className="text-[14px] font-semibold text-[#242720] font-mono">128,00 €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========================================= */}
            {/* VIEW 02: CITAS (Figma Frame 13:2)         */}
            {/* ========================================= */}
            {selectedNav === '02' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / CITAS
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        LA AGENDA DEL TALLER.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Organiza las entradas, las entregas y el tiempo de tu equipo.
                      </p>
                    </div>

                    <button
                      onClick={() => alert('Nueva Cita: Abre ventana para programar una recepción o entrega.')}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>+</span>
                      <span>Nueva cita</span>
                    </button>
                  </div>

                  {/* 4 KPIs Citas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">8</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Citas de hoy</span>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">5</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Entradas recibidas</span>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">2</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Próximas confirmadas</span>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">1</span>
                      <span className="text-[12px] font-medium text-[#be401f]">Por confirmar</span>
                    </div>
                  </div>
                </section>

                {/* Agenda Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Table Agenda */}
                  <div className="lg:col-span-8 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#deded4] mb-4">
                      <div>
                        <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-[25px] text-[#242720]">
                          LUNES 16 DE NOVIEMBRE
                        </h3>
                        <p className="text-xs text-[#62645c]">‹ &nbsp; Hoy &nbsp; ›</p>
                      </div>

                      <div className="flex items-center border border-[#d4d3c9] bg-[#fbfaf6] text-xs rounded-full p-0.5">
                        <button
                          onClick={() => setCitasPeriod('dia')}
                          className={`px-3.5 py-1.5 font-medium transition-colors cursor-pointer rounded-full ${
                            citasPeriod === 'dia' ? 'bg-[#242720] text-white font-semibold' : 'text-[#62645c] hover:text-[#242720]'
                          }`}
                        >
                          Día
                        </button>
                        <button
                          onClick={() => setCitasPeriod('semana')}
                          className={`px-3.5 py-1.5 font-medium transition-colors cursor-pointer rounded-full ${
                            citasPeriod === 'semana' ? 'bg-[#242720] text-white font-semibold' : 'text-[#62645c] hover:text-[#242720]'
                          }`}
                        >
                          Semana
                        </button>
                        <button
                          onClick={() => setCitasPeriod('mes')}
                          className={`px-3.5 py-1.5 font-medium transition-colors cursor-pointer rounded-full ${
                            citasPeriod === 'mes' ? 'bg-[#242720] text-white font-semibold' : 'text-[#62645c] hover:text-[#242720]'
                          }`}
                        >
                          Mes
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#eeeee6] text-[#62645c] text-[10px] font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-20">HORA</th>
                            <th className="py-2.5 px-4">CLIENTE / VEHÍCULO</th>
                            <th className="py-2.5 px-4">MOTIVO</th>
                            <th className="py-2.5 px-4">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#deded4]">
                          {citasData.map((c) => (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCitaId(c.id)}
                              className={`hover:bg-[#f6f5ef] transition-colors cursor-pointer ${
                                selectedCitaId === c.id ? 'bg-[#f1e7de]' : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-['Barlow_Condensed',sans-serif] font-bold text-base text-[#242720]">{c.hora}</td>
                              <td className="py-3 px-4">
                                <p className="text-[13px] font-semibold text-[#242720]">{c.cliente}</p>
                                <p className="text-[11px] text-[#62645c]">{c.vehiculo}</p>
                              </td>
                              <td className="py-3 px-4 text-xs text-[#242720]">{c.motivo}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-3 py-1 text-[11px] font-medium ${c.statusBg} ${c.statusText}`}>
                                  {c.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Detail Card for Selected Cita */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs">
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-wider uppercase mb-1">
                        CITA SELECCIONADA
                      </p>
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-[29px] leading-tight text-[#242720] uppercase mb-2">
                        {selectedCita.cliente}
                      </h4>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold ${selectedCita.statusBg} ${selectedCita.statusText} mb-4`}>
                        {selectedCita.estado}
                      </span>

                      <div className="space-y-3 text-xs text-[#242720] border-t border-[#deded4] pt-4">
                        <div>
                          <p className="text-[10px] font-bold text-[#62645c] uppercase">Horario</p>
                          <p className="font-semibold text-sm">Lunes 16 nov. · {selectedCita.hora}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#62645c] uppercase">Vehículo</p>
                          <p className="font-semibold text-sm">{selectedCita.vehiculo}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#62645c] uppercase">Trabajo / Motivo</p>
                          <p className="text-sm">{selectedCita.motivo}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#62645c] uppercase">Asignación</p>
                          <p className="text-xs text-[#62645c]">Asignada a {selectedCita.tech} · {selectedCita.box}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#deded4] flex flex-col gap-2">
                        <button
                          onClick={() => alert(`Editando cita de ${selectedCita.cliente}`)}
                          className="w-full bg-[#242720] hover:bg-[#3a3d32] text-white text-xs font-semibold py-2.5 px-6 transition-colors cursor-pointer text-center rounded-full"
                        >
                          Editar cita
                        </button>
                        <button
                          onClick={() => alert(`Cancelando cita de ${selectedCita.cliente}`)}
                          className="w-full text-[#be401f] hover:underline text-xs font-medium py-1 text-center cursor-pointer"
                        >
                          Cancelar cita
                        </button>
                      </div>
                    </div>

                    {/* Menos Ausencias Card */}
                    <div className="bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720] uppercase mb-1">
                        MENOS AUSENCIAS.
                      </h4>
                      <p className="text-xs text-[#62645c] mb-3">
                        Recordatorio por correo 24 h antes. Solo para clientes con consentimiento.
                      </p>
                      <span className="inline-block px-3 py-1 text-[11px] font-medium bg-[#dfe9de] text-[#365838] mb-3">
                        Recordatorios activos
                      </span>
                      <button className="text-xs font-semibold text-[#be401f] hover:underline block cursor-pointer">
                        Configurar avisos ↗
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================================================= */}
            {/* VIEW 03: ÓRDENES DE TRABAJO (Figma Frame 13:172) */}
            {/* ================================================= */}
            {selectedNav === '03' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / ÓRDENES DE TRABAJO
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        CADA COCHE, EN SU PUNTO.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Sigue cada reparación, desde la recepción hasta la entrega.
                      </p>
                    </div>

                    <button
                      onClick={onOpenNewOrder}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>+</span>
                      <span>Nueva orden</span>
                    </button>
                  </div>

                  {/* View Controls */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#deded4]">
                    <div className="flex items-center border border-[#d4d3c9] bg-[#fbfaf6] text-xs rounded-full p-0.5">
                      <button
                        onClick={() => setOrdenesView('tablero')}
                        className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer rounded-full ${
                          ordenesView === 'tablero' ? 'bg-[#242720] text-white' : 'text-[#62645c] hover:text-[#242720]'
                        }`}
                      >
                        Tablero
                      </button>
                      <button
                        onClick={() => setOrdenesView('lista')}
                        className={`px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer rounded-full ${
                          ordenesView === 'lista' ? 'bg-[#242720] text-white' : 'text-[#62645c] hover:text-[#242720]'
                        }`}
                      >
                        Lista
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#62645c]">
                      <span>Todos los técnicos ↓</span>
                      <span>Prioridad: todas ↓</span>
                    </div>
                  </div>
                </section>

                {/* 4 Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Columna: En diagnosis */}
                  <div className="bg-[#e9e9e0] p-4 flex flex-col gap-3 min-h-[464px] border-t-3 border-[#242720]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4d3c9]">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-lg text-[#242720]">En diagnosis</h4>
                      <span className="text-xs font-semibold text-[#62645c] bg-white px-2 py-0.5">2</span>
                    </div>

                    {/* Card #1043 */}
                    <div
                      onClick={() => onSelectOrder && onSelectOrder('#1043')}
                      className="bg-[#fbfaf6] p-4 border border-[#d4d3c9] shadow-xs hover:border-[#be401f] transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#62645c]">#1043</span>
                        <span className="text-xs text-[#62645c] group-hover:text-[#be401f]">↗</span>
                      </div>
                      <p className="font-semibold text-sm text-[#242720]">Lucía García</p>
                      <p className="text-xs text-[#62645c]">Renault Clio · 7193 JTR</p>
                      <p className="text-xs text-[#242720]">Testigo de motor encendido</p>
                      <span className="inline-block bg-[#f4e0d5] text-[#9d351c] text-[10px] font-medium px-2 py-0.5">
                        Revisar código de avería
                      </span>
                      <p className="text-[10px] text-[#62645c] pt-2 border-t border-[#deded4]">Marcos · Sin fecha</p>
                    </div>

                    {/* Card #1046 */}
                    <div
                      onClick={() => onSelectOrder && onSelectOrder('#1046')}
                      className="bg-[#fbfaf6] p-4 border border-[#d4d3c9] shadow-xs hover:border-[#be401f] transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#62645c]">#1046</span>
                        <span className="text-xs text-[#62645c] group-hover:text-[#be401f]">↗</span>
                      </div>
                      <p className="font-semibold text-sm text-[#242720]">Elena Torres</p>
                      <p className="text-xs text-[#62645c]">Peugeot 208 · 5640 MFC</p>
                      <p className="text-xs text-[#242720]">Ruido en la suspensión</p>
                      <span className="inline-block bg-[#e9e7dd] text-[#62604e] text-[10px] font-medium px-2 py-0.5">
                        Comprobar holguras
                      </span>
                      <p className="text-[10px] text-[#62645c] pt-2 border-t border-[#deded4]">Pablo · Sin fecha</p>
                    </div>
                  </div>

                  {/* Columna: En reparación */}
                  <div className="bg-[#e9e9e0] p-4 flex flex-col gap-3 min-h-[464px] border-t-3 border-[#415232]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4d3c9]">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-lg text-[#242720]">En reparación</h4>
                      <span className="text-xs font-semibold text-[#62645c] bg-white px-2 py-0.5">1</span>
                    </div>

                    <div
                      onClick={() => onSelectOrder && onSelectOrder('#1042')}
                      className="bg-[#fbfaf6] p-4 border border-[#d4d3c9] shadow-xs hover:border-[#be401f] transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#62645c]">#1042</span>
                        <span className="text-xs text-[#62645c] group-hover:text-[#be401f]">↗</span>
                      </div>
                      <p className="font-semibold text-sm text-[#242720]">Javier Martín</p>
                      <p className="text-xs text-[#62645c]">Seat León · 4821 LKM</p>
                      <p className="text-xs text-[#242720]">Cambio de aceite y filtros</p>
                      <span className="inline-block bg-[#e3e8da] text-[#415232] text-[10px] font-medium px-2 py-0.5">
                        En elevador 1 · 70%
                      </span>
                      <p className="text-[10px] text-[#62645c] pt-2 border-t border-[#deded4]">Pablo · Hoy, 13:00</p>
                    </div>
                  </div>

                  {/* Columna: Por aprobar */}
                  <div className="bg-[#e9e9e0] p-4 flex flex-col gap-3 min-h-[464px] border-t-3 border-[#be401f]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4d3c9]">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-lg text-[#242720]">Por aprobar</h4>
                      <span className="text-xs font-semibold text-[#62645c] bg-white px-2 py-0.5">1</span>
                    </div>

                    <div
                      onClick={() => onSelectOrder && onSelectOrder('#1044')}
                      className="bg-[#fbfaf6] p-4 border border-[#d4d3c9] shadow-xs hover:border-[#be401f] transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#62645c]">#1044</span>
                        <span className="text-xs text-[#62645c] group-hover:text-[#be401f]">↗</span>
                      </div>
                      <p className="font-semibold text-sm text-[#242720]">Ana López</p>
                      <p className="text-xs text-[#62645c]">Ford Focus · 2356 KPB</p>
                      <p className="text-xs text-[#242720]">Sustitución de embrague</p>
                      <span className="inline-block bg-[#f4e0d5] text-[#9d351c] text-[10px] font-medium px-2 py-0.5">
                        Presupuesto: 680,00 €
                      </span>
                      <p className="text-[10px] text-[#62645c] pt-2 border-t border-[#deded4]">Pablo · Esperando cliente</p>
                    </div>
                  </div>

                  {/* Columna: Listo para entregar */}
                  <div className="bg-[#e9e9e0] p-4 flex flex-col gap-3 min-h-[464px] border-t-3 border-[#365838]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d4d3c9]">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-lg text-[#242720]">Listo para entregar</h4>
                      <span className="text-xs font-semibold text-[#62645c] bg-white px-2 py-0.5">1</span>
                    </div>

                    <div
                      onClick={() => onSelectOrder && onSelectOrder('#1045')}
                      className="bg-[#fbfaf6] p-4 border border-[#d4d3c9] shadow-xs hover:border-[#be401f] transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#62645c]">#1045</span>
                        <span className="text-xs text-[#62645c] group-hover:text-[#be401f]">↗</span>
                      </div>
                      <p className="font-semibold text-sm text-[#242720]">Carlos Ruiz</p>
                      <p className="text-xs text-[#62645c]">VW Golf · 8902 HNB</p>
                      <p className="text-xs text-[#242720]">Pastillas y discos delanteros</p>
                      <span className="inline-block bg-[#dfe9de] text-[#365838] text-[10px] font-medium px-2 py-0.5">
                        Cliente avisado 12:30
                      </span>
                      <p className="text-[10px] text-[#62645c] pt-2 border-t border-[#deded4]">Marcos · Hoy, 12:30</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* VIEW 04: CLIENTES Y VEHÍCULOS (Figma Frame 13:342)        */}
            {/* ======================================================== */}
            {selectedNav === '04' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / CLIENTES Y VEHÍCULOS
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        PERSONAS Y COCHES, CON HISTORIA.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Todos sus datos, revisiones y reparaciones en un mismo sitio.
                      </p>
                    </div>

                    <button
                      onClick={() => alert('Nuevo Cliente: Registra los datos de contacto y matrícula del vehículo.')}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>+</span>
                      <span>Nuevo cliente</span>
                    </button>
                  </div>

                  {/* 3 KPIs Clientes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">128</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Clientes registrados</span>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">168</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Vehículos vinculados</span>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[78px] flex items-center gap-4">
                      <span className="font-['Barlow_Condensed',sans-serif] font-bold text-[36px] text-[#242720]">12</span>
                      <span className="text-[12px] font-medium text-[#62645c]">Revisiones próximas</span>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Directory */}
                  <div className="lg:col-span-5 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs">
                    <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720] mb-4">
                      CLIENTES
                    </h3>

                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Nombre, teléfono o matrícula…"
                      className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mb-4"
                    />

                    <div className="space-y-1">
                      {clientsData
                        .filter((cl) => cl.name.toLowerCase().includes(clientSearch.toLowerCase()) || cl.car.toLowerCase().includes(clientSearch.toLowerCase()))
                        .map((cl) => (
                          <div
                            key={cl.id}
                            onClick={() => setSelectedClientId(cl.id)}
                            className={`p-3 border-l-3 transition-colors cursor-pointer flex items-center justify-between ${
                              selectedClientId === cl.id
                                ? 'bg-[#f1e7de] border-[#be401f]'
                                : 'border-transparent hover:bg-[#f6f5ef]'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#242720]">{cl.name}</p>
                              <p className="text-xs text-[#62645c]">{cl.car}</p>
                            </div>
                            <span className="text-[11px] text-[#62645c] font-medium">{cl.state}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right Detail Card */}
                  <div className="lg:col-span-7 bg-[#fbfaf6] border border-[#d4d3c9] p-8 shadow-xs space-y-6">
                    <div className="flex items-start justify-between border-b border-[#deded4] pb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-[#be401f] tracking-wider uppercase font-mono">FICHA DE CLIENTE</span>
                        <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl text-[#242720] uppercase mt-1">
                          {selectedClient.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => alert(`Creando orden directa para ${selectedClient.name}`)}
                        className="bg-[#242720] hover:bg-[#be401f] text-white text-xs font-semibold px-5 py-2.5 transition-colors cursor-pointer rounded-full"
                      >
                        + Crear orden para este cliente
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#f3f1ea] p-4 border border-[#d4d3c9]">
                        <p className="font-bold text-[#62645c] uppercase text-[10px]">Teléfono</p>
                        <p className="font-semibold text-sm mt-0.5">{selectedClient.phone}</p>
                      </div>
                      <div className="bg-[#f3f1ea] p-4 border border-[#d4d3c9]">
                        <p className="font-bold text-[#62645c] uppercase text-[10px]">Correo Electrónico</p>
                        <p className="font-semibold text-sm mt-0.5">{selectedClient.email}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-xl text-[#242720] mb-2 uppercase">
                        Vehículo Principal
                      </h4>
                      <div className="bg-[#f3f1ea] p-4 border border-[#d4d3c9] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-[#242720]">{selectedClient.make} {selectedClient.model}</p>
                          <p className="text-xs text-[#62645c]">Matrícula: {selectedClient.plate} · Año: {selectedClient.year} · Kilómetros: {selectedClient.mileage}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#be401f] bg-[#f4e0d5] px-2.5 py-1">Activo</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#deded4]">
                      <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-xl text-[#242720] mb-2 uppercase">
                        Historial de Intervenciones
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-white border border-[#deded4] flex justify-between">
                          <div>
                            <span className="font-mono font-bold text-[#62645c]">#1042</span>
                            <span className="ml-2 font-semibold">Cambio de aceite y filtros</span>
                          </div>
                          <span className="text-[#415232] font-semibold">En reparación (Hoy)</span>
                        </div>
                        <div className="p-3 bg-white border border-[#deded4] flex justify-between text-[#62645c]">
                          <div>
                            <span className="font-mono font-bold">#0891</span>
                            <span className="ml-2">Revisión anual y pastillas de freno</span>
                          </div>
                          <span>Finalizada · 15 Mar 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* VIEW 05: PRESUPUESTOS (Figma Frame 13:512)               */}
            {/* ======================================================== */}
            {selectedNav === '05' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / PRESUPUESTOS
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        TODO CLARO ANTES DE EMPEZAR.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Prepara, envía y sigue cada presupuesto sin perder el hilo.
                      </p>
                    </div>

                    <button
                      onClick={() => alert('Crear Presupuesto: Abre asistente de cálculo de repuestos y horas MO.')}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>+</span>
                      <span>Crear presupuesto</span>
                    </button>
                  </div>

                  {/* 4 KPIs Presupuestos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Por aprobar · 3</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">1.053,00 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Aceptados · 2</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">465,20 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Borrador · 1</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">98,00 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Rechazado · 1</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">210,00 €</p>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left List of Presupuestos */}
                  <div className="lg:col-span-7 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#deded4] mb-4">
                      <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720]">PRESUPUESTOS</h3>
                      <div className="flex gap-4 text-xs font-semibold">
                        <button
                          onClick={() => setPresupuestoTab('todos')}
                          className={`pb-1 border-b-2 ${presupuestoTab === 'todos' ? 'border-[#be401f] text-[#242720]' : 'border-transparent text-[#62645c]'}`}
                        >
                          Todos (7)
                        </button>
                        <button
                          onClick={() => setPresupuestoTab('aprobar')}
                          className={`pb-1 border-b-2 ${presupuestoTab === 'aprobar' ? 'border-[#be401f] text-[#242720]' : 'border-transparent text-[#62645c]'}`}
                        >
                          Por aprobar (3)
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#eeeee6] text-[#62645c] text-[10px] font-semibold uppercase">
                          <th className="py-2.5 px-4">N.º / CLIENTE</th>
                          <th className="py-2.5 px-4">TOTAL</th>
                          <th className="py-2.5 px-4">ESTADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#deded4]">
                        {presupuestosData
                          .filter((p) => (presupuestoTab === 'aprobar' ? p.estado === 'Por aprobar' : true))
                          .map((p) => (
                            <tr
                              key={p.id}
                              onClick={() => setSelectedPresupuestoId(p.id)}
                              className={`hover:bg-[#f6f5ef] transition-colors cursor-pointer ${
                                selectedPresupuestoId === p.id ? 'bg-[#f1e7de]' : ''
                              }`}
                            >
                              <td className="py-3 px-4">
                                <span className="font-mono text-xs text-[#62645c] font-bold">{p.num}</span>
                                <p className="text-sm font-semibold text-[#242720]">{p.client}</p>
                                <p className="text-xs text-[#62645c]">{p.vehicle}</p>
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-sm text-[#242720]">{p.total}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold ${p.statusBg} ${p.statusText}`}>
                                  {p.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Detail Presupuesto */}
                  <div className="lg:col-span-5 bg-[#fbfaf6] border border-[#d4d3c9] p-8 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="border-b border-[#deded4] pb-4 mb-4">
                        <span className="text-[11px] font-semibold text-[#be401f] uppercase tracking-wider font-mono">
                          {selectedPresupuesto.num} · {selectedPresupuesto.date}
                        </span>
                        <h4 className="font-['Barlow_Condensed',sans-serif] font-bold text-3xl text-[#242720] uppercase mt-1">
                          {selectedPresupuesto.client}
                        </h4>
                        <p className="text-xs text-[#62645c]">{selectedPresupuesto.vehicle}</p>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[11px] font-bold uppercase text-[#62645c]">Partidas y Repuestos</p>
                        <div className="space-y-2 text-xs divide-y divide-[#deded4]">
                          {selectedPresupuesto.items.map((it, idx) => (
                            <div key={idx} className="pt-2 flex justify-between">
                              <span className="text-[#242720]">{it.name}</span>
                              <span className="font-mono font-semibold">{it.price}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-[#242720] space-y-1 text-xs">
                          <div className="flex justify-between text-[#62645c]">
                            <span>Base Imponible</span>
                            <span className="font-mono">{selectedPresupuesto.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-[#62645c]">
                            <span>IVA (21%)</span>
                            <span className="font-mono">{selectedPresupuesto.iva}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-[#242720] pt-2 border-t border-[#deded4]">
                            <span>TOTAL PRESUPUESTO</span>
                            <span className="font-mono">{selectedPresupuesto.totalConIva}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-[#deded4] space-y-2">
                      <button
                        onClick={() => alert(`Enviando presupuesto ${selectedPresupuesto.num} a ${selectedPresupuesto.client}`)}
                        className="w-full bg-[#be401f] hover:bg-[#a63417] text-white text-xs font-semibold py-3 transition-colors cursor-pointer rounded-full"
                      >
                        Enviar al cliente por WhatsApp / Email
                      </button>
                      <button
                        onClick={() => alert(`Aprobando presupuesto manualmente`)}
                        className="w-full bg-[#242720] hover:bg-[#3a3d32] text-white text-xs font-semibold py-3 px-6 transition-colors cursor-pointer rounded-full"
                      >
                        Aprobar Presupuesto
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* VIEW 06: FACTURACIÓN (Figma Frame 13:682)                 */}
            {/* ======================================================== */}
            {selectedNav === '06' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / FACTURACIÓN
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        LAS CUENTAS, AL DÍA.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Controla las facturas, los cobros y lo que queda por ingresar.
                      </p>
                    </div>

                    <button
                      onClick={() => alert('Nueva Factura: Emite factura para orden de trabajo entregada.')}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>+</span>
                      <span>Nueva factura</span>
                    </button>
                  </div>

                  {/* 4 KPIs Facturación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Facturado · noviembre</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">1.486,30 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Cobrado · noviembre</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">983,30 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Pendiente de cobro</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#242720]">503,00 €</p>
                    </div>
                    <div className="bg-[#fbfaf6] border-t border-[#d4d3c9] p-4 h-[88px] flex flex-col justify-between">
                      <p className="text-[11px] font-medium text-[#62645c]">Vencido · incluido en pendiente</p>
                      <p className="font-['Barlow_Condensed',sans-serif] font-bold text-[32px] text-[#be401f]">183,00 €</p>
                    </div>
                  </div>
                </section>

                {/* Invoices Table */}
                <section className="bg-[#fbfaf6] border border-[#d4d3c9] shadow-xs">
                  <div className="p-6 pb-0 flex items-center justify-between border-b border-[#deded4]">
                    <div className="flex gap-6 text-xs font-semibold pb-3">
                      <button
                        onClick={() => setFacturaTab('todas')}
                        className={`pb-1 border-b-2 ${facturaTab === 'todas' ? 'border-[#be401f] text-[#242720]' : 'border-transparent text-[#62645c]'}`}
                      >
                        Todas (6)
                      </button>
                      <button
                        onClick={() => setFacturaTab('pendientes')}
                        className={`pb-1 border-b-2 ${facturaTab === 'pendientes' ? 'border-[#be401f] text-[#242720]' : 'border-transparent text-[#62645c]'}`}
                      >
                        Pendientes (2)
                      </button>
                      <button
                        onClick={() => setFacturaTab('pagadas')}
                        className={`pb-1 border-b-2 ${facturaTab === 'pagadas' ? 'border-[#be401f] text-[#242720]' : 'border-transparent text-[#62645c]'}`}
                      >
                        Pagadas (4)
                      </button>
                    </div>

                    <button
                      onClick={() => alert('Exportando libro de facturas en CSV...')}
                      className="text-[#be401f] text-xs font-semibold hover:underline"
                    >
                      Exportar CSV ↓
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#eeeee6] text-[#62645c] text-[10px] font-semibold uppercase">
                          <th className="py-2.5 px-6">FACTURA</th>
                          <th className="py-2.5 px-6">CLIENTE</th>
                          <th className="py-2.5 px-6">EMISIÓN</th>
                          <th className="py-2.5 px-6">BASE</th>
                          <th className="py-2.5 px-6">TOTAL</th>
                          <th className="py-2.5 px-6">ESTADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#deded4]">
                        {facturasData
                          .filter((f) => {
                            if (facturaTab === 'pendientes') return f.estado === 'Pendiente';
                            if (facturaTab === 'pagadas') return f.estado === 'Pagada';
                            return true;
                          })
                          .map((f) => (
                            <tr
                              key={f.id}
                              onClick={() => setSelectedFacturaId(f.id)}
                              className={`hover:bg-[#f6f5ef] transition-colors cursor-pointer ${
                                selectedFacturaId === f.id ? 'bg-[#f1e7de]' : ''
                              }`}
                            >
                              <td className="py-3 px-6 font-mono font-bold text-xs text-[#242720]">{f.num}</td>
                              <td className="py-3 px-6 text-sm font-semibold text-[#242720]">{f.client}</td>
                              <td className="py-3 px-6 text-xs text-[#62645c]">{f.fecha}</td>
                              <td className="py-3 px-6 font-mono text-xs text-[#62645c]">{f.base}</td>
                              <td className="py-3 px-6 font-mono font-bold text-sm text-[#242720]">{f.total}</td>
                              <td className="py-3 px-6">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold ${f.statusBg} ${f.statusText}`}>
                                  {f.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* ======================================================== */}
            {/* VIEW AJUSTES DEL TALLER (Figma Frame 13:852)              */}
            {/* ======================================================== */}
            {selectedNav === 'ajustes' && (
              <>
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-[#be401f] text-[11px] font-semibold tracking-[0.08em] uppercase mb-1">
                        GESTIÓN / AJUSTES DEL TALLER
                      </p>
                      <h2 className="font-['Barlow_Condensed',sans-serif] font-bold text-[#242720] text-3xl sm:text-[42px] leading-[57px] tracking-tight uppercase">
                        EL TALLER, A TU MANERA.
                      </h2>
                      <p className="text-[#62645c] text-[14px]">
                        Configura tus datos, horarios, equipo y preferencias.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="bg-[#be401f] hover:bg-[#a63417] text-white font-semibold text-[13px] px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm rounded-full"
                    >
                      <span>Guardar cambios</span>
                    </button>
                  </div>

                  {savedSettingsNotice && (
                    <div className="p-3 bg-emerald-50 border-l-3 border-emerald-600 text-emerald-800 text-xs font-medium">
                      ✓ Ajustes actualizados y guardados correctamente en el sistema.
                    </div>
                  )}

                  {/* Tabs Ajustes */}
                  <div className="flex items-center gap-8 border-b border-[#deded4] text-xs font-semibold pb-3">
                    <button
                      onClick={() => setAjustesTab('general')}
                      className={`pb-1 ${ajustesTab === 'general' ? 'text-[#242720] border-b-2 border-[#be401f]' : 'text-[#62645c]'}`}
                    >
                      Configuración general
                    </button>
                    <button
                      onClick={() => setAjustesTab('seguridad')}
                      className={`pb-1 ${ajustesTab === 'seguridad' ? 'text-[#242720] border-b-2 border-[#be401f]' : 'text-[#62645c]'}`}
                    >
                      Seguridad y acceso
                    </button>
                    <button
                      onClick={() => setAjustesTab('integraciones')}
                      className={`pb-1 ${ajustesTab === 'integraciones' ? 'text-[#242720] border-b-2 border-[#be401f]' : 'text-[#62645c]'}`}
                    >
                      Integraciones
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Datos del taller */}
                  <div className="lg:col-span-8 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs space-y-5">
                    <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720] uppercase">
                      DATOS DEL TALLER
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Nombre Comercial</label>
                        <input
                          type="text"
                          defaultValue="Autotaller Pro"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Razón Social</label>
                        <input
                          type="text"
                          defaultValue="Autotaller Pro, S.L."
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">NIF / CIF</label>
                        <input
                          type="text"
                          defaultValue="B00000000"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Teléfono</label>
                        <input
                          type="text"
                          defaultValue="600 000 100"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Correo de Contacto</label>
                        <input
                          type="email"
                          defaultValue="hola@autotallerpro.example"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#62645c] uppercase">Dirección Postal</label>
                      <input
                        type="text"
                        defaultValue="Polígono Industrial El Olivo, Nave 4, 28021 Madrid"
                        className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2.5 text-xs text-[#242720] outline-none mt-1"
                      />
                    </div>
                  </div>

                  {/* Horario y capacidad */}
                  <div className="lg:col-span-4 bg-[#fbfaf6] border border-[#d4d3c9] p-6 shadow-xs space-y-4">
                    <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720] uppercase">
                      HORARIO Y CAPACIDAD
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Lunes a Viernes</label>
                        <input
                          type="text"
                          defaultValue="08:00 - 19:00"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Sábados</label>
                        <input
                          type="text"
                          defaultValue="09:00 - 14:00 (Bajo cita previa)"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#62645c] uppercase">Elevadores Operativos</label>
                        <input
                          type="number"
                          defaultValue="6"
                          className="w-full bg-[#f3f1ea] border border-[#d4d3c9] p-2 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footer de estado oficial */}
            <div className="flex items-center justify-between text-[#62645c] pt-4 text-[11px]">
              <span className="font-medium tracking-wide">
                AUTOTALLER PRO &nbsp;/&nbsp; ADMINISTRACIÓN
              </span>
              <span>
                Datos de ejemplo · 16 nov. 2026
              </span>
            </div>
          </main>
        </div>
      </div>

      {/* Modal Ayuda */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fbfaf6] border border-[#d4d3c9] max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#deded4]">
              <h3 className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl text-[#242720]">
                Ayuda del Sistema
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-[#62645c] hover:text-[#242720] text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm text-[#62645c]">
              <p>
                <strong>AutoTaller Pro Administración</strong> te permite supervisar en tiempo real todas las bahías, órdenes de servicio, diagnosis electrónica y presupuestos pendientes.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Usa el menú lateral para saltar entre Citas, Órdenes, Clientes, Presupuestos y Facturación.</li>
                <li>Haz clic en cualquier orden de la tabla para abrir el detalle completo.</li>
                <li>Usa <strong>+ Nueva orden</strong> para dar entrada inmediata a un vehículo.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-[#242720] hover:bg-[#be401f] text-white text-xs font-semibold px-6 py-2.5 transition-colors cursor-pointer rounded-full"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
