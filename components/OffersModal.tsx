import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, Check } from 'lucide-react';
import { CartItem } from './SmartCart';

interface Offer {
  code: string;
  title: string;
  description: string;
  minOrder: number;
  type: 'flat' | 'percent' | 'free_item';
  value: number; // amount or percent
  category?: string; // for category specific offers like 'Dessert'
  color: string;
}

const OFFERS: Offer[] = [
  {
    code: 'WELCOME100',
    title: 'Flat ₹100 Off',
    description: 'Save ₹100 on orders above ₹500',
    minOrder: 500,
    type: 'flat',
    value: 100,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    code: 'SWEETTOOTH',
    title: 'Free Dessert',
    description: 'Get a free dessert on orders above ₹300',
    minOrder: 300,
    type: 'free_item',
    category: 'Dessert',
    value: 180, // Cap at typical dessert price
    color: 'text-pink-600 bg-pink-50 border-pink-200'
  },
  {
    code: 'HDFC5',
    title: '5% Cashback',
    description: '5% discount on HDFC Cards',
    minOrder: 0,
    type: 'percent',
    value: 5,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  }
];

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  cartItems: CartItem[];
  onApply: (code: string, discount: number, desc: string) => void;
}

export const OffersModal: React.FC<OffersModalProps> = ({ 
  isOpen, 
  onClose, 
  cartTotal, 
  cartItems, 
  onApply 
}) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setIsAnimating(true);
        setError(null);
        setInputCode('');
    } else {
        setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const validateAndApply = (offer: Offer) => {
    // 1. Min Order Validation
    if (cartTotal < offer.minOrder) {
      setError(`Add items worth ₹${offer.minOrder - cartTotal} more to apply.`);
      return;
    }

    // 2. Calculate Discount
    let discount = 0;
    let desc = '';

    if (offer.type === 'flat') {
      discount = offer.value;
      desc = `Flat ₹${discount} off applied`;
    } else if (offer.type === 'percent') {
      discount = Math.round((cartTotal * offer.value) / 100);
      desc = `${offer.value}% discount applied`;
    } else if (offer.type === 'free_item' && offer.category) {
      // Find eligible items
      const eligibleItems = cartItems.filter(i => 
        i.category === offer.category || (offer.category === 'Dessert' && i.category === 'Dessert')
      );
      
      if (eligibleItems.length === 0) {
        setError(`Add a ${offer.category} to your cart to avail this offer.`);
        return;
      }
      
      // Discount the cheapest eligible item
      const prices = eligibleItems.map(i => i.price);
      const minPrice = Math.min(...prices);
      discount = Math.min(minPrice, offer.value);
      desc = `Free ${offer.category} applied`;
    }

    if (discount > 0) {
      onApply(offer.code, discount, desc);
      onClose();
    } else {
      setError('Conditions not met for this offer.');
    }
  };

  const handleManualApply = () => {
    const code = inputCode.trim().toUpperCase();
    const offer = OFFERS.find(o => o.code === code);
    
    if (offer) {
      validateAndApply(offer);
    } else {
      setError('Invalid Coupon Code');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-center items-end sm:items-center">
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
            relative w-full max-w-md bg-white dark:bg-[#0F172A] 
            rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden
            transform transition-transform duration-300 ease-out
            flex flex-col max-h-[90vh]
            ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'}
        `}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20">
                <h2 className="font-display font-bold text-lg text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Tag size={20} className="text-[#FF5722]" />
                    Available Offers
                </h2>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto no-scrollbar flex-1">
                
                {/* Input Area */}
                <div className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        placeholder="Enter Code" 
                        value={inputCode}
                        onChange={(e) => {
                            setInputCode(e.target.value);
                            setError(null);
                        }}
                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 font-bold text-[#0F172A] dark:text-white placeholder:font-normal outline-none focus:border-[#FF5722] uppercase"
                    />
                    <button 
                        onClick={handleManualApply}
                        disabled={!inputCode}
                        className="font-bold text-[#FF5722] disabled:text-slate-400 px-4 transition-colors"
                    >
                        APPLY
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Best Coupons for You</h3>

                <div className="space-y-4">
                    {OFFERS.map(offer => (
                        <div key={offer.code} className={`p-4 border rounded-2xl relative overflow-hidden group transition-all ${offer.color.replace('text-', 'border-').replace('bg-', '')} border-opacity-50 dark:border-opacity-20`}>
                            
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-current bg-white/50 dark:bg-black/20 inline-block ${offer.color}`}>
                                    {offer.code}
                                </div>
                                <button 
                                    onClick={() => validateAndApply(offer)}
                                    className="text-sm font-bold text-[#FF5722] hover:underline"
                                >
                                    APPLY
                                </button>
                            </div>

                            <h4 className="font-bold text-[#0F172A] dark:text-white text-lg mb-1 relative z-10">{offer.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
                                {offer.description}
                            </p>

                            {/* Background Decor */}
                            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${offer.color.includes('blue') ? 'bg-blue-500' : offer.color.includes('pink') ? 'bg-pink-500' : 'bg-indigo-500'}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};