import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  Copy, 
  LogOut, 
  User, 
  MapPin, 
  Check, 
  Edit3, 
  ChevronRight,
  Utensils,
  History,
  RotateCcw,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { UserPreferences } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPrefs?: UserPreferences;
  onEditProfile: () => void;
  onLogout: () => void;
  tableNumber?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userPrefs, 
  onEditProfile, 
  onLogout,
  tableNumber = "4"
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReorder = () => {
    setToastMessage("Items added to cart!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const getDietLabel = (type?: string) => {
    if (type === 'non-veg') return 'Non-Veg';
    if (type === 'veg') return 'Vegetarian';
    if (type === 'egg') return 'Contains Egg';
    return 'Not Set';
  };

  // Mock Data for History
  const PAST_ORDERS = [
    {
      id: '#1201',
      date: 'Yesterday',
      total: 880,
      items: ['Butter Chicken', 'Garlic Naan x2', 'Fresh Lime Soda'],
      status: 'Delivered'
    },
    {
      id: '#1105',
      date: 'Last Week',
      total: 355,
      items: ['Kerala Veg Stew', 'Appam x2'],
      status: 'Delivered'
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] flex justify-center items-end sm:items-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`
          relative w-full max-w-md bg-[#FAFAFA] dark:bg-[#0F172A] 
          rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden
          transform transition-transform duration-300 ease-out
          flex flex-col max-h-[90vh]
          ${isOpen && !isClosing ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-white/5 shrink-0">
          <h2 className="text-lg font-display font-bold text-[#0F172A] dark:text-white">
            My Profile
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 pb-2 bg-white dark:bg-[#1E293B] shrink-0">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <User size={14} /> My Info
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <History size={14} /> Order History
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 relative flex-1">

          {activeTab === 'info' ? (
            <>
              {/* SECTION 1: USER PROFILE */}
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-[#FF5722]">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] dark:text-white">Guest at Table {tableNumber}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">DineAI Personalized Session</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-black/20 rounded-xl">
                     <span className="text-slate-500 dark:text-slate-400 font-medium">Dietary Type</span>
                     <span className="font-bold text-[#0F172A] dark:text-white capitalize flex items-center gap-2">
                        {getDietLabel(userPrefs?.dietary)}
                        {userPrefs?.dietary === 'veg' && <span className="w-2 h-2 rounded-full bg-green-500"/>}
                        {userPrefs?.dietary === 'non-veg' && <span className="w-2 h-2 rounded-full bg-red-500"/>}
                     </span>
                  </div>
                  
                  {userPrefs?.allergens && userPrefs.allergens.length > 0 && (
                    <div className="flex justify-between items-start text-sm p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                       <span className="text-red-600 dark:text-red-400 font-medium shrink-0">Allergens</span>
                       <div className="text-right font-bold text-red-700 dark:text-red-300">
                          {userPrefs.allergens.join(', ')}
                       </div>
                    </div>
                  )}
                  
                  {userPrefs?.healthGoals && userPrefs.healthGoals.length > 0 && (
                    <div className="flex justify-between items-start text-sm p-3 bg-teal-50 dark:bg-teal-900/10 rounded-xl">
                       <span className="text-teal-600 dark:text-teal-400 font-medium shrink-0">Goals</span>
                       <div className="text-right font-bold text-teal-700 dark:text-teal-300 truncate max-w-[150px]">
                          {userPrefs.healthGoals.join(', ')}
                       </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    handleClose();
                    setTimeout(onEditProfile, 300);
                  }}
                  className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} />
                  Edit Preferences
                </button>
              </div>

              {/* SECTION 2: RESTAURANT INFO */}
              <div className="space-y-3 animate-fade-in delay-75">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                   Restaurant Info
                 </h3>
                 
                 {/* WIFI CARD */}
                 <button 
                   onClick={() => copyToClipboard('delicious_curry', 'wifi')}
                   className="w-full bg-[#0F172A] dark:bg-white p-4 rounded-2xl shadow-lg relative overflow-hidden group text-left transition-transform active:scale-[0.99]"
                 >
                    <div className="absolute top-0 right-0 p-3 opacity-50">
                       <Wifi size={48} className="text-white dark:text-[#0F172A]" strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Guest Wi-Fi</span>
                       </div>
                       <div className="text-white dark:text-[#0F172A] font-display font-bold text-lg">
                          TheMalabar_Guest
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <code className="text-orange-400 dark:text-orange-600 font-mono text-sm bg-white/10 dark:bg-black/5 px-2 py-0.5 rounded">
                            delicious_curry
                          </code>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {copiedField === 'wifi' ? (
                              <>
                                <Check size={12} className="text-green-500" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={10} /> Tap to copy
                              </>
                            )}
                          </div>
                       </div>
                    </div>
                 </button>

                 {/* RESTROOM CARD */}
                 <div className="flex items-center justify-between bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <MapPin size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-[#0F172A] dark:text-white text-sm">Restroom Code</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Located near entrance</p>
                       </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 dark:bg-black/30 rounded-lg">
                       <span className="font-mono font-bold text-lg text-[#0F172A] dark:text-white tracking-widest">
                         1234
                       </span>
                    </div>
                 </div>
              </div>

              {/* SECTION 3: SESSION CONTROL */}
              <div className="pt-4 animate-fade-in delay-100">
                 <button
                   onClick={() => {
                     handleClose();
                     setTimeout(onLogout, 300);
                   }}
                   className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
                 >
                    <div className="flex items-center gap-3">
                       <LogOut size={20} />
                       <div className="text-left">
                          <span className="block font-bold text-sm">End Session / Log Out</span>
                          <span className="block text-[10px] opacity-80">Clears all data for next guest</span>
                       </div>
                    </div>
                    <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {PAST_ORDERS.length > 0 ? (
                PAST_ORDERS.map(order => (
                  <div key={order.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-white/5 border-dashed">
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-[#0F172A] dark:text-white text-sm">Order {order.id}</span>
                           <span className="text-[10px] bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">{order.status}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{order.date}</span>
                      </div>
                      <span className="font-bold text-[#0F172A] dark:text-white text-lg">₹{order.total}</span>
                    </div>
                    
                    <div className="space-y-1 mb-4">
                       {order.items.map((item, i) => (
                         <div key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                           {item}
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={handleReorder}
                      className="w-full py-2.5 bg-orange-50 dark:bg-orange-900/10 text-[#FF5722] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors active:scale-[0.98]"
                    >
                      <RotateCcw size={16} /> Re-Order
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                      <ShoppingBag size={24} className="text-slate-400" />
                   </div>
                   <p className="font-bold text-slate-600 dark:text-slate-300">No past orders... yet!</p>
                   <p className="text-xs text-slate-400">Your delicious history will appear here.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] px-4 py-3 rounded-full text-sm font-bold shadow-xl animate-fade-in-up whitespace-nowrap z-[100] flex items-center gap-2">
                <Check size={16} className="text-green-500" strokeWidth={3} />
                {toastMessage}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;