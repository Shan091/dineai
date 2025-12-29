import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Check, 
  ChefHat, 
  Minus, 
  Plus, 
  Sparkles, 
  Zap,
  Info
} from 'lucide-react';
import { UserPreferences } from '../services/db';
import { MenuItem, MenuItemSize, EnrichedMenuItem } from './SmartMenu';

interface FoodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EnrichedMenuItem;
  pairingItem?: MenuItem;
  preferences: UserPreferences;
  onAddToCart: (item: MenuItem, quantity: number, notes: string, addons: string[], size?: MenuItemSize) => void;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  pairingItem,
  preferences,
  onAddToCart 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]); // Store addon names
  const [isAnimating, setIsAnimating] = useState(false);
  const [addedPairing, setAddedPairing] = useState(false);

  // Initialize state when item opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setQuantity(1);
      setNotes('');
      setSelectedAddons([]);
      setAddedPairing(false);
      
      // Portion Logic: Default to Full or first available size
      if (item.type === 'portion' && item.sizes && item.sizes.length > 0) {
        // Default to the last item (usually 'Full') or the first one
        setSelectedSize(item.sizes[item.sizes.length - 1]); 
      } else {
        setSelectedSize(null);
      }
    } else {
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen, item]);

  if (!isOpen && !isAnimating) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const toggleAddon = (addonName: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonName) ? prev.filter(x => x !== addonName) : [...prev, addonName]
    );
  };

  const handleAddPairing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pairingItem) return;
    // Add pairing item to cart immediately (simple add)
    onAddToCart(pairingItem, 1, '', []); 
    setAddedPairing(true);
  };

  // --- Pricing Calculations ---
  // 1. Base Price: Either Unit Price OR Selected Size Price
  const basePrice = item.type === 'portion' && selectedSize 
    ? selectedSize.price 
    : item.price;

  // 2. Add-ons Total
  const addonsTotal = selectedAddons.reduce((acc, name) => {
    const addon = item.addons?.find(a => a.name === name);
    return acc + (addon ? addon.price : 0);
  }, 0);

  // 3. Final Total
  const singleItemTotal = basePrice + addonsTotal;
  const finalTotal = singleItemTotal * quantity;

  // AI Insight Logic
  const getInsight = () => {
    if (item.matchPercentage > 90) {
      if (item.matchReasons.some(r => r.includes('protein'))) 
        return "This high-protein dish fits your post-workout goal perfectly.";
      if (item.matchReasons.some(r => r.includes('spicy')))
        return "Ideally spiced to match your fiery craving.";
      return "Excellent match for your taste profile.";
    }
    return "A local favorite customized for your preferences.";
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center">
      
      {/* 1. Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* 2. Modal Container */}
      <div 
        className={`
          relative w-full max-w-md bg-white dark:bg-[#0F172A] 
          rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl
          flex flex-col max-h-[90vh] sm:max-h-[85vh]
          transform transition-transform duration-300 ease-out
          ${isAnimating ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}
        `}
      >
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar flex-1">
          
          {/* Hero Image */}
          <div className="relative h-64 w-full bg-slate-200">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
              }}
            />
            {/* Match Badge */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFD700] text-black text-xs font-bold rounded-lg shadow-lg mb-1">
                 <Sparkles size={12} className="fill-black" />
                 {item.matchPercentage}% Match for you
               </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-2xl font-display font-bold text-[#0F172A] dark:text-white leading-tight pr-4">
                  {item.name}
                </h2>
                <div className="flex flex-col items-end">
                   <span className="text-xl font-bold text-[#FF5722]">
                     ₹{basePrice}
                   </span>
                   {item.type === 'portion' && selectedSize && (
                     <span className="text-xs font-medium text-slate-400">
                       Per {selectedSize.label}
                     </span>
                   )}
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* AI Insight Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3.5 flex gap-3 items-start">
               <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-full shrink-0 mt-0.5">
                  <Zap size={14} className="text-blue-600 dark:text-blue-300 fill-blue-600 dark:fill-blue-300" />
               </div>
               <div>
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-0.5">
                    Why this matches
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-snug">
                    "{getInsight()}"
                  </p>
               </div>
            </div>

            {/* Health & Safety Row */}
            <div className="space-y-3">
              {/* Macro Grid */}
              {item.macros && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs text-slate-400 font-medium mb-1">Calories</span>
                    <div className="flex items-center gap-1 text-[#0F172A] dark:text-white font-bold">
                       <Flame size={14} className="text-orange-500 fill-orange-500" />
                       {item.macros.calories}
                    </div>
                  </div>
                  <div className={`flex flex-col items-center p-2.5 rounded-xl border ${preferences.healthGoals.includes('high_protein') ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                    <span className={`text-xs font-medium mb-1 ${preferences.healthGoals.includes('high_protein') ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>Protein</span>
                    <span className={`font-bold ${preferences.healthGoals.includes('high_protein') ? 'text-green-700 dark:text-green-300' : 'text-[#0F172A] dark:text-white'}`}>
                       {item.macros.protein}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-xs text-slate-400 font-medium mb-1">Carbs</span>
                    <span className="text-[#0F172A] dark:text-white font-bold">
                       {item.macros.carbs}
                    </span>
                  </div>
                </div>
              )}

              {/* Allergen Safety */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                <Check size={16} strokeWidth={3} />
                <span>
                   Safe: No {preferences.allergens.length > 0 ? preferences.allergens.join(', ') : 'Allergens detected'}
                </span>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            {/* --- CUSTOMIZATION SECTION --- */}
            <div className="space-y-6">
               
               {/* 1. Portion Control (Conditional) */}
               {item.type === 'portion' && item.sizes && (
                 <div>
                   <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Portion Size</h4>
                   <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                      {item.sizes.map((size) => (
                        <button 
                          key={size.label}
                          onClick={() => setSelectedSize(size)}
                          className={`
                            flex-1 py-2 text-sm font-bold rounded-lg transition-all 
                            ${selectedSize?.label === size.label 
                                ? 'bg-white dark:bg-slate-700 text-[#FF5722] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                          `}
                        >
                          {size.label}
                        </button>
                      ))}
                   </div>
                 </div>
               )}

               {/* 2. Add-ons (Dynamic) */}
               {item.addons && item.addons.length > 0 && (
                 <div>
                   <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3">Add-ons</h4>
                   <div className="space-y-2">
                     {item.addons.map(addon => (
                       <label key={addon.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors cursor-pointer group hover:border-slate-200 dark:hover:border-white/10">
                          <div className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAddons.includes(addon.name) ? 'bg-[#FF5722] border-[#FF5722]' : 'border-slate-300 dark:border-slate-600 group-hover:border-[#FF5722]/50'}`}>
                                {selectedAddons.includes(addon.name) && <Check size={12} className="text-white" />}
                             </div>
                             <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{addon.name}</span>
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">+₹{addon.price}</span>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedAddons.includes(addon.name)}
                            onChange={() => toggleAddon(addon.name)}
                          />
                       </label>
                     ))}
                   </div>
                 </div>
               )}

               {/* 3. Special Instructions */}
               <div>
                 <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3 flex items-center justify-between">
                    Note for Chef <span className="text-xs font-normal text-slate-400">Optional</span>
                 </h4>
                 <textarea
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                   placeholder="e.g., Less oil, extra spicy..."
                   className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#FF5722] min-h-[80px] placeholder:text-slate-400 text-black dark:text-white"
                 />
               </div>
            </div>

            {/* --- SMART PAIR (UPSELL) --- */}
            {pairingItem && (
              <div className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-lg bg-orange-200 dark:bg-orange-800 shrink-0 overflow-hidden">
                     <img 
                       src={pairingItem.image} 
                       alt={pairingItem.name} 
                       className="w-full h-full object-cover"
                     />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide flex items-center gap-1">
                        <ChefHat size={10} /> Pairs best with
                      </span>
                      <span className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                        {pairingItem.name}
                      </span>
                   </div>
                </div>
                
                <button 
                  onClick={handleAddPairing}
                  disabled={addedPairing}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm
                    ${addedPairing 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white dark:bg-orange-900/30 text-[#FF5722] border-orange-200 dark:border-orange-500/30'}
                  `}
                >
                  {addedPairing ? 'Added' : `Add +₹${pairingItem.price}`}
                </button>
              </div>
            )}

            {/* --- ACTION FOOTER (IN SCROLL) --- */}
            <div className="pt-6 pb-2">
              <div className="flex flex-col gap-4">
                
                {/* Quantity Stepper (Centered) */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-6 bg-slate-100 dark:bg-white/5 rounded-full px-6 py-2">
                    <button 
                      onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                      className={`p-1 rounded-full transition-colors ${quantity > 1 ? 'hover:bg-slate-200 dark:hover:bg-white/10 text-[#0F172A] dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}
                    >
                      <Minus size={20} strokeWidth={2.5} />
                    </button>
                    <span className="text-xl font-bold w-6 text-center text-[#0F172A] dark:text-white">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-[#0F172A] dark:text-white transition-colors"
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Main Action */}
                <button 
                  onClick={() => {
                    onAddToCart(item, quantity, notes, selectedAddons, selectedSize || undefined);
                    handleClose();
                  }}
                  className="w-full py-4 bg-[#FF5722] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex justify-between px-6 items-center group"
                >
                  <span className="opacity-90 group-hover:opacity-100">Add to Order</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 font-medium">|</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default FoodDetailModal;