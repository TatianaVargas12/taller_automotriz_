import { useEffect, useState } from 'react';
import {
  INITIAL_BAYS,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_WORK_ORDERS,
  TECHNICIANS,
} from './data/mockWorkshopData';
import {
  Customer,
  CustomerVehicle,
  DviCheckItem,
  InventoryItem,
  ScreenRoute,
  ServiceBay,
  WorkOrder,
  WorkOrderStatus,
} from './types/workshop';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OperationsView } from './views/OperationsView';
import { WorkOrdersView } from './views/WorkOrdersView';
import { DviInspectionView } from './views/DviInspectionView';
import { InventoryView } from './views/InventoryView';
import { CustomersView } from './views/CustomersView';
import { ProfileView } from './views/ProfileView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ClientPortalView } from './views/ClientPortalView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { WorkOrderDrawer } from './components/WorkOrderDrawer';
import { NewWorkOrderModal } from './components/NewWorkOrderModal';
import { AuthUser, DEMO_ACCOUNTS, UserAccount } from './types/auth';
import { safeStorage } from './utils/safeStorage';

export default function App() {
  const [viewMode, setViewMode] = useState<'client' | 'admin' | 'auth' | 'operations' | 'profile'>(() => {
    // 1. Check URL hash
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash.startsWith('admin')) return 'admin';
    if (hash === 'auth' || hash === 'login' || hash === 'register') return 'auth';
    if (hash === 'operations' || hash === 'bahias') return 'operations';
    if (hash === 'profile' || hash === 'perfil') return 'profile';
    if (hash === 'client' || hash === 'inicio') return 'client';

    // 2. Check localStorage
    const saved = safeStorage.getItem('autotaller_view_mode');
    if (saved && ['client', 'admin', 'auth', 'operations', 'profile'].includes(saved)) {
      return saved as any;
    }
    return 'client';
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return safeStorage.getJSON<AuthUser | null>('autotaller_current_user', DEMO_ACCOUNTS[0]);
  });

  const [authScreen, setAuthScreen] = useState<'login' | 'register'>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'register') return 'register';
    const saved = safeStorage.getItem('autotaller_auth_screen');
    return saved === 'register' ? 'register' : 'login';
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(DEMO_ACCOUNTS);

  const [activeScreen, setActiveScreen] = useState<ScreenRoute>(() => {
    const saved = safeStorage.getItem('autotaller_active_screen');
    return (saved as ScreenRoute) || 'operations';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopFloorMode, setShopFloorMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Persist view mode and update location hash on change
  useEffect(() => {
    safeStorage.setItem('autotaller_view_mode', viewMode);
    if (viewMode === 'admin') {
      const adminTab = safeStorage.getItem('autotaller_admin_tab') || '01';
      window.history.replaceState(null, '', `#admin-${adminTab}`);
    } else if (viewMode === 'auth') {
      window.history.replaceState(null, '', `#${authScreen}`);
    } else {
      window.history.replaceState(null, '', `#${viewMode}`);
    }
  }, [viewMode, authScreen]);

  // Persist user session across reloads
  useEffect(() => {
    if (currentUser) {
      safeStorage.setJSON('autotaller_current_user', currentUser);
    } else {
      safeStorage.removeItem('autotaller_current_user');
    }
  }, [currentUser]);

  // Persist auth screen mode
  useEffect(() => {
    safeStorage.setItem('autotaller_auth_screen', authScreen);
  }, [authScreen]);

  // Persist active screen
  useEffect(() => {
    safeStorage.setItem('autotaller_active_screen', activeScreen);
  }, [activeScreen]);

  // Listen for hash changes (browser back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash.startsWith('admin')) {
        setViewMode('admin');
      } else if (hash === 'auth' || hash === 'login') {
        setAuthScreen('login');
        setViewMode('auth');
      } else if (hash === 'register') {
        setAuthScreen('register');
        setViewMode('auth');
      } else if (hash === 'operations' || hash === 'bahias') {
        setViewMode('operations');
      } else if (hash === 'profile' || hash === 'perfil') {
        setViewMode('profile');
      } else if (hash === 'client' || hash === 'inicio') {
        setViewMode('client');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [bays, setBays] = useState<ServiceBay[]>(INITIAL_BAYS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [dviOrderId, setDviOrderId] = useState<string>(INITIAL_WORK_ORDERS[0].id);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderPrefill, setNewOrderPrefill] = useState<{
    customerId: string;
    plate: string;
    vin: string;
    vehicle: string;
    mileageKm: number;
  } | null>(null);

  // Live workshop bay stopwatch ticker for running work orders
  useEffect(() => {
    const hasRunningTimer = workOrders.some((o) => o.timerRunning);
    if (!hasRunningTimer) return;

    const timer = window.setInterval(() => {
      setWorkOrders((prev) =>
        prev.map((o) =>
          o.timerRunning ? { ...o, elapsedSeconds: o.elapsedSeconds + 1 } : o
        )
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [workOrders]);

  // If global search is typed while not on orders screen, let user filter or switch smoothly
  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (val.trim().length > 0 && activeScreen === 'operations') {
      setActiveScreen('orders');
    }
  };

  const handleToggleTimer = (orderId: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, timerRunning: !o.timerRunning } : o
      )
    );
  };

  const handleUpdateStatus = (orderId: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const stopTimer =
          status === 'Finalizada/Entregada' ||
          status === 'Alerta / Cancelada' ||
          status === 'En Espera (Repuestos)';
        return {
          ...o,
          status,
          timerRunning: stopTimer ? false : o.timerRunning,
          bayId: status === 'Finalizada/Entregada' ? null : o.bayId,
        };
      })
    );

    if (status === 'Finalizada/Entregada') {
      setBays((prev) =>
        prev.map((b) =>
          b.workOrderId === orderId
            ? { ...b, workOrderId: null, status: 'Disponible' }
            : b
        )
      );
    }
  };

  const handleUpdateBay = (orderId: string, newBayId: string | null) => {
    setBays((prev) =>
      prev.map((b) => {
        if (b.workOrderId === orderId && b.id !== newBayId) {
          return { ...b, workOrderId: null, status: 'Disponible' };
        }
        if (b.id === newBayId) {
          return { ...b, workOrderId: orderId, status: 'Ocupada' };
        }
        return b;
      })
    );

    setWorkOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, bayId: newBayId } : o))
    );
  };

  const handleUpdateTechnician = (orderId: string, techId: string | null) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, technicianId: techId } : o
      )
    );
  };

  const handleAssignOrderToBay = (
    orderId: string,
    bayId: string,
    techId: string
  ) => {
    handleUpdateBay(orderId, bayId);
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              bayId,
              technicianId: techId,
              status: o.status === 'Pendiente' ? 'En Diagnóstico' : o.status,
              timerRunning: true,
            }
          : o
      )
    );
  };

  const handleReleaseBay = (bayId: string) => {
    setBays((prev) =>
      prev.map((b) =>
        b.id === bayId
          ? { ...b, workOrderId: null, status: 'Disponible' }
          : b
      )
    );
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.bayId === bayId
          ? { ...o, bayId: null, timerRunning: false }
          : o
      )
    );
  };

  const handleQuickIntakeAndAssign = (
    bayId: string,
    techId: string,
    plate: string,
    vehicle: string,
    customerId: string,
    customerName: string,
    issue: string,
    priority: WorkOrder['priority']
  ) => {
    const orderNum = Math.floor(2055 + Math.random() * 40);
    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: `OT-${orderNum}`,
      plate: plate.toUpperCase(),
      vin: `VIN-${Date.now().toString().slice(-8)}`,
      vehicle,
      mileageKm: 52000,
      fuelLevel: 75,
      customerId,
      customerName,
      customerType:
        customerName.toLowerCase().includes('s.a.') ||
        customerName.toLowerCase().includes('s.l.') ||
        customerName.toLowerCase().includes('ltda')
          ? 'Flota'
          : 'Particular',
      customerPhone: '+34 900 123 456',
      status: 'En Diagnóstico',
      priority,
      bayId,
      technicianId: techId,
      advisorName: currentUser ? currentUser.name : 'Laura Giménez',
      intakeDate: 'Hoy · Recién ingresado',
      estimatedCompletion: 'Hoy · En curso',
      elapsedSeconds: 0,
      timerRunning: true,
      reportedIssue: issue || 'Ingreso directo a bahía de servicio.',
      diagnosticNotes: 'Vehículo montado en elevador para revisión técnica.',
      checklistTasks: [
        {
          id: `t-${Date.now()}-1`,
          label: 'Inspección de elevación y puntos de apoyo',
          done: true,
        },
        {
          id: `t-${Date.now()}-2`,
          label: 'Revisión técnica y prueba de componentes',
          done: false,
        },
      ],
      dviItems: [
        {
          id: `dvi-${Date.now()}-1`,
          category: 'Frenos y Suspensión',
          label: 'Espesor pastillas de freno delanteras',
          specValue: '>= 4.0 mm',
          measuredValue: '',
          unit: 'mm',
          state: null,
          notes: '',
          diagramType: 'brakes',
        },
        {
          id: `dvi-${Date.now()}-2`,
          category: 'Neumáticos y Alineación',
          label: 'Profundidad de banda de rodadura',
          specValue: '>= 3.0 mm',
          measuredValue: '',
          unit: 'mm',
          state: null,
          notes: '',
          diagramType: 'tires',
        },
      ],
      laborLines: [],
      partLines: [],
      taxRate: 0.21,
    };

    setWorkOrders((prev) => [newOrder, ...prev]);
    setBays((prev) =>
      prev.map((b) =>
        b.id === bayId
          ? { ...b, workOrderId: newOrder.id, status: 'Ocupada' }
          : b
      )
    );
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'technician' || user.role === 'advisor') {
      setViewMode('admin');
    } else {
      setViewMode('client');
    }
  };

  const handleUpdatePassword = (identifier: string, newPassword: string) => {
    setAccounts((prev) => {
      const updated = prev.map((acc) => {
        const cleanPhone = (p?: string) => (p ? p.replace(/[\s\-\(\)]/g, '') : '');
        const inputCleanPhone = identifier.replace(/[\s\-\(\)]/g, '');
        if (
          acc.email.toLowerCase() === identifier.toLowerCase() ||
          acc.name.toLowerCase() === identifier.toLowerCase() ||
          cleanPhone(acc.phone) === inputCleanPhone ||
          (acc.username && acc.username.toLowerCase() === identifier.toLowerCase())
        ) {
          return { ...acc, password: newPassword };
        }
        return acc;
      });
      safeStorage.setJSON('autotaller_accounts', updated);
      return updated;
    });
  };

  const handleRegister = (newUser: UserAccount) => {
    setAccounts((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setViewMode('client');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthScreen('login');
    setViewMode('client');
  };

  const handleUpdateProfile = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === updatedUser.id ? { ...acc, ...updatedUser } : acc
      )
    );
  };

  const handleUpdateNotes = (orderId: string, notes: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, diagnosticNotes: notes } : o
      )
    );
  };

  const handleAddLaborLine = (
    orderId: string,
    description: string,
    hours: number,
    hourlyRate: number
  ) => {
    setWorkOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const tech = TECHNICIANS.find((t) => t.id === o.technicianId);
        return {
          ...o,
          laborLines: [
            ...o.laborLines,
            {
              id: `lab-${Date.now()}`,
              description,
              hours,
              hourlyRate,
              technicianName: tech ? tech.name : 'Taller General',
              completed: false,
            },
          ],
        };
      })
    );
  };

  const handleRemoveLaborLine = (orderId: string, lineId: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              laborLines: (o.laborLines || []).filter((l) => l.id !== lineId),
            }
          : o
      )
    );
  };

  const handleAddPartFromInventory = (
    orderId: string,
    item: InventoryItem,
    qty: number
  ) => {
    setWorkOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          partLines: [
            ...(o.partLines || []),
            {
              id: `prt-${Date.now()}`,
              sku: item.sku,
              name: item.name,
              qty,
              unitPrice: item.salePrice,
              inStock: item.stock >= qty,
            },
          ],
        };
      })
    );

    if (item.stock > 0) {
      setInventory((prev) =>
        prev.map((inv) =>
          inv.id === item.id
            ? { ...inv, stock: Math.max(0, inv.stock - qty) }
            : inv
        )
      );
    }
  };

  const handleRemovePartLine = (orderId: string, lineId: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, partLines: (o.partLines || []).filter((p) => p.id !== lineId) }
          : o
      )
    );
  };

  const handleUpdateDviItem = (
    orderId: string,
    itemId: string,
    patch: Partial<DviCheckItem>
  ) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              dviItems: (o.dviItems || []).map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              ),
            }
          : o
      )
    );
  };

  const handleToggleChecklistTask = (orderId: string, taskId: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              checklistTasks: (o.checklistTasks || []).map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : o
      )
    );
  };

  const handleAddDviFailureToEstimate = (
    orderId: string,
    item: DviCheckItem
  ) => {
    handleAddLaborLine(
      orderId,
      `Corrección DVI: ${item.label}`,
      1.2,
      75
    );
    handleUpdateDviItem(orderId, item.id, { addedToEstimate: true });
  };

  const handleAddNewDviPoint = (
    orderId: string,
    category: DviCheckItem['category'],
    label: string,
    specValue: string
  ) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              dviItems: [
                ...o.dviItems,
                {
                  id: `dvi-${Date.now()}`,
                  category,
                  label,
                  specValue,
                  measuredValue: '',
                  unit: '',
                  state: null,
                  notes: '',
                },
              ],
            }
          : o
      )
    );
  };

  const handleAdjustStock = (itemId: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item
      )
    );
  };

  const handleToggleReorder = (itemId: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, reorderRequested: !item.reorderRequested }
          : item
      )
    );
  };

  const handleAddInventoryItem = (newItem: Omit<InventoryItem, 'id'>) => {
    setInventory((prev) => [
      { ...newItem, id: `inv-${Date.now()}` },
      ...prev,
    ]);
  };

  const handleAddCustomer = (newCustomer: Omit<Customer, 'id'>) => {
    setCustomers((prev) => [
      { ...newCustomer, id: `cust-${Date.now()}` },
      ...prev,
    ]);
  };

  const handleCreateOrder = (newOrder: WorkOrder) => {
    setWorkOrders((prev) => [newOrder, ...prev]);
    if (newOrder.bayId) {
      setBays((prev) =>
        prev.map((b) =>
          b.id === newOrder.bayId
            ? { ...b, workOrderId: newOrder.id, status: 'Ocupada' }
            : b
        )
      );
    }
    setNewOrderPrefill(null);
  };

  const activeOrderForDrawer =
    workOrders.find((o) => o.id === drawerOrderId) || null;

  const sidebarCounts = {
    activeOrders: workOrders.filter(
      (o) => o.status !== 'Finalizada/Entregada' && o.status !== 'Alerta / Cancelada'
    ).length,
    pendingDvi: workOrders.filter(
      (o) =>
        o.status === 'En Diagnóstico' ||
        o.dviItems.some((d) => d.state === null)
    ).length,
    lowStock: inventory.filter((i) => i.stock <= i.minStock).length,
  };

  return (
    <div className="relative min-h-screen bg-[#F3F1EA] text-[#242720] font-['Inter',sans-serif]">
      {/* Floating View Switcher Pill */}
      <div className="fixed bottom-4 right-4 z-50 bg-[#242720] text-white p-1 shadow-2xl border border-[#45483e] flex items-center gap-1 text-xs select-none rounded-full">
        <button
          type="button"
          onClick={() => setViewMode('client')}
          className={`px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 rounded-full ${
            viewMode === 'client'
              ? 'bg-[#be401f] text-white font-semibold'
              : 'text-[#c1c3b7] hover:text-white'
          }`}
        >
          <span>🌐</span>
          <span>Web Cliente</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('admin')}
          className={`px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 rounded-full ${
            viewMode === 'admin'
              ? 'bg-[#be401f] text-white font-semibold'
              : 'text-[#c1c3b7] hover:text-white'
          }`}
        >
          <span>🛠️</span>
          <span>Administración</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('operations')}
          className={`px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 rounded-full ${
            viewMode === 'operations'
              ? 'bg-[#be401f] text-white font-semibold'
              : 'text-[#c1c3b7] hover:text-white'
          }`}
        >
          <span>⚙️</span>
          <span>Bahías / DVI</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthScreen('login');
            setViewMode('auth');
          }}
          className={`px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 rounded-full ${
            viewMode === 'auth'
              ? 'bg-[#be401f] text-white font-semibold'
              : 'text-[#c1c3b7] hover:text-white'
          }`}
        >
          <span>🔐</span>
          <span>Login</span>
        </button>
      </div>

      {/* VIEW 1: CLIENT PROTOTYPE */}
      {viewMode === 'client' && (
        <ClientPortalView
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToAdmin={() => setViewMode('admin')}
          onNavigateToProfile={() => setViewMode('profile')}
          onNavigateToLogin={() => {
            setAuthScreen('login');
            setViewMode('auth');
          }}
          onNavigateToRegister={() => {
            setAuthScreen('register');
            setViewMode('auth');
          }}
        />
      )}

      {/* VIEW 2: ADMIN PROTOTYPE */}
      {viewMode === 'admin' && (
        <AdminDashboardView
          currentUser={currentUser}
          onNavigateToClient={() => setViewMode('client')}
          onOpenNewOrder={() => {
            setNewOrderPrefill(null);
            setNewOrderOpen(true);
          }}
          onSelectOrder={(id) => setDrawerOrderId(id)}
          onLogout={handleLogout}
          onNavigateToScreen={(scr) => {
            setActiveScreen(scr as ScreenRoute);
            setViewMode('operations');
          }}
        />
      )}

      {/* VIEW 3: AUTH (Login & Register Views) */}
      {viewMode === 'auth' && (
        <div className="min-h-screen w-full flex">
          {authScreen === 'login' ? (
            <LoginView
              onLogin={handleLogin}
              onNavigateToRegister={() => setAuthScreen('register')}
              onNavigateToClient={() => setViewMode('client')}
              accounts={accounts}
              onUpdatePassword={handleUpdatePassword}
            />
          ) : (
            <RegisterView
              onRegister={handleRegister}
              onNavigateToLogin={() => setAuthScreen('login')}
              onNavigateToClient={() => setViewMode('client')}
              accounts={accounts}
            />
          )}
        </div>
      )}

      {/* VIEW 5: USER PROFILE VIEW (Visualizar y modificar información del perfil) */}
      {viewMode === 'profile' && currentUser && (
        <div className="min-h-screen bg-[#F3F1EA] text-[#242720] font-['Inter',sans-serif]">
          <header className="w-full border-b border-[#d4d3c9] bg-[#f3f1ea] px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <span className="font-['Barlow_Condensed',sans-serif] font-bold text-2xl tracking-tight text-[#242720] uppercase">
                AutoTaller
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-[#e5e3d9] text-[#62645c] font-semibold">
                Perfil de Usuario
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('client')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#be401f] hover:text-[#9e3116] transition-colors cursor-pointer"
            >
              <span>← Volver a la página principal</span>
            </button>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <ProfileView
              currentUser={currentUser}
              workOrders={workOrders}
              bays={bays}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onNavigate={(screen) => {
                setActiveScreen(screen);
                setViewMode('operations');
              }}
              onBack={() => setViewMode('client')}
            />
          </main>
        </div>
      )}

      {/* VIEW 4: DEEP WORKSHOP OPERATIONS (Elevadores, DVI, Inventario, Clientes) */}
      {viewMode === 'operations' && (
        <div className="min-h-screen flex bg-[#F3F1EA] text-[#242720]">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex">
            <Sidebar
              activeScreen={activeScreen}
              onNavigate={setActiveScreen}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
              counts={sidebarCounts}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-50 lg:hidden flex bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="flex h-full">
                <Sidebar
                  activeScreen={activeScreen}
                  onNavigate={(screen) => {
                    setActiveScreen(screen);
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                  onToggleCollapse={() => setMobileMenuOpen(false)}
                  counts={sidebarCounts}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          )}

          {/* Main Content Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Quick top bar back to Admin Dashboard */}
            <div className="bg-[#242720] text-[#c1c3b7] text-xs px-6 py-1.5 flex items-center justify-between border-b border-[#45483e]">
              <span>Módulo Técnico Avanzado de Bahías y Diagnóstico</span>
              <button
                type="button"
                onClick={() => setViewMode('admin')}
                className="text-white hover:text-[#e8a38a] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>← Volver al Panel de Resumen</span>
              </button>
            </div>

            <TopBar
              activeScreen={activeScreen}
              globalSearch={globalSearch}
              onGlobalSearchChange={handleGlobalSearchChange}
              shopFloorMode={shopFloorMode}
              onToggleShopFloorMode={() => setShopFloorMode((m) => !m)}
              onOpenNewOrder={() => {
                setNewOrderPrefill(null);
                setNewOrderOpen(true);
              }}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              currentUser={currentUser}
              onLogout={handleLogout}
              onNavigate={setActiveScreen}
            />

            <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
              {activeScreen === 'operations' && (
                <OperationsView
                  workOrders={workOrders}
                  bays={bays}
                  technicians={TECHNICIANS}
                  customers={customers}
                  shopFloorMode={shopFloorMode}
                  onSelectOrder={(id) => setDrawerOrderId(id)}
                  onOpenDvi={(id) => {
                    setDviOrderId(id);
                    setActiveScreen('dvi');
                  }}
                  onToggleTimer={handleToggleTimer}
                  onUpdateStatus={handleUpdateStatus}
                  onAssignOrderToBay={handleAssignOrderToBay}
                  onReleaseBay={handleReleaseBay}
                  onQuickIntakeAndAssign={handleQuickIntakeAndAssign}
                />
              )}

              {activeScreen === 'orders' && (
                <WorkOrdersView
                  workOrders={workOrders}
                  bays={bays}
                  technicians={TECHNICIANS}
                  globalSearch={globalSearch}
                  shopFloorMode={shopFloorMode}
                  onSelectOrder={(id) => setDrawerOrderId(id)}
                  onOpenDvi={(id) => {
                    setDviOrderId(id);
                    setActiveScreen('dvi');
                  }}
                  onClearGlobalSearch={() => setGlobalSearch('')}
                />
              )}

              {activeScreen === 'dvi' && (
                <DviInspectionView
                  workOrders={workOrders}
                  selectedOrderId={dviOrderId}
                  shopFloorMode={shopFloorMode}
                  onSelectOrderId={setDviOrderId}
                  onUpdateDviItem={handleUpdateDviItem}
                  onToggleChecklistTask={handleToggleChecklistTask}
                  onAddDviFailureToEstimate={handleAddDviFailureToEstimate}
                  onAddNewDviPoint={handleAddNewDviPoint}
                />
              )}

              {activeScreen === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  shopFloorMode={shopFloorMode}
                  onAdjustStock={handleAdjustStock}
                  onToggleReorder={handleToggleReorder}
                  onAddInventoryItem={handleAddInventoryItem}
                />
              )}

              {activeScreen === 'customers' && (
                <CustomersView
                  customers={customers}
                  workOrders={workOrders}
                  shopFloorMode={shopFloorMode}
                  onSelectOrder={(id) => setDrawerOrderId(id)}
                  onCreateOrderForVehicle={(
                    customer: Customer,
                    veh: CustomerVehicle
                  ) => {
                    setNewOrderPrefill({
                      customerId: customer.id,
                      plate: veh.plate,
                      vin: veh.vin,
                      vehicle: `${veh.year} ${veh.make} ${veh.model}`,
                      mileageKm: veh.mileageKm,
                    });
                    setNewOrderOpen(true);
                  }}
                  onAddCustomer={handleAddCustomer}
                />
              )}

              {activeScreen === 'profile' && currentUser && (
                <ProfileView
                  currentUser={currentUser}
                  workOrders={workOrders}
                  bays={bays}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                  onNavigate={setActiveScreen}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Work Order Slide-Over Detail Drawer */}
      <WorkOrderDrawer
        order={activeOrderForDrawer}
        bays={bays}
        technicians={TECHNICIANS}
        inventory={inventory}
        onClose={() => setDrawerOrderId(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateBay={handleUpdateBay}
        onUpdateTechnician={handleUpdateTechnician}
        onToggleTimer={handleToggleTimer}
        onUpdateNotes={handleUpdateNotes}
        onAddLaborLine={handleAddLaborLine}
        onRemoveLaborLine={handleRemoveLaborLine}
        onAddPartFromInventory={handleAddPartFromInventory}
        onRemovePartLine={handleRemovePartLine}
        onOpenDvi={(id) => {
          setDviOrderId(id);
          setActiveScreen('dvi');
          setViewMode('operations');
        }}
      />

      {/* New Work Order Modal */}
      <NewWorkOrderModal
        key={newOrderPrefill ? newOrderPrefill.plate : 'blank-order'}
        open={newOrderOpen}
        customers={customers}
        bays={bays}
        technicians={TECHNICIANS}
        prefill={newOrderPrefill}
        onClose={() => {
          setNewOrderOpen(false);
          setNewOrderPrefill(null);
        }}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  );
}
