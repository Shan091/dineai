import React, { useState, useEffect } from 'react';
import { X, Flame, Zap, Plus, ArrowRight } from 'lucide-react';
import { CartItem } from './SmartCart';
import { MenuItem } from './data'; // Correct Import

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onAdd: () => void;
  triggerItem?: CartItem;
  upsellItem: MenuItem;
}

const UpsellModal: React.FC<UpsellModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  onAdd,
  triggerItem,
  upsellItem
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-center px-4">
      {/* Dark Blur Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`
          relative w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl
          transform transition-all duration-300 ease-out border border-white/10
          ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
        `}
      >
        {/* Header */}
        <div className="bg-slate-50 dark:bg-black/20 p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHatIcon className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chef's Tip</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-center">

          {/* Dynamic Headline */}
          <h2 className="text-xl font-display font-bold text-[#0F172A] dark:text-white mb-2">
            The {triggerItem?.name || 'Curry'} is spicy... <Flame className="inline w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Cool it down with a refreshing {upsellItem.name}?
          </p>

          {/* Visual Comparison */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Trigger Item (Spicy) */}
            <div className="relative w-24 h-24 rounded-full border-4 border-red-100 dark:border-red-900/30 overflow-hidden shadow-lg">
              <img
                src={triggerItem?.image}
                alt="Spicy Dish"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center gap-1">
              <span className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700"></span>
              <div className="w-6 h-6 rounded-full bg-[#FF5722] text-white flex items-center justify-center text-xs font-bold shadow-md z-10">
                +
              </div>
              <span className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700"></span>
            </div>

            {/* Upsell Item (Cool) */}
            <div className="relative w-28 h-28 rounded-full border-4 border-green-100 dark:border-green-900/30 overflow-hidden shadow-xl scale-110">
              <img
                src={upsellItem.image}
                alt={upsellItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-1">
                <span className="text-[10px] font-bold text-white block">Perfect Pair</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onAdd}
              className="w-full py-3.5 bg-[#FF5722] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 animate-pulse-slow"
            >
              <Plus size={20} strokeWidth={3} />
              Add {upsellItem.name} +₹{upsellItem.price}
            </button>

            <button
              onClick={onProceed}
              className="w-full py-3 text-slate-400 dark:text-slate-500 font-medium text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              No, continue to cart <ArrowRight className="inline w-3 h-3 ml-1" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// Internal Icon
const ChefHatIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" x2="18" y1="17" y2="17" />
  </svg>
);

export default UpsellModal;