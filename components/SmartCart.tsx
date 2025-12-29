import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Trash2,
  ChevronLeft,
  Zap,
  ChefHat,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Plus,
  Tag,
  X,
  Check
} from 'lucide-react';
import { UserPreferences } from '../services/db';
import { QuantityStepper } from './SmartMenu';
import { OffersModal } from './OffersModal';
import { playSound } from '../utils/SoundManager';

// --- TYPES ---
export interface CartItem {
  cartId: string; // Unique identifier for the cart entry
  menuId: string; // Reference to the menu item
  name: string;
  price: number;
  quantity: number;
  category: string;
  size?: string;
  notes?: string;
  image?: string; // Added image property
}

interface SmartCartProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  cartItems: CartItem[];
  onRemoveItem: (cartId: string) => void;
  onAddItem: (item: Omit<CartItem, 'cartId'>) => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onClearCart: () => void;
  onViewKitchen: () => void;
  onPlaceOrder: (items: CartItem[]) => void; // New callback
}

// Fallback image constant
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

// Potential Upsell Items with Images
const UPSELL_ITEMS = {
  beverage: {
    menuId: 'be1',
    name: 'Fresh Lime Soda',
    price: 80,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop'
  },
  bread: {
    menuId: 'b1',
    name: 'Kerala Parotta',
    price: 40,
    category: 'Breads/Rice',
    image: 'https://images.unsplash.com/photo-1625475172084-5f532a2f8c05?q=80&w=1000&auto=format&fit=crop'
  },
  dessert: {
    menuId: 'd1',
    name: 'Palada Payasam',
    price: 180,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1628169604754-583b6329007f?q=80&w=1000&auto=format&fit=crop'
  }
};

const SmartCart: React.FC<SmartCartProps> = ({
  isOpen,
  onClose,
  preferences,
  cartItems,
  onRemoveItem,
  onAddItem,
  onUpdateQuantity,
  onClearCart,
  onViewKitchen,
  onPlaceOrder
}) => {
  // Changed from single suggestion to array
  const [suggestions, setSuggestions] = useState<Array<{ text: string; item: Omit<CartItem, 'cartId'> & { image: string } }>>([]);

  // Coupon State
  const [showOffers, setShowOffers] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- 1. AI GAP ANALYSIS LOGIC (Multi-Suggestion) ---
  useEffect(() => {
    const newSuggestions = [];

    const hasCategory = (cat: string) => cartItems.some(i => i.category === cat || (cat === 'Mains' && i.category === 'Mains'));
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Skip if empty
    if (cartItems.length === 0) {
      setSuggestions([]);
      return;
    }

    const hasFood = hasCategory('Mains') || hasCategory('Starters') || hasCategory('Breads/Rice');

    // Scenario A: Thirsty? (Has Food, No Drink)
    const hasDrink = hasCategory('Beverages');
    if (hasFood && !hasDrink) {
      newSuggestions.push({
        text: "Wash it down 🥤",
        item: { ...UPSELL_ITEMS.beverage, quantity: 1 }
      });
    }

    // Scenario B: No Carbs? (Has Curry, No Bread)
    const hasCurry = hasCategory('Mains');
    const hasBread = hasCategory('Breads/Rice');
    if (hasCurry && !hasBread) {
      newSuggestions.push({
        text: "Best with Gravy 🥘",
        item: { ...UPSELL_ITEMS.bread, quantity: 2 }
      });
    }

    // Scenario C: Celebration? (High Bill, No Dessert)
    const hasDessert = hasCategory('Dessert');
    if (cartTotal > 500 && !hasDessert) {
      newSuggestions.push({
        text: "Sweet Finish 🍮",
        item: { ...UPSELL_ITEMS.dessert, quantity: 1 }
      });
    }

    setSuggestions(newSuggestions);

  }, [cartItems]);

  // Reset coupon if cart becomes empty
  useEffect(() => {
    if (cartItems.length === 0) {
      setCouponCode(null);
      setDiscountAmount(0);
    }
  }, [cartItems]);

  // --- HANDLERS ---
  const handleAddSuggestion = (suggestionItem: Omit<CartItem, 'cartId'>) => {
    onAddItem(suggestionItem);
  };

  const handlePlaceOrder = () => {
    // Audio Feedback
    playSound('success_chime');

    // Notify parent to start tracking
    onPlaceOrder(cartItems);
    // Clear cart and close
    onClearCart();
    setCouponCode(null);
    setDiscountAmount(0);
    onClose();
  };

  const handleApplyCoupon = (code: string, discount: number, desc: string) => {
    setCouponCode(code);
    setDiscountAmount(discount);
    setToastMessage(desc || "Coupon Applied!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRemoveCoupon = () => {
    setCouponCode(null);
    setDiscountAmount(0);
  };

  // --- CALCULATIONS ---
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Apply discount to subtotal logic
  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);

  const gst = Math.round(effectiveSubtotal * 0.05);
  const serviceCharge = Math.round(effectiveSubtotal * 0.025); // 2.5% optional
  const total = effectiveSubtotal + gst + serviceCharge;

  if (!isOpen) return null;

  // --- MAIN CART VIEW ---
  return (
    <div className="fixed inset-0 z-[60] bg-[#FAFAFA] dark:bg-[#0F172A] flex flex-col h-full animate-slide-in-right">

      {/* 1. HEADER */}
      <header className="px-5 py-4 bg-white dark:bg-[#0F172A] border-b border-slate-100 dark:border-white/5 flex items-center gap-3 shadow-sm z-10">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-display font-bold text-[#0F172A] dark:text-white">
          Review Order
        </h1>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

        {/* 2. SAFETY SEAL */}
        <div className="px-5 py-4">
          <div className={`
            flex items-center gap-3 p-4 rounded-xl border
            ${preferences.allergens.length > 0
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30'
              : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30'}
          `}>
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-green-800 dark:text-green-300 leading-tight">
                {preferences.allergens.length > 0
                  ? `Order is ${preferences.allergens[0].charAt(0).toUpperCase() + preferences.allergens[0].slice(1)}-Free & Safe`
                  : 'Kitchen is ready for your order'}
              </h3>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Checked against your dietary profile.
              </p>
            </div>
          </div>
        </div>

        {/* 3. ORDER LIST (RECEIPT STYLE - Updated with Images) */}
        <div className="px-5 space-y-3">
          {cartItems.map((item) => (
            <div key={item.cartId} className="flex items-start gap-3 bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">

              {/* Item Image */}
              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-white/10 shrink-0 overflow-hidden">
                <img
                  src={item.image || FALLBACK_IMAGE}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[64px] justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1 leading-tight">{item.name}</span>
                    {(item.size || item.notes) && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.size} {item.size && item.notes && '•'} {item.notes}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.cartId)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <QuantityStepper
                    qty={item.quantity}
                    onIncrease={() => onUpdateQuantity(item.cartId, 1)}
                    onDecrease={() => onUpdateQuantity(item.cartId, -1)}
                    variant="small"
                  />
                  <span className="text-sm font-bold text-[#0F172A] dark:text-white">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {cartItems.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-slate-400 font-medium">Your cart is empty.</p>
            </div>
          )}
        </div>

        {/* 4. AI GAP ANALYSIS (UPSELL - Multi) */}
        {suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="px-5 text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-3">
              <Zap size={14} className="text-blue-500 fill-blue-500" />
              Complete your meal
            </h3>

            <div className="w-full overflow-x-auto flex gap-3 px-5 pb-4 no-scrollbar">
              {suggestions.map((sug, index) => (
                <div
                  key={index}
                  className="min-w-[160px] w-40 bg-white dark:bg-[#1E293B] border border-blue-100 dark:border-blue-900/30 rounded-xl overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="h-20 w-full relative bg-slate-100">
                    <img
                      src={sug.item.image || FALLBACK_IMAGE}
                      alt={sug.item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5 truncate">
                      {sug.text}
                    </span>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight mb-2 line-clamp-2 flex-1">
                      {sug.item.name}
                    </h4>

                    <button
                      onClick={() => handleAddSuggestion(sug.item)}
                      className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      Add +₹{sug.item.price * sug.item.quantity}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. COUPON SECTION (NEW) */}
        {cartItems.length > 0 && (
          <div className="px-5 mt-6">
            <button
              onClick={() => setShowOffers(true)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-[#FF5722] hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-[#FF5722] group-hover:bg-[#FF5722]/10 transition-colors">
                  <Tag size={16} />
                </div>
                {couponCode ? (
                  <div className="text-left">
                    <span className="block text-sm font-bold text-[#FF5722]">{couponCode}</span>
                    <span className="block text-xs text-green-600 dark:text-green-400">₹{discountAmount} saved</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Apply Coupon</span>
                )}
              </div>
              {couponCode ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveCoupon(); }}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 underline"
                >
                  Remove
                </button>
              ) : (
                <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        )}

        {/* 6. BILL BREAKDOWN */}
        <div className="mx-5 mt-6 pt-6 border-t border-dashed border-slate-300 dark:border-slate-700">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>

            {/* Tax Details Hidden for Cleaner Cart */}
            {/* 
            {discountAmount > 0 && ( ... )}
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
               <span>GST (5%)</span>
               <span>₹{gst}</span>
            </div>
            ...
            */}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold text-lg text-[#0F172A] dark:text-white">Item Total</span>
            <span className="font-bold text-xl text-[#0F172A] dark:text-white">₹{subtotal}</span>
          </div>
        </div>

      </div>

      {/* 7. FOOTER: PLACE ORDER BUTTON (Refactored) */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F172A] border-t border-gray-200 dark:border-white/5 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[60]">
        <div className="w-full max-w-md mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0}
            className={`
               w-full bg-orange-600 text-white font-bold py-3 rounded-lg flex justify-center items-center uppercase tracking-wider hover:bg-orange-700 transition-all active:scale-95
               ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''}
             `}
          >
            PLACE ORDER
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] px-4 py-3 rounded-full text-sm font-bold shadow-xl animate-fade-in-up whitespace-nowrap z-[100] flex items-center gap-2">
          <Check size={16} className="text-green-500" strokeWidth={3} />
          {toastMessage}
        </div>
      )}

      {/* Offers Modal */}
      <OffersModal
        isOpen={showOffers}
        onClose={() => setShowOffers(false)}
        cartTotal={subtotal}
        cartItems={cartItems}
        onApply={handleApplyCoupon}
      />

    </div>
  );
};

export default SmartCart;