import React, { useState, useEffect } from 'react';
import { 
  X, 
  Droplets, 
  Utensils, 
  Bell, 
  Trash2, 
  Sparkles,
  FileText
} from 'lucide-react';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequest: (requestType: string) => void;
}

const REQUEST_OPTIONS = [
  { id: 'water', label: 'Water Refill', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'cutlery', label: 'Extra Cutlery', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'napkins', label: 'Napkins', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
  { id: 'seasoning', label: 'Salt & Pepper', icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'clear', label: 'Clear Table', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'staff', label: 'Call Staff', icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({ isOpen, onClose, onRequest }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) setIsAnimating(true);
    else setTimeout(() => setIsAnimating(false), 200);
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-center items-end sm:items-center px-4 pb-4 sm:pb-0">
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div className={`
        relative w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'}
      `}>
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20">
          <h2 className="font-display font-bold text-lg text-[#0F172A] dark:text-white">How can we help?</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {REQUEST_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onRequest(opt.label)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all active:scale-95 ${opt.bg}`}
            >
              <opt.icon size={28} className={opt.color} strokeWidth={1.5} />
              <span className="text-sm font-bold text-[#0F172A] dark:text-white">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-black/20">
          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};