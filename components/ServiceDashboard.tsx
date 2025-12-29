import React from 'react';
import { Bell, Utensils, Clock, Droplets, FileText, Trash2, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { OrderTicket } from '../context/RestaurantContext';

import StaffNavbar from './StaffNavbar';

interface ServiceDashboardProps {
  tickets: OrderTicket[];
  onMarkServed: (id: string) => void;
  onNavigate: (page: 'landing' | 'kitchen' | 'service') => void;
  onSettleTable?: (tableId: string) => void;
  isOffline?: boolean;
}

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ tickets, onMarkServed, onNavigate, onSettleTable, isOffline }) => {
  // STRICT FILTER 1: Only orders that are READY for pickup (Food).
  const readyForPickup = tickets.filter(t => t.status === 'ready' && (t.type === 'food' || !t.type));

  // STRICT FILTER 2: Service Requests (Bill, Water, etc.)
  const serviceRequests = tickets.filter(t =>
    t.type === 'request' &&
    !['served', 'paid', 'cancelled'].includes(t.status)
  );

  const getElapsedMinutes = (date: Date) => {
    return Math.floor((new Date().getTime() - date.getTime()) / 60000);
  };

  const getTaskIcon = (items: any[]) => {
    const name = items[0]?.name || 'Request';
    if (name.includes('Water')) return <Droplets className="text-blue-500" size={32} />;
    if (name.includes('Bill')) return <FileText className="text-green-600" size={32} />;
    if (name.includes('Clean')) return <Trash2 className="text-red-500" size={32} />;
    return <Bell className="text-purple-500" size={32} />;
  };

  const handleManualSettle = () => {
    const tableId = prompt("Enter Table ID to Close/Settle:");
    if (tableId && onSettleTable) {
      onSettleTable(tableId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] flex flex-col font-sans animate-fade-in pt-20">
      <StaffNavbar />

      {/* Local Page Header */}
      <div className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display leading-none">Service Dashboard</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">
              Waiters View • {readyForPickup.length} Pickups • {serviceRequests.length} Requests
            </p>
          </div>
        </div>

        {onSettleTable && (
          <button
            onClick={handleManualSettle}
            className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-green-200"
          >
            <Sparkles size={16} /> Close Table
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-full mx-auto w-full h-full items-start">

        {/* SECTION 1: KITCHEN PICKUPS (LEFT COLUMN) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <Utensils className="text-orange-600" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-700">🍽️ Kitchen Pickups</h2>
            <span className="ml-auto bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs">
              {readyForPickup.length} Ready
            </span>
          </div>

          <div className="space-y-4">
            {readyForPickup.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-lg border-2 border-orange-500 overflow-hidden animate-fade-in-up">
                {/* High Visibility Header */}
                <div className="bg-orange-50 px-4 py-3 flex justify-between items-center border-b border-orange-100">
                  <div>
                    <h3 className="text-2xl font-bold font-display text-gray-900">Table {ticket.tableId}</h3>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                      <Clock size={12} /> Waiting {getElapsedMinutes(ticket.createdAt)}m
                    </span>
                  </div>
                  <div className="bg-orange-500 text-white p-2 rounded-lg">
                    <Utensils size={24} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {ticket.items.map((item, i) => {
                      const isReady = item.status === 'ready';
                      const isServed = item.status === 'served';
                      return (
                        <div key={i} className={`flex items-center gap-3 text-lg ${isServed ? 'opacity-50' : ''}`}>
                          <span className={`font-bold px-2 rounded ${isReady ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          <span className={`font-medium ${isReady ? 'text-green-700 font-bold' : isServed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          {isReady && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Serve</span>}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => onMarkServed(ticket.id)}
                    disabled={isOffline}
                    className={`w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Mark Served <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}

            {readyForPickup.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center opacity-60">
                <Utensils size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="font-bold text-xl text-slate-500">No Food Ready</p>
                <p className="text-slate-400">Kitchen is cooking...</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: TABLE REQUESTS (RIGHT COLUMN) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <Bell className="text-blue-600" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-700">🔔 Table Requests</h2>
            <span className="ml-auto bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
              {serviceRequests.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {serviceRequests.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 animate-fade-in-up border-l-4 border-blue-500">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                  {getTaskIcon(ticket.items)}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Table {ticket.tableId}</h3>
                  <p className="text-blue-600 font-bold text-lg">{ticket.items[0]?.name || 'Request'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{getElapsedMinutes(ticket.createdAt)} min ago</p>
                </div>

                <button
                  onClick={() => onMarkServed(ticket.id)}
                  disabled={isOffline}
                  className={`px-6 py-3 text-white rounded-lg font-bold transition-all shadow-md whitespace-nowrap ${ticket.items[0]?.name.includes('Bill') ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {ticket.items[0]?.name.includes('Bill') ? 'Mark Paid & Close' : 'Mark Done'}
                </button>
              </div>
            ))}

            {serviceRequests.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center opacity-60">
                <Bell size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="font-bold text-xl text-slate-500">No Pending Requests</p>
                <p className="text-slate-400">All guests are happy.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceDashboard;