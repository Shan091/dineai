import React from 'react';
import { ChefHat, CheckCircle2 } from 'lucide-react'; // Timer removed, used in sub-component
import { OrderTicket } from '../context/RestaurantContext'; // Use Context Type
import OrderTimer from './OrderTimer'; // Import Timer
import { motion, AnimatePresence } from 'framer-motion';

import StaffNavbar from './StaffNavbar';

interface KitchenDisplayProps {
  tickets: OrderTicket[];
  onMarkReady: (id: string) => void;
  onNavigate: (page: 'landing' | 'kitchen' | 'service') => void;
  // Legacy Props
  isOffline?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ tickets, onMarkReady }) => {
  // STRICT FILTER: Only show orders that are placed and are food (or have no type - backward compat).
  // SORT: FIFO (Oldest First) - Ascending Order of CreatedAt
  const kitchenOrders = tickets
    .filter(t => t.status === 'placed' && (t.type === 'food' || !t.type)) // Allow missing type for old orders
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans animate-fade-in pt-20">
      <StaffNavbar />

      {/* Local Page Header */}
      <div className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg">
            <ChefHat size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display leading-none">Kitchen Display</h1>
            <p className="text-sm text-gray-400 font-mono mt-1">{kitchenOrders.length} Active Orders</p>
          </div>
        </div>
      </div>




      {/* Grid */}
      <motion.div layout className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
        <AnimatePresence mode='popLayout'>
          {kitchenOrders.map(ticket => (
            <motion.div
              layout
              key={ticket.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl shadow-lg overflow-hidden flex flex-col border-t-8 border-t-orange-500 animate-fade-in-up"
            >
              {/* Ticket Header */}
              <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-start bg-gray-800/50">
                <div>
                  <h2 className="text-3xl font-bold font-display text-white leading-none mb-1">Table {ticket.tableId}</h2>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                    {ticket.guestName || 'Guest'}
                  </span>
                </div>

                {/* Live Timer */}
                <OrderTimer startTime={ticket.createdAt} />
              </div>

              {/* Items */}
              <div className="p-5 flex-1 space-y-4">
                {ticket.items.map((item, idx) => {
                  // Default to 'pending' for legacy data, but logically 'placed' tickets should have 'pending' items
                  // If item.status doesn't exist, treat as pending if ticket is active.
                  const isServed = item.status === 'served';

                  return (
                    <div key={idx} className={`flex items-start gap-4 ${isServed ? 'opacity-50 grayscale' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shrink-0 border 
                        ${isServed ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-700 border-gray-600 text-white'}`}>
                        {item.quantity}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-bold text-xl leading-tight ${isServed ? 'text-gray-500 line-through decoration-2' : 'text-gray-100'}`}>
                            {item.name}
                          </p>
                          {!isServed && (
                            <span className="bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-2 animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-red-400 font-bold italic mt-1 bg-red-900/30 p-1.5 rounded inline-block">
                            ⚠️ {item.notes}
                          </p>
                        )}
                        {/* Optional: Show status text */}
                        {isServed && (
                          <span className="text-xs font-bold text-green-500 flex items-center gap-1 mt-1">
                            <CheckCircle2 size={12} /> Served
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action */}
              <div className="p-4 bg-gray-800/80 border-t border-gray-700">
                <button
                  onClick={() => onMarkReady(ticket.id)}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={24} />
                  <span>Mark Ready</span>
                </button>
              </div>
            </motion.div>
          )
          )}
        </AnimatePresence>

        {kitchenOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-600 opacity-60">
            <ChefHat size={80} className="mb-6" />
            <p className="text-3xl font-bold font-display">All Clear, Chef!</p>
            <p className="text-lg">Waiting for new orders...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};


export default KitchenDisplay;