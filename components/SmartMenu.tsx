import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart, Search, Sparkles, Utensils, Plus, Check,
  Minus, X, User, Star
} from 'lucide-react';
import { UserPreferences } from '../services/db';
import FoodDetailModal from './FoodDetailModal';
import SmartCart, { CartItem } from './SmartCart';
import UpsellModal from './UpsellModal';
import { MenuItem, MenuItemSize } from './data';
import { FloatingStatusPill } from './FloatingStatusPill';
import { ScaleButton } from './animations';

interface SmartMenuProps {
  preferences: UserPreferences;
  onPlaceOrder: (items: CartItem[]) => void;
  onProfileClick: () => void;
  guestName: string;
  items?: MenuItem[];
  hasActiveOrder?: boolean;
  activeOrderStatus?: string;
  onCartCountChange?: (count: number) => void;
  onNavigate?: (view: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

// --- SHARED TYPES & HELPERS ---
export interface EnrichedMenuItem extends MenuItem {
  score: number;
  matchPercentage: number;
  matchReasons: string[];
  whyText: string;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

const formatText = (text: string) => {
  if (!text) return '';
  return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const DietaryIcon = ({ type }: { type: string }) => {
  const isVeg = type === 'veg' || type === 'vegetarian' || type === 'vegan';
  const colorClass = isVeg ? 'border-green-600' : 'border-red-600';
  const bgClass = isVeg ? 'bg-green-600' : 'bg-red-600';
  return (
    <div className={`w-3.5 h-3.5 border-[1.5px] ${colorClass} rounded-sm flex items-center justify-center p-[1px] shrink-0`}>
      <div className={`w-full h-full rounded-full ${bgClass}`} />
    </div>
  );
};

const RatingBadge = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 border border-yellow-100">
    <Star size={8} className="fill-yellow-500 text-yellow-500" />
    <span>{rating || 4.5}</span>
  </div>
);

export const QuantityStepper: React.FC<{ qty: number; onIncrease: (e: React.MouseEvent) => void; onDecrease: (e: React.MouseEvent) => void; variant?: 'default' | 'small'; }> = ({ qty, onIncrease, onDecrease, variant = 'default' }) => {
  return (
    <div onClick={(e) => e.stopPropagation()} className={`flex items-center bg-orange-50 border border-orange-200 rounded-lg overflow-hidden shadow-sm ${variant === 'small' ? 'h-7' : 'h-8'}`}>
      <button onClick={onDecrease} className={`flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors ${variant === 'small' ? 'w-7' : 'w-8 h-full'}`}><Minus size={14} strokeWidth={3} /></button>
      <div className={`flex items-center justify-center font-bold text-slate-900 bg-white ${variant === 'small' ? 'w-6 text-xs' : 'w-8 text-sm'}`}>{qty}</div>
      <button onClick={onIncrease} className={`flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors ${variant === 'small' ? 'w-7' : 'w-8 h-full'}`}><Plus size={14} strokeWidth={3} /></button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const SmartMenu: React.FC<SmartMenuProps> = ({ preferences, onPlaceOrder, onProfileClick, guestName, items, hasActiveOrder, activeOrderStatus, onNavigate, onCartCountChange, isLoading, error }) => {

  // --- SAFETY CHECK 1: LOGGING ---
  console.log("SmartMenu Rendering...", { isLoading, itemCount: items?.length });

  if (isLoading && (!items || items.length === 0)) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div><p className="font-medium animate-pulse">Loading Menu...</p></div>;
  if (error && (!items || items.length === 0)) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-red-500 p-8 text-center"><p className="font-bold text-lg mb-2">Message from Kitchen</p><p>{error}</p><button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg text-sm font-bold text-slate-700">Retry</button></div>;
  if (!items || items.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center"><Utensils size={48} className="mb-4 opacity-50" /><p className="font-medium">Menu is currently empty.</p></div>;

  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<EnrichedMenuItem | null>(null);
  const [showSmartCart, setShowSmartCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellTriggerItem, setUpsellTriggerItem] = useState<CartItem | undefined>(undefined);
  const [upsellRecommendation, setUpsellRecommendation] = useState<MenuItem | null>(null);

  // --- CRASH PROOF SESSION RECOVERY ---
  const [dbUser, setDbUser] = useState<{ name: string, preferences: any } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      console.log("Reading LocalStorage:", stored); // DEBUG
      if (stored && stored !== "undefined") {
        const parsed = JSON.parse(stored);
        setDbUser(parsed);
      }
    } catch (e) {
      console.error("CRASH PREVENTED: LocalStorage Read Failed", e);
      // Reset corrupt storage to prevent future crashes
      localStorage.removeItem('user');
    }
  }, []);

  const activeMenuItems = items || [];

  // --- SAFE USER LOGIC ---
  const currentUser = useMemo(() => {
    const name = (guestName && guestName !== 'Guest') ? guestName : (dbUser?.name || "Guest");
    const prefs = (preferences && Object.keys(preferences).length > 0) ? preferences : (dbUser?.preferences || {});
    return { name, preferences: prefs };
  }, [guestName, preferences, dbUser]);

  const activePreferences = currentUser.preferences;

  // --- INIT EFFECTS ---
  useEffect(() => {
    const rec = activeMenuItems.find(m => m.category === 'Beverages') || activeMenuItems[0];
    if (rec) setUpsellRecommendation(rec);
  }, [activeMenuItems]);

  useEffect(() => {
    if (onCartCountChange) onCartCountChange(cartItems.reduce((acc, item) => acc + item.quantity, 0));
  }, [cartItems, onCartCountChange]);

  const categories = ['All', 'Starters', 'Mains', 'Breads/Rice', 'Beverages', 'Dessert'];

  // --- CART ACTIONS ---
  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems(prev => prev.map(item => item.cartId === cartId ? (item.quantity + delta <= 0 ? null : { ...item, quantity: item.quantity + delta }) : item).filter(Boolean) as CartItem[]);
  };

  const handleClearCart = () => setCartItems([]);

  const handleQuickAdd = (item: MenuItem) => {
    const existing = cartItems.find(c => String(c.menuId) === String(item.id) && !c.notes && (!c.size || (item.type === 'portion' && item.sizes && c.size === item.sizes[item.sizes.length - 1].label)));
    if (existing) { handleUpdateQuantity(existing.cartId, 1); return; }

    setCartItems(prev => [...prev, {
      cartId: crypto.randomUUID(), menuId: item.id, name: item.name,
      price: item.type === 'portion' && item.sizes ? item.sizes[item.sizes.length - 1].price : item.price,
      quantity: 1, category: item.category,
      size: item.type === 'portion' && item.sizes ? item.sizes[item.sizes.length - 1].label : undefined,
      notes: '', image: item.image
    }]);
  };

  const handleDetailedAdd = (item: MenuItem, quantity: number, notes: string, addons: string[], size?: MenuItemSize) => {
    let finalPrice = size ? size.price : item.price;
    if (item.addons) addons.forEach(n => { const a = item.addons?.find(ad => ad.name === n); if (a) finalPrice += a.price; });
    setCartItems(prev => [...prev, {
      cartId: crypto.randomUUID(), menuId: item.id, name: item.name, price: finalPrice, quantity,
      category: item.category, size: size?.label, notes: [notes, ...addons].filter(Boolean).join(', '), image: item.image
    }]);
  };

  const handleRemoveItem = (cartId: string) => setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  const handleAddSuggestion = (suggestion: Omit<CartItem, 'cartId'>) => setCartItems(prev => [...prev, { ...suggestion, cartId: crypto.randomUUID() }]);

  const handleViewCartClick = () => {
    const spicyItemInCart = cartItems.find(c => {
      const originalItem = activeMenuItems.find(m => String(m.id) === String(c.menuId));
      return originalItem?.spiceLevel === 'fiery';
    });
    const hasBeverage = cartItems.some(c => c.category === 'Beverages');
    if (spicyItemInCart && !hasBeverage) {
      setUpsellTriggerItem(spicyItemInCart);
      const beverage = activeMenuItems.find(m => m.category === 'Beverages');
      if (beverage) { setUpsellRecommendation(beverage); setShowUpsell(true); } else { setShowSmartCart(true); }
    } else { setShowSmartCart(true); }
  };

  const handleUpsellAdd = () => {
    if (upsellRecommendation) handleQuickAdd(upsellRecommendation);
    setShowUpsell(false); setShowSmartCart(true);
  };

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  // --- RECOMMENDATION ENGINE (DEFENSIVE) ---
  const processedMenu = useMemo(() => {
    if (!activeMenuItems) return [];
    let list = activeMenuItems;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = activeMenuItems.filter(i => (i.name || "").toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q));
    }
    const catItems = activeCategory === 'All' ? list : list.filter(i => i.category === activeCategory);

    return catItems.map(item => {
      let score = 0; const reasons: string[] = []; const tags = item.tags || [];

      // --- PREFERENCE FIELD MAPPING ---
      // DB may send: cravings, healthGoals, dietary, allergies
      // Menu expects: moods, goals
      const moodList = activePreferences?.moods || activePreferences?.cravings || [];
      const goalList = activePreferences?.goals || activePreferences?.healthGoals || [];
      const dietaryPref = activePreferences?.dietary || activePreferences?.dietType || 'non-veg';
      const allergens = activePreferences?.allergens || activePreferences?.allergies || [];

      // Spicy/Mood matching
      if (moodList.includes('spicy') && (item.spiceLevel === 'fiery' || item.spiceLevel === 'medium' || tags.includes('spicy'))) { score += 25; reasons.push('Spicy Craving'); }
      if (moodList.includes('comfort') && tags.includes('comfort')) { score += 20; reasons.push('Comfort Food'); }
      if (moodList.includes('light') && (tags.includes('light') || tags.includes('healthy'))) { score += 15; reasons.push('Light Choice'); }

      // Goal matching
      goalList.forEach((g: string) => {
        const normalizedGoal = g.toLowerCase().replace(/[_-]/g, '');
        if (tags.some(t => t.toLowerCase().replace(/[_-]/g, '').includes(normalizedGoal))) { score += 15; reasons.push(formatText(g)); }
        if ((normalizedGoal === 'protein' || normalizedGoal === 'highprotein') && tags.includes('high_protein')) { score += 15; reasons.push('High Protein'); }
        if (normalizedGoal === 'keto' && tags.includes('keto')) { score += 20; reasons.push('Keto Friendly'); }
      });

      // Dietary match bonus
      if (dietaryPref === 'veg' && (item.dietaryType === 'veg' || item.dietaryType === 'vegetarian')) { score += 10; }
      if (dietaryPref === 'non-veg' && item.dietaryType === 'non-veg') { score += 5; }

      // Bestseller/popular boost
      if (tags.includes('bestseller') || tags.includes('popular')) { score += 10; reasons.push('Bestseller'); }

      return { ...item, score: 60 + score, matchPercentage: Math.min(99, Math.max(60, 60 + score)), matchReasons: reasons, whyText: reasons[0] ? `Matches ${reasons[0]}` : "Chef's Pick" };
    }).sort((a, b) => b.score - a.score);
  }, [preferences, activeCategory, searchQuery, activeMenuItems, activePreferences]);

  const { topPicks, standardItems } = useMemo(() => {
    // ALWAYS show top 3 highest-scoring items as Top Picks (relaxed threshold)
    // This ensures the section is always visible for logged-in users
    const sortedByScore = [...processedMenu].sort((a, b) => b.score - a.score);
    const top3 = sortedByScore.slice(0, 3);
    const top3Ids = new Set(top3.map(i => i.id));
    const remaining = sortedByScore.filter(i => !top3Ids.has(i.id));
    return { topPicks: top3, standardItems: remaining };
  }, [processedMenu]);

  const pairingItem = useMemo(() => {
    if (!selectedItem?.pairingId) return undefined;
    return activeMenuItems.find(i => String(i.id) === String(selectedItem.pairingId));
  }, [selectedItem, activeMenuItems]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-slate-900">
              Hi, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Smart Feed Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSearchActive(!isSearchActive)} className="w-10 h-10 rounded-full bg-slate-50 flex justify-center items-center hover:bg-slate-100"><Search size={20} /></button>
            <button onClick={onProfileClick} className="w-10 h-10 rounded-full bg-slate-50 flex justify-center items-center hover:bg-slate-100"><User size={20} /></button>
          </div>
        </div>
        {isSearchActive && (
          <div className="px-4 pb-4"><div className="flex items-center bg-gray-100 rounded-xl px-4 py-2"><Search size={18} className="text-gray-400 mr-2" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full" autoFocus />{searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} /></button>}</div></div>
        )}
        <div className="flex overflow-x-auto no-scrollbar px-5 gap-6 pt-1 pb-3 scrollbar-hide">
          {categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap pb-2 text-sm font-medium border-b-2 ${activeCategory === cat ? 'text-[#FF5722] border-[#FF5722]' : 'text-slate-400 border-transparent'}`}>{cat}</button>)}
        </div>
      </header>

      {/* TOP PICKS */}
      {topPicks.length > 0 && activeCategory === 'All' && !searchQuery && (
        <div className="mt-5">
          <div className="px-5 mb-3 flex items-center gap-2"><span className="text-amber-500 text-sm">✨</span><h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Top Picks for You</h2></div>
          <div className="grid grid-flow-col gap-2 overflow-x-auto px-5 pb-8 scrollbar-hide snap-x">
            {topPicks.map(item => {
              // Defensive check: If 'available' is missing, assume TRUE
              const isAvailable = item.available !== false;
              const hasStock = item.stock !== 0;
              const isSoldOut = !isAvailable || !hasStock;

              return (
                <div key={item.id} onClick={() => !isSoldOut && setSelectedItem(item)} className="snap-start w-72 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative group transition-transform hover:scale-[1.02]">
                  <div className="h-32 w-full relative bg-slate-100">
                    <img src={item.image} className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-70' : ''}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
                    {!isSoldOut && <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-[#FFD700] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 shadow-sm"><span>⚡</span> {item.matchPercentage}% Match</div>}
                    {isSoldOut && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"><span className="text-white font-black text-xl border-2 border-white px-4 py-1">SOLD</span></div>}
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1"><h3 className="font-bold text-sm text-slate-900 truncate pr-2">{item.name}</h3><RatingBadge rating={4.8} /></div>
                    <div className="flex items-center gap-1 mb-3"><span className="text-orange-600 text-[10px]">⚡</span><p className="text-[10px] font-bold text-orange-700 truncate">{item.whyText}</p></div>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="text-sm font-bold text-slate-500">₹{item.price}</p>
                      {(() => {
                        const cartItem = cartItems.find(c => String(c.menuId) === String(item.id) && !c.notes && (!c.size || (item.type === 'portion' && item.sizes && c.size === item.sizes[item.sizes.length - 1].label)));
                        return cartItem ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <QuantityStepper qty={cartItem.quantity} onIncrease={() => handleUpdateQuantity(cartItem.cartId, 1)} onDecrease={() => handleUpdateQuantity(cartItem.cartId, -1)} variant="small" />
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }} disabled={isSoldOut} className={`px-3 py-1.5 h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm bg-[#FF5722] text-white hover:bg-orange-600 active:scale-95 transition-all ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}>ADD</button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL MENU */}
      <div className="px-0 space-y-0 divide-y divide-slate-100">
        <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 mb-2 sticky top-[110px] z-30 backdrop-blur-md"><h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{activeCategory === 'All' ? 'Full Menu' : activeCategory}</h2></div>
        {(activeCategory === 'All' ? standardItems : processedMenu).map(item => {
          const isAvailable = item.available !== false;
          const hasStock = item.stock !== 0;
          const isSoldOut = !isAvailable || !hasStock;
          const cartItem = cartItems.find(c => String(c.menuId) === String(item.id) && !c.notes && !c.size);
          return (
            <div key={item.id} onClick={() => !isSoldOut && setSelectedItem(item)} className="relative flex flex-row p-4 bg-white cursor-pointer active:bg-slate-50">
              <div className="flex-1 flex flex-col min-w-0 pr-4">
                <h3 className={`font-bold text-[17px] text-slate-800 leading-tight mb-1 ${isSoldOut ? 'text-gray-400 line-through' : ''}`}>{item.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2"><span className="font-bold text-lg text-slate-900">₹{item.price}</span><RatingBadge rating={4.5} /></div>
                  {cartItem ? <div onClick={(e) => e.stopPropagation()}><QuantityStepper qty={cartItem.quantity} onIncrease={() => handleUpdateQuantity(cartItem.cartId, 1)} onDecrease={() => handleUpdateQuantity(cartItem.cartId, -1)} variant="small" /></div> : <button onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }} disabled={isSoldOut} className={`px-4 py-1.5 h-8 rounded-full text-xs font-bold transition-all border flex items-center gap-1 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 active:scale-95 ${isSoldOut ? 'grayscale opacity-50 cursor-not-allowed' : ''}`}>{isSoldOut ? 'SOLD' : 'ADD +'}</button>}
                </div>
              </div>
              <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                <img src={item.image} className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
                {isSoldOut && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"><span className="text-white text-[10px] font-bold uppercase tracking-wider border border-white px-2 py-0.5 rounded">SOLD</span></div>}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1 rounded shadow-sm z-10"><DietaryIcon type={item.dietaryType || (item.tags?.includes('non-veg') ? 'non-veg' : 'veg')} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- CART BAR: Fixed Bottom (Classic Style) --- */}
      <div className={`fixed bottom-0 left-0 w-full z-50 bg-white border-t border-slate-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform duration-300 ${cartCount > 0 ? 'translate-y-0' : 'translate-y-full'}`}>

        {/* Keep the floating status tracker if an order exists */}
        {activeOrderStatus && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[60] w-full flex justify-center">
            <FloatingStatusPill status={activeOrderStatus as any} onClick={() => onNavigate && onNavigate('tracker')} isSplitView={false} />
          </div>
        )}

        <button
          onClick={handleViewCartClick}
          className="w-full bg-[#FF5722] text-white h-12 rounded-lg shadow-sm flex items-center justify-between px-5 font-bold text-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white/20 border border-white/10 text-white text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center">
              {cartCount}
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs font-medium opacity-90 uppercase tracking-wider">Total</span>
              <span>View Cart</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">₹{cartTotal}</span>
            <Check size={16} strokeWidth={3} className="opacity-50" />
          </div>
        </button>
      </div>

      {selectedItem && <FoodDetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} pairingItem={pairingItem} preferences={preferences} onAddToCart={handleDetailedAdd} />}
      {showUpsell && upsellRecommendation && <UpsellModal isOpen={showUpsell} onClose={() => { setShowUpsell(false); setShowSmartCart(true); }} onProceed={() => { setShowUpsell(false); setShowSmartCart(true); }} onAdd={handleUpsellAdd} triggerItem={upsellTriggerItem} upsellItem={upsellRecommendation} />}
      {showSmartCart && <SmartCart isOpen={showSmartCart} onClose={() => setShowSmartCart(false)} preferences={preferences} cartItems={cartItems} onRemoveItem={handleRemoveItem} onAddItem={handleAddSuggestion} onUpdateQuantity={handleUpdateQuantity} onClearCart={handleClearCart} onViewKitchen={() => { }} onPlaceOrder={onPlaceOrder} />}
    </div>
  );
};

export default SmartMenu;