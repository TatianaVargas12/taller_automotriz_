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
import { WorkOrderDrawer } from './components/WorkOrderDrawer';
import { NewWorkOrderModal } from './components/NewWorkOrderModal';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenRoute>('operations');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopFloorMode, setShopFloorMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

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
              laborLines: o.laborLines.filter((l) => l.id !== lineId),
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
            ...o.partLines,
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
          ? { ...o, partLines: o.partLines.filter((p) => p.id !== lineId) }
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
              dviItems: o.dviItems.map((item) =>
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
              checklistTasks: o.checklistTasks.map((t) =>
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
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          counts={sidebarCounts}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-900/50"
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
            />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
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
        />

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeScreen === 'operations' && (
            <OperationsView
              workOrders={workOrders}
              bays={bays}
              technicians={TECHNICIANS}
              shopFloorMode={shopFloorMode}
              onSelectOrder={(id) => setDrawerOrderId(id)}
              onOpenDvi={(id) => {
                setDviOrderId(id);
                setActiveScreen('dvi');
              }}
              onToggleTimer={handleToggleTimer}
              onUpdateStatus={handleUpdateStatus}
              onAssignOrderToBay={handleAssignOrderToBay}
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
        </main>
      </div>

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
