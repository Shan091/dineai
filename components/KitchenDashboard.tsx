import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Flame, 
  ArrowLeft, 
  ChefHat, 
  Timer,
  Check,
  Bell,
  Droplets,
  FileText,
  Trash2,
  Utensils,
  Sparkles,
  Settings,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Activity
} from 'lucide-react';
import { CartItem } from './SmartCart';
import { MENU_ITEMS } from './SmartMenu'; // Import for pricing data
import { playSound } from '../utils/SoundManager';

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'served';

export interface OrderTicket {
  id: string;
  tableId: string;
  timestamp: Date;
  status: OrderStatus;
  guestName?: string;
  items: {
    name: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface ServiceTask {
  id: string;
  tableId: string;
  timestamp: Date;
  type: string;
  status: 'pending';
}

interface KitchenDashboardProps {
  onBack: () => void;
  onManageMenu?: () => void;
  activeOrder?: {
    status: string;
    items: CartItem[];
  };
  guestName?: string;
  tableNumber?: string;
}

const MOCK_TICKETS: OrderTicket[] = [
  {
    id: 't1',
    tableId: '8',
    guestName: 'Arjun',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
    status: 'new',
    items: [
      { name: 'Butter Chicken', quantity: 1, notes: 'Less spicy' },
      { name: 'Garlic Naan', quantity: 2 },
      { name: 'Mango Lassi', quantity: 1 }
    ]
  },
  {
    id: 't2',
    tableId: '2',
    guestName: 'Sarah',
    timestamp: new Date(Date.now() - 1000 * 60 * 18), // 18 mins ago (late)
    status: 'new', // Changed to new for chef view
    items: [
      { name: 'Veg Biryani', quantity: 1 },
      { name: 'Paneer Tikka', quantity: 1, notes: 'No onions' }
    ]
  },
  {
    id: 't3',
    tableId: '7',
    guestName: 'Vikram',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    status: 'ready', // Ready for waiter
    items: [
      { name: 'Masala Dosa', quantity: 2 },
      { name: 'Filter Coffee', quantity: 2 }
    ]
  }
];

const MOCK_COMPLETED_TICKETS: OrderTicket[] = [
    {
      id: 'h1',
      tableId: '5',
      guestName: 'Rahul',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      status: 'served',
      items: [{ name: 'Kerala Parotta', quantity: 4 }, { name: 'Spicy Beef Fry', quantity: 2 }]
    },
    {
      id: 'h2',
      tableId: '3',
      guestName: 'Priya',
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      status: 'served',
      items: [{ name: 'Chicken Biryani', quantity: 2 }, { name: 'Fresh Lime Soda', quantity: 2 }]
    }
];

const MOCK_SERVICE_TASKS: ServiceTask[] = [
  {
    id: 'st1',
    tableId: '8',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    type: 'Water Refill',
    status: 'pending'
  },
  {
    id: 'st2',
    tableId: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'Request Bill',
    status: 'pending'
  },
];

const KitchenDashboard: React.FC<KitchenDashboardProps> = ({ onBack, onManageMenu, activeOrder, guestName = "Guest", tableNumber = "4" }) => {
  const [activeTab, setActiveTab] = useState<'kitchen' | 'service' | 'reports'>('kitchen');
  const [tickets, setTickets] = useState<OrderTicket[]>(MOCK_TICKETS);
  const [completedTickets, setCompletedTickets] = useState<OrderTicket[]>(MOCK_COMPLETED_TICKETS);
  const [serviceTasks, setServiceTasks] = useState<ServiceTask[]>(MOCK_SERVICE_TASKS);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Inject active order from the session if exists
  useEffect(() => {
    if (activeOrder && activeOrder.items.length > 0) {
      const hasLiveOrder = tickets.some(t => t.id === 'live-order');
      
      if (!hasLiveOrder) {
         // New Live Order Detected
         playSound('kitchen_alert');
         
         const liveTicket: OrderTicket = {
            id: 'live-order',
            tableId: tableNumber,
            guestName: guestName,
            timestamp: new Date(),
            status: activeOrder.status as OrderStatus, 
            items: activeOrder.items.map(i => ({
               name: i.name,
               quantity: i.quantity,
               notes: i.notes
            }))
         };
         setTickets(prev => [liveTicket, ...prev]);
      } else {
         setTickets(prev => prev.map(t => 
            t.id === 'live-order' ? { ...t, status: activeOrder.status as OrderStatus } : t
         ));
      }
    }
  }, [activeOrder, guestName, tableNumber]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); 
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (date: Date) => {
    return Math.floor((currentTime.getTime() - date.getTime()) / 60000);
  };

  // --- KITCHEN ACTIONS (Chef) ---
  const handleMarkReady = (ticketId: string) => {
    // Chef marks as ready -> Handoff to waiter
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'ready' } : t));
    playSound('notification_bell');
  };

  // --- SERVICE ACTIONS (Waiter) ---
  const handleMarkServed = (ticketId: string) => {
    // Waiter marks as served -> Moves to history
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setCompletedTickets(prev => [{...ticket, status: 'served'}, ...prev]);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      playSound('success_chime');
    }
  };

  const handleCompleteTask = (taskId: string) => {
    setServiceTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'Water Refill': return <Droplets className="text-blue-500" size={24} />;
      case 'Request Bill': return <FileText className="text-green-600" size={24} />;
      case 'Clean Table': return <Trash2 className="text-red-500" size={24} />;
      case 'Extra Cutlery': return <Utensils className="text-orange-500" size={24} />;
      case 'Salt & Pepper': return <Sparkles className="text-yellow-500" size={24} />;
      default: return <Bell className="text-purple-500" size={24} />;
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const analyticsData = useMemo(() => {
    const allTickets = [...tickets, ...completedTickets];
    // Helper to get price
    const getItemPrice = (name: string) => {
      const item = MENU_ITEMS.find(m => m.name === name);
      return item ? item.price : 0;
    };

    let totalRevenue = 0;
    const itemSales: Record<string, number> = {};

    allTickets.forEach(ticket => {
      ticket.items.forEach(item => {
        const price = getItemPrice(item.name);
        totalRevenue += price * item.quantity;
        itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
      });
    });

    const totalOrders = allTickets.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Best Seller
    let bestSellerName = '';
    let maxSold = 0;
    Object.entries(itemSales).forEach(([name, count]) => {
      if (count > maxSold) {
        maxSold = count;
        bestSellerName = name;
      }
    });
    
    const bestSellerItem = MENU_ITEMS.find(m => m.name === bestSellerName);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      bestSeller: bestSellerItem ? { ...bestSellerItem, count: maxSold } : null,
      recentActivity: completedTickets.slice(0, 5)
    };
  }, [tickets, completedTickets]);

  // --- VIEW FILTERS ---
  const kitchenTickets = tickets.filter(t => t.status === 'new' || t.status === 'cooking');
  const readyTickets = tickets.filter(t => t.status === 'ready');

  const readyCount = readyTickets.length;
  const requestCount = serviceTasks.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans animate-fade-in">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar px-6 py-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
              <button 
                onClick={() => setActiveTab('kitchen')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'kitchen' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <ChefHat size={16} /> Kitchen
                {kitchenTickets.length > 0 && <span className="bg-white text-orange-600 text-[10px] px-1.5 rounded-full">{kitchenTickets.length}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('service')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'service' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <Bell size={16} /> Service
                {(readyCount + requestCount) > 0 && <span className="bg-white text-blue-600 text-[10px] px-1.5 rounded-full">{readyCount + requestCount}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <BarChart3 size={16} /> Reports
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
              {onManageMenu && (
                  <button 
                      onClick={onManageMenu}
                      className="flex-shrink-0 whitespace-nowrap px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600"
                  >
                      <Settings size={16} /> <span className="hidden sm:inline">Manage Menu</span>
                  </button>
              )}
              <button 
                  onClick={onBack}
                  className="flex-shrink-0 whitespace-nowrap px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600"
              >
                  <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
              </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        
        {/* KITCHEN TAB (Chef View) */}
        {activeTab === 'kitchen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kitchenTickets.map(ticket => {
              const elapsed = getElapsedMinutes(ticket.timestamp);
              const isLate = elapsed > 15;

              return (
                <div 
                  key={ticket.id} 
                  className={`bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col border-t-8 border-orange-500 animate-fade-in-up`}
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold font-display text-gray-900 leading-none">Table {ticket.tableId}</h2>
                      {ticket.guestName && (
                        <span className="text-sm font-medium text-gray-500 mt-0.5">{ticket.guestName}</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 font-mono font-bold text-sm ${isLate ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                      <Timer size={14} />
                      {elapsed}m
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center font-bold text-lg text-gray-700 shrink-0">
                          {item.quantity}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 leading-tight">{item.name}</p>
                          {item.notes && (
                            <p className="text-sm text-red-500 italic font-medium mt-0.5">
                               ⚠️ {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleMarkReady(ticket.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                       <span>✅ Food Ready</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {kitchenTickets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                <CheckCircle2 size={64} className="mb-4" />
                <p className="text-xl font-bold">All Orders Cleared!</p>
                <p className="text-sm">Great job, Chef.</p>
              </div>
            )}
          </div>
        )}

        {/* SERVICE TAB (Waiter View) */}
        {activeTab === 'service' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             
             {/* 1. READY FOR PICKUP (High Priority) */}
             {readyTickets.map(ticket => {
               const elapsed = getElapsedMinutes(ticket.timestamp);
               
               return (
                 <div 
                   key={ticket.id}
                   className="bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col border-t-8 border-green-500 animate-fade-in-up relative"
                 >
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                       <Utensils size={64} />
                    </div>

                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-green-50">
                      <div>
                         <h2 className="text-xl font-bold font-display text-gray-800">Table {ticket.tableId}</h2>
                         <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Order Ready</p>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-sm text-gray-500">
                         <Timer size={14} />
                         {elapsed}m
                      </div>
                    </div>

                    <div className="p-4 flex-1 space-y-2">
                       {ticket.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                             <span className="font-bold text-gray-900">{item.quantity}x</span>
                             <span>{item.name}</span>
                          </div>
                       ))}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <button 
                        onClick={() => handleMarkServed(ticket.id)}
                        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Utensils size={18} /> Mark Served
                      </button>
                    </div>
                 </div>
               );
             })}

             {/* 2. SERVICE REQUESTS */}
             {serviceTasks.map(task => {
               const elapsed = getElapsedMinutes(task.timestamp);
               const isUrgent = elapsed > 5;

               return (
                 <div 
                   key={task.id}
                   className={`bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col border-t-8 ${isUrgent ? 'border-red-500' : 'border-blue-500'} animate-fade-in-up`}
                 >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h2 className="text-xl font-bold font-display text-gray-800">Table {task.tableId}</h2>
                      <div className="flex items-center gap-1 font-mono font-bold text-sm text-gray-500">
                         <Timer size={14} />
                         {elapsed}m ago
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                       <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                          {getTaskIcon(task.type)}
                       </div>
                       <h3 className="text-2xl font-bold text-gray-800 leading-tight mb-1">{task.type}</h3>
                       <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Service Request</p>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} /> Mark Done
                      </button>
                    </div>
                 </div>
               );
             })}

             {(serviceTasks.length === 0 && readyTickets.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                <Bell size={64} className="mb-4" />
                <p className="text-xl font-bold">No Service Requests</p>
                <p className="text-sm">Floor is clear.</p>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB (ANALYTICS) */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in">
             
             {/* TOP KPI CARDS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <DollarSign size={64} />
                   </div>
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</h3>
                   <div className="text-3xl font-display font-bold text-emerald-400 flex items-baseline gap-1">
                      <span className="text-lg">₹</span>
                      {analyticsData.totalRevenue.toLocaleString()}
                   </div>
                   <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1 font-medium bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">
                      <TrendingUp size={12} /> +12% vs yesterday
                   </div>
                </div>

                {/* Orders */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShoppingBag size={64} />
                   </div>
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Orders</h3>
                   <div className="text-3xl font-display font-bold text-white">
                      {analyticsData.totalOrders}
                   </div>
                   <div className="mt-2 text-xs text-blue-400 font-medium">
                      Across {tickets.length} active tables
                   </div>
                </div>

                {/* Avg Order Value */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Activity size={64} />
                   </div>
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Avg. Order Value</h3>
                   <div className="text-3xl font-display font-bold text-white flex items-baseline gap-1">
                      <span className="text-lg">₹</span>
                      {analyticsData.avgOrderValue}
                   </div>
                   <div className="mt-2 text-xs text-gray-500 font-medium">
                      Per table session
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COL: BEST SELLER & BUSY HOURS */}
                <div className="lg:col-span-2 space-y-6">
                   {/* Best Seller */}
                   {analyticsData.bestSeller && (
                     <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col sm:flex-row">
                        <div className="sm:w-48 bg-gray-700 relative h-48 sm:h-auto">
                           <img 
                              src={analyticsData.bestSeller.image} 
                              alt="Best Seller" 
                              className="w-full h-full object-cover opacity-80"
                           />
                           <div className="absolute top-2 left-2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                              <Sparkles size={12} fill="black" /> #1 Best Seller
                           </div>
                        </div>
                        <div className="p-6 flex flex-col justify-center flex-1">
                           <h3 className="text-2xl font-bold font-display text-white mb-2">{analyticsData.bestSeller.name}</h3>
                           <p className="text-gray-400 text-sm mb-4 line-clamp-2">{analyticsData.bestSeller.description}</p>
                           <div className="flex gap-8">
                              <div>
                                 <span className="block text-xs text-gray-500 font-bold uppercase">Units Sold</span>
                                 <span className="text-xl font-bold text-white">{analyticsData.bestSeller.count}</span>
                              </div>
                              <div>
                                 <span className="block text-xs text-gray-500 font-bold uppercase">Revenue</span>
                                 <span className="text-xl font-bold text-emerald-400">₹{(analyticsData.bestSeller.count * analyticsData.bestSeller.price).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Busy Hours Mock Chart */}
                   <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                         <Clock size={16} /> Busy Hours
                      </h3>
                      <div className="flex items-end justify-between h-32 gap-2">
                         {[15, 30, 45, 80, 100, 70, 40, 20].map((h, i) => (
                           <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                              <div 
                                className="w-full bg-blue-600/30 group-hover:bg-blue-500 rounded-t-sm transition-all relative"
                                style={{ height: `${h}%` }}
                              >
                                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                    {h}
                                 </span>
                              </div>
                              <span className="text-[10px] text-gray-500 text-center">{12 + i}:00</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* RIGHT COL: RECENT ACTIVITY */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={16} /> Recent Activity
                   </h3>
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                      {analyticsData.recentActivity.map((ticket) => (
                         <div key={ticket.id} className="flex items-start gap-3 border-b border-gray-700 pb-3 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                               <Check size={14} strokeWidth={3} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-white truncate">Table {ticket.tableId} • {ticket.guestName || 'Guest'}</p>
                               <p className="text-xs text-gray-500 truncate">
                                  {ticket.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                               </p>
                            </div>
                            <span className="text-xs font-mono text-gray-400 shrink-0">
                               {ticket.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                         </div>
                      ))}
                      {analyticsData.recentActivity.length === 0 && (
                         <p className="text-sm text-gray-500 text-center py-4">No completed orders yet.</p>
                      )}
                   </div>
                </div>

             </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default KitchenDashboard;