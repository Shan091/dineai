import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import SplashLanding from './components/SplashLanding';
import KitchenDisplay from './components/KitchenDisplay';
import ServiceDashboard from './components/ServiceDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import { CartItem } from './components/SmartCart';
import SmartMenu from './components/SmartMenu';
import { api } from './services/api';
// import { playSound } from './utils/SoundManager'; // Handled by Context
import { RestaurantProvider, useRestaurant, OrderTicket, OrderStatus } from './context/RestaurantContext';
import { MenuItem } from './components/data';

// Inner Component to use Router Hooks & Context
const AppContent: React.FC = () => {
  // Consume Context
  const {
    tickets,
    refreshOrders,
    placeOrder, // Consumed from Context
    isOffline,
    // Audio is handled internally in Context but we can expose mute if needed
    // but StaffNavbar handles it now.
    menuItems,
    isMenuLoading,
    menuError,
    isAppLoading
  } = useRestaurant();

  const location = useLocation();
  const navigate = useNavigate();


  const { guestSession } = useRestaurant();

  const handleProfileClick = () => {
    if (!guestSession || guestSession.name === 'Guest') navigate('/');
    else navigate('/profile');
  };

  // --- GLOBAL APP LOADER ---
  if (isAppLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-semibold text-orange-600 animate-pulse">
            Loading Dine AI...
          </div>
        </div>
      </div>
    );
  }

  // Legacy State for Kitchen/Service Mute...

  // --- 2. GUEST ACTIONS ---
  const handleGuestPlaceOrder = async (items: CartItem[], guestName: string, tableId: string) => {
    const payload = {
      tableId: Number(tableId),
      guestName,
      totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
        price: i.price
      })),
      type: 'food' as const
    };

    try {
      // Use Context Action for Immediate State Update
      await placeOrder(payload);
      // await refreshOrders(); // Optional now, as context updates local state immediately

      // Guest wants success sound.
      new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(e => console.error(e));
    } catch (e) {
      alert("Failed to place order. Check connection.");
    }
  };

  const handleCancelOrder = async () => {
    // Find ID dynamically
    const currentGuestId = tickets.find(t => t.tableId === 4 && t.status !== 'paid')?.id;

    if (!currentGuestId) return;
    if (!window.confirm("Are you sure you want to cancel your order?")) return;

    try {
      await api.cancelOrder(currentGuestId);
      await refreshOrders();
    } catch (e) {
      alert("Could not cancel order. It might already be preparing.");
    }
  };

  // --- 3. KITCHEN ACTIONS ---
  const handleMarkReady = async (id: string) => {
    await api.updateStatus(id, 'ready');
    await refreshOrders();
  };

  // --- 4. SERVICE ACTIONS ---
  const handleMarkServed = async (id: string) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket && ticket.type === 'request' && ticket.items[0]?.name.includes('Bill')) {
      await handleSettleTable(String(ticket.tableId));
      await api.updateStatus(id, 'served');
      return;
    }

    await api.updateStatus(id, 'served');
    await refreshOrders();
  };

  const handleSettleTable = async (tableId: string) => {
    if (!window.confirm(`Settle Bill for Table ${tableId}?`)) return;
    await api.settleTable(tableId);
    await refreshOrders();
  };

  // Service Tasks
  const handleCreateTask = async (type: string) => {
    const payload = {
      tableId: 4,
      guestName: 'Guest',
      totalAmount: 0,
      items: [{
        name: type,
        quantity: 1,
        price: 0
      }],
      type: 'request' as const
    };

    try {
      await api.placeOrder(payload);
      await refreshOrders();
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(e => console.error(e));
    } catch (e) {
      console.error("Failed to create service task", e);
    }
  };

  // Identify Guest Order Status
  const statusPriority: Record<string, number> = {
    'placed': 4,
    'cooking': 3,
    'ready': 2,
    'served': 1,
    'paid': 0,
    'cancelled': 0
  };

  const guestOrder = tickets
    .filter(t =>
      t.tableId === 4 &&
      ['placed', 'ready', 'served'].includes(t.status) &&
      t.status !== 'paid' &&
      t.status !== 'cancelled'
    )
    .sort((a, b) => (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0))[0];

  const guestStatus = guestOrder?.status as OrderStatus | undefined;

  return (
    <>
      {isOffline && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 fixed top-0 w-full z-[100]">
          ⚠️ Offline Mode. Reconnecting...
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* @ts-ignore */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <SplashLanding
              onNavigate={(page) => navigate(`/${page === 'landing' ? '' : page}`)}
              onPlaceOrder={handleGuestPlaceOrder}
              onCancelOrder={handleCancelOrder}
              guestOrderStatus={guestStatus}
              guestOrder={guestOrder}
              onRequestService={handleCreateTask}
              isOffline={isOffline}
              items={menuItems}
              isLoading={isMenuLoading}
              error={menuError}
            />
          } />

          <Route path="/menu" element={
            <SmartMenu
              guestName={guestSession?.name || "Guest"}
              preferences={guestSession?.preferences || {}}
              items={menuItems}
              onPlaceOrder={(items) => handleGuestPlaceOrder(items, guestSession?.name || "Guest", "4")}
              onProfileClick={handleProfileClick}
              onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)}
              isLoading={isMenuLoading}
              error={menuError}
              // Add other required props with defaults or state
              hasActiveOrder={false} // Can be wired to context ticket state if needed
            />
          } />

          <Route path="/kitchen" element={
            <KitchenDisplay
              tickets={tickets}
              onMarkReady={handleMarkReady}
              onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)}
              isOffline={isOffline}
              // Deprecated props, passing defaults or ignoring
              isMuted={false}
              onToggleMute={() => { }}
            />
          } />

          <Route path="/service" element={
            <ServiceDashboard
              tickets={tickets}
              onMarkServed={handleMarkServed}
              onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)}
              onSettleTable={handleSettleTable}
              isOffline={isOffline}
              isMuted={false}
              onToggleMute={() => { }}
            />
          } />

          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

const App: React.FC = () => {
  return (
    <RestaurantProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </RestaurantProvider>
  );
};

export default App;