import React from 'react';
import { ChefHat, FileText, Utensils, ArrowRight } from 'lucide-react';
import { OrderStatus } from './OrderTracker';

interface FloatingStatusPillProps {
  status: OrderStatus;
  onClick: () => void;
  isSplitView?: boolean;
}

export const FloatingStatusPill: React.FC<FloatingStatusPillProps> = ({ status, onClick, isSplitView }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative bg-[#0F172A] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-lg border border-white/10 order-served-pill mb-0
        hover:scale-105 active:scale-95 transition-all
      `}
    >
      <div className="relative">
        {status === 'received' && <FileText size={18} />}
        {status === 'cooking' && <ChefHat size={18} />}
        {status === 'served' && <Utensils size={18} />}

        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#0F172A] ${status === 'cooking' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
      </div>

      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
          Table #4
        </span>
        <span className="font-bold text-sm">
          Order {status === 'received' ? 'Sent' : status === 'cooking' ? 'Cooking' : 'Served'}
        </span>
      </div>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
        Track <ArrowRight size={14} />
      </div>
    </button>
  );
};

export default FloatingStatusPill;