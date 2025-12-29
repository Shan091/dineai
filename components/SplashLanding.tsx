import React, { useState, useEffect } from 'react';

import { Sparkles, Loader2, ChefHat, ChevronRight, Utensils, ChevronDown, User, ArrowRight } from 'lucide-react';

import ConciergeWizard from './ConciergeWizard';

import SmartMenu from './SmartMenu';

import { MENU_ITEMS, MenuItem } from './data'; // Correct Import

import { OrderTracker, OrderStatus } from './OrderTracker';

import FloatingStatusPill from './FloatingStatusPill';

import SettingsModal from './SettingsModal';

import { db, UserPreferences } from '../services/db';

import { CartItem } from './SmartCart';

import { playSound } from '../utils/SoundManager';

import { api } from '../services/api';



const COUNTRY_CODES = [

  { code: '+91', label: 'IND' },

  { code: '+1', label: 'US' },

  { code: '+44', label: 'UK' },

  { code: '+61', label: 'AU' },

  { code: '+86', label: 'CN' },

  { code: '+971', label: 'UAE' },

];



type ViewState = 'landing' | 'menu' | 'tracker' | 'payment';



interface SplashLandingProps {

  onNavigate: (page: 'landing' | 'kitchen' | 'service') => void;

  onPlaceOrder: (items: CartItem[], guestName: string, tableId: string) => void;

  onCancelOrder: () => void;

  onRequestService: (type: string) => void;

  guestOrderStatus?: OrderStatus;

  guestOrder?: any; // Full Ticket Object

  items?: MenuItem[]; // Prop from App.tsx (single source of truth)

  isLoading?: boolean;

  error?: string | null;

}



import { useRestaurant } from '../context/RestaurantContext';



// ... (imports)



const SplashLanding: React.FC<SplashLandingProps> = ({

  onNavigate,

  onPlaceOrder,

  onCancelOrder,

  onRequestService,

  guestOrderStatus,

  guestOrder,

  items,

  isLoading: isMenuLoading,

  error: menuError

}) => {

  const { guestSession, loginGuest, logoutGuest, updateGuestView, updateGuestPreferences } = useRestaurant();



  const [countryCode, setCountryCode] = useState<string>('+91');

  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [error, setError] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);



  const [isShaking, setIsShaking] = useState<boolean>(false);

  // NEW: State to toggle between Welcome and Login form without checking user status

  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Two-Step logic removed by user request.





  // App State Management

  // Initialize view based on session persistence

  const [currentView, setCurrentView] = useState<ViewState>(() => {

    return (guestSession?.view as ViewState) || (guestSession ? 'menu' : 'landing');

  });



  // --- 0. AUTO-REDIRECT REMOVED (Always show login) ---

  /*
  
  useEffect(() => {
  
  if (guestSession && currentView === 'landing') {
  
  const timer = setTimeout(() => {
  
  console.log("⚡ Auto-Redirecting to Menu...");
  
  setCurrentView('menu');
  
  }, 1500);
  
  return () => clearTimeout(timer);
  
  }
  
  }, [guestSession, currentView]);
  
  */

  // --- AUTO-REDIRECT TO TRACKER WHEN ORDER SERVED ---
  // When the order status becomes 'served', auto-switch to tracker view
  // so the customer sees the payment option.
  useEffect(() => {
    if (guestOrderStatus === 'served' && currentView === 'menu') {
      console.log("🍽️ Order served! Redirecting to Order Tracker...");
      setCurrentView('tracker');
    }
  }, [guestOrderStatus, currentView]);


  // Sync View Changes to Context for Persistence

  useEffect(() => {

    if (guestSession && currentView !== 'landing') {

      // Only update if it's different to avoid loops, though context check handles it

      if (guestSession.view !== currentView) {

        updateGuestView(currentView);

      }

    }

  }, [currentView, guestSession]); // We depend on currentView changes primarily



  const [showWizard, setShowWizard] = useState<boolean>(false);

  const [showSettings, setShowSettings] = useState<boolean>(false);




  // Identity State

  const [verifiedPhone, setVerifiedPhone] = useState<string>('');

  const [userPrefs, setUserPrefs] = useState<UserPreferences | undefined>(undefined);

  const [isReturningUser, setIsReturningUser] = useState<boolean>(false);



  // Sync local state with Global Context Session

  const [guestName, setGuestName] = useState<string>(guestSession?.name || 'Guest');

  const [tableNumber, setTableNumber] = useState<string>(guestSession?.tableId || '4');



  // Update local state when context changes (e.g. hydration happens late)

  useEffect(() => {

    if (guestSession) {

      setGuestName(guestSession.name);

      setTableNumber(guestSession.tableId);

      // Logic: If on landing, switch to persisted view.

      // If already on a view, do we override? Maybe not if user just navigated.

      // But for initial load, currentView state initializer handles it IF guestSession is ready.

      // If guestSession comes in LATE (after initial render), we need to switch.

      if (currentView === 'landing' && guestSession.view) {

        setCurrentView(guestSession.view as ViewState);

      } else if (currentView === 'landing') {

        setCurrentView('menu'); // Fallback

      }

    } else {

      // If guestSession is wiped (Logout), force Landing

      if (currentView !== 'landing') setCurrentView('landing');

    }

  }, [guestSession]);




  // Active Order Items (Local copy for tracker display)

  const [activeItems, setActiveItems] = useState<CartItem[]>([]);

  const [cartCount, setCartCount] = useState<number>(0);



  // DEBUG: Trace Navigation

  console.log("RENDER SplashLanding", { currentView, hasPrefs: !!userPrefs, guestOrderStatus });



  // Secret Tap State

  const [secretClicks, setSecretClicks] = useState<number>(0);



  // Use passed items or fallback

  const menuItems = items || MENU_ITEMS;



  // ... (Rest of component)



  // --- SMART TABLE DETECTION ---

  // --- EFFECT: SESSION CHECK ---

  useEffect(() => {

    // 1. Table Detection

    const params = new URLSearchParams(window.location.search);

    const tableParam = params.get('table');

    if (tableParam) {

      setTableNumber(tableParam);

    }



    // 2. Identity Check

    const storedName = localStorage.getItem('guestName');

    if (storedName && storedName !== 'Guest') {

      setGuestName(storedName);

      setIsReturningUser(true);

    }



    // 3. SESSION RECOVERY (Backend Check)

    const checkSession = async () => {

      const tId = tableParam || tableNumber;

      if (!tId) return;



      try {

        const session = await api.getSession(tId);

        if (session.active) {

          console.log("🔄 RECOVERING SESSION:", session);

          setGuestName(session.guestName || "Guest");

          setIsReturningUser(true); // Treat as returning

          setVerifiedPhone('RECOVERED'); // Fake it to bypass wizard check if needed

          setCurrentView('tracker'); // FORCE REDIRECT

        }

      } catch (e) {

        // Ignore connection errors, let user login manually

      }

    };

    checkSession();



  }, []);



  // Sync View with Status

  useEffect(() => {

    if (guestOrderStatus === 'served') {

      console.log("✅ Order Served! Redirecting to Payment/Tracker View");

      playSound('success_chime');

      setCurrentView('tracker');

    }

  }, [guestOrderStatus]);



  // Sync Active Items from Backend Order (Recovery)

  useEffect(() => {

    if (guestOrder && guestOrder.items && activeItems.length === 0) {

      console.log("🔄 SYNCING ITEMS FROM BACKEND:", guestOrder.items);

      const restoredItems: CartItem[] = (guestOrder.items as any[]).map((i: any, idx: number) => ({

        cartId: `restored-${idx}`,

        menuId: 'uk',

        name: i.name,

        price: i.price,

        quantity: i.quantity,

        category: 'Mains',

        notes: i.notes

      }));

      setActiveItems(restoredItems);

      if (guestOrder.guestName) setGuestName(guestOrder.guestName);

    }

  }, [guestOrder]);



  // Secret Tap Logic

  useEffect(() => {

    let timer: ReturnType<typeof setTimeout>;

    if (secretClicks > 0) {

      timer = setTimeout(() => setSecretClicks(0), 2000);

    }



    if (secretClicks >= 5) {

      onNavigate('kitchen');

      setSecretClicks(0);

    }



    return () => clearTimeout(timer);

  }, [secretClicks, onNavigate]);



  const formatPhoneNumber = (value: string) => {

    if (!value) return value;

    const phoneNumber = value.replace(/[^\d]/g, '');

    const trimmed = phoneNumber.slice(0, 10);

    if (trimmed.length <= 5) return trimmed;

    return `${trimmed.slice(0, 5)} ${trimmed.slice(5)}`;

  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (isLoading) return;

    const formatted = formatPhoneNumber(e.target.value);

    setPhoneNumber(formatted);

    if (error) setError(false);

  };



  const validateAndSubmit = async () => {

    const rawDigits = phoneNumber.replace(/[^\d]/g, '');



    if (rawDigits.length !== 10) {

      setError(true);

      setIsShaking(true);

      setTimeout(() => setIsShaking(false), 500);

      return;

    }



    setIsLoading(true);



    try {

      const fullNumber = `${countryCode} ${rawDigits}`;



      // USER REQUEST: Clear old session BEFORE logging in new user

      console.log("🧹 Clearing old session before new login...");

      localStorage.removeItem('dineai_user_id');

      localStorage.removeItem('dineai_guest_session');

      localStorage.removeItem('guestName');

      localStorage.removeItem('userPrefs');

      logoutGuest(); // Context clear



      // REAL BACKEND LOGIN (Upsert)

      // We log them in to check if they are new or returning

      // Note: We don't have the NAME yet for a new user, that's tricky.

      // The prompt said: "POST /api/users/login Accepts { name, phone }"

      // But here we only have phone.

      // Strategy: Login with "Guest" first? Or ask name?

      // The current UI asks for Phone first.

      // If I send "Guest", I might overwrite a real name?

      // Wait, backend upsert logic: if found, update lastVisit/Name.

      // If I send "Guest" for an existing "Arun", I overwrite it!

      // FIX: Check if we can find by phone without updating?

      // No, `loginUser` is an upsert.

      // User Request 2: "If Not Found: Create a new User".

      // Let's assume for this flow, we need to ask Name if it's a new user?

      // OR: The Wizard collects the name.

      // So:

      // 1. Just check existence? No endpoint for that.

      // 2. Let's use a temporary name or modify backend to NOT overwrite if name is missing/default?

      // Let's trust the Wizard flow.

      // For now, let's pass a placeholder "Pending" name or just the phone as name?

      // Actually, standard flow: Enter Phone -> OTP -> (If new) Enter Name.

      // Here: Enter Phone -> (Backend checks).

      // Let's call `api.loginUser` with a SAFE name.

      // Backend Logic: `update_data = { name: login_data.name ... }`

      // It DOES overwrite.



      // ALTERNATIVE:

      // We can't use loginUser yet if it overwrites name.

      // But wait! The PROMPT says: "Accepts { name, phone }".

      // My `SplashLanding` only has Phone input at this stage.

      // I should probably ASK for name in Wizard, THEN login?

      // But I need to know if they are returning to skip wizard.



      // Let's modify Backend `login_user` to OPTIONALLY update name.

      // (I can't do that now without switching files, but I can send `undefined` or check in backend?)

      // Backend: `name: str` is required in schema.



      // Let's Look at `ConciergeWizard`. It asks for Name.

      // So the flow should be:

      // 1. Phone entered.

      // 2. Wizard opens.

      // 3. User fills details.

      // 4. `onComplete` -> triggers `loginGuest` with Name + Phone.



      // BUT `SplashLanding` tries to welcome returning users!

      // To do that, I need to look them up.

      // Let's add a `checkUser(phone)` to API? The user didn't ask for it, but implied we should know.

      // "If Not Found: Create".



      // WORKAROUND strictly following instructions:

      // The User said: "Logic (Upsert): ... If Found: Update lastVisit...".

      // It implies a one-step login.

      // If I send name="Guest", I break "Arun".



      // Let's assume I should change the UI to ask Name + Phone together?

      // "Implementing a persistent User Database... When a user enters their phone number..."



      // Let's stick to the existing `db.getUser` pattern but mapped to API `getUser`?

      // But `getUser` takes ID, not phone.

      // The backend has `POST /api/users/login`.



      // DECISION:

      // I will use `api.loginUser` but I will Modify `SplashLanding` to NOT call it immediately on Phone Submit if I can't guarantee safety.

      // OR simpler: validation just opens Wizard.

      // Wizard asks Name.

      // `handleWizardComplete` calls `loginGuest`.



      // BUT I lose the "Welcome Back" feature?

      // Unless `api.loginUser` is smart.

      // Let's modify `services/api.ts` to allow checking? No, user didn't ask.



      // Let's go with:

      // Enter Phone.

      // Open Wizard.

      // Initial Step of Wizard: "What's your name?" (Pre-filled if we knew it? We don't).

      // Wait, if I'm returning, I don't want to enter name again.



      // OK, I will modify `backend/main.py` very quickly to ONLY update name if it's not "Guest" or something.

      // No, let's keep it simple.

      // I will assume for now we just proceed to Wizard, and Wizard calls Login.

      // OR, I can try to find a user by using a new endpoint `POST /api/users/lookup {phone}`?

      // Not in requirements.



      // Let's just pass `name: "Guest"` and hope the Backend doesn't nuke it?

      // I will assume the user considers "Phone" as the ID.

      // If I login as "Guest" + "999...", and backend has "Arun" + "999...",

      // backend updates name to "Guest". That is bad.



      // I Will modify the Frontend `validateAndSubmit` to just set the phone state and show Wizard.

      // The Wizard will be responsible for gathering the Name.

      // Once Wizard completes (or skips), we call `loginGuest` with (Name, Phone).



      setVerifiedPhone(fullNumber);



      // NEW LOGIC: Check User Existence First

      console.log("🔍 Checking if user exists:", fullNumber);

      const check = await api.checkUser(fullNumber);



      // UNIFIED FLOW: Always proceed to Login/Wizard

      // If user exists, use their name. If not, use 'Guest'.

      const initialName = check.exists && check.name ? check.name : 'Guest';

      console.log(check.exists ? `✅ User Exists: ${initialName}` : "🆕 New User - Proceeding as Guest");



      if (check.exists) {

        try {

          // --- PERSISTENCE: Returning User ---

          const userData = await api.loginUser(initialName, fullNumber);



          const sessionUser = {

            name: userData.name || userData.username || initialName,

            // 1. Map Database Fields to App Format

            preferences: userData.preferences || {

              // Handle flat structure if DB is different

              cravings: userData.cravings || userData.moods || ["spicy"],

              healthGoals: userData.goals || userData.healthGoals || ["keto"],

              dietary: userData.dietType || userData.dietary || "non-veg",

              allergies: userData.allergies || userData.allergens || [],

              // Add required fields for TS adaptation

              diningContext: userData.diningContext || ["dine-in"],

              spiceLevel: userData.spiceLevel || "medium"

            }

          };



          // 2. Save to Local Storage (The Bridge)

          localStorage.setItem('user', JSON.stringify(sessionUser));

          localStorage.setItem('currentUser', JSON.stringify(sessionUser)); // Redundancy for key mismatch safety



          // 3. Log for debugging

          console.log("✅ [Returning] Login Session Saved:", sessionUser);



          setUserPrefs(userData.preferences); // Load prefs into state for Wizard pre-fill

        } catch (err) {

          console.error("Login fetch failed", err);

        }

      }



      setGuestName(initialName);

      setIsReturningUser(check.exists);



      // Log them in immediately to establish session

      loginGuest(initialName, fullNumber, tableNumber);



      // Always show Wizard (Preferences)

      // Note: Wizard handles skipping name input if isReturningUser is true (based on props)

      setShowWizard(true);



    } catch (e) {

      console.error("Validation failed", e);

      setError(true);

    } finally {

      setIsLoading(false);

    }

  };











  const handleSwitchAccount = () => {

    console.log("🔄 Switching Account Mode...");

    // Just toggle UI to show form. The actual cleanup happens ON LOGIN SUBMIT.

    setIsSwitching(true);



    // Reset local inputs for clean experience

    setPhoneNumber('');

    setCountryCode('+91');

    setError(false);

  };



  const handleDeleteData = async () => {

    if (!guestSession?.id && !localStorage.getItem('dineai_user_id')) return;



    if (confirm("Are you sure you want to delete your data? This cannot be undone.")) {

      try {

        const uid = guestSession?.id || localStorage.getItem('dineai_user_id');

        // Direct Axios call as requested

        // Note: Ensure axios is imported or use fetch

        await fetch(`http://127.0.0.1:8000/api/users/${uid}`, { method: 'DELETE' });

        alert("Data deleted.");

        handleSwitchAccount();

      } catch (e) {

        console.error("Delete failed", e);

        alert("Delete failed, but clearing local session.");

        handleSwitchAccount();

      }

    }

  };



  const handleGuestLogin = () => {

    const guestPrefs: UserPreferences = {

      dietary: 'non-veg',

      allergens: [],

      spiceLevel: 'medium',

      cravings: [],

      healthGoals: [],

      diningContext: []

    };

    setUserPrefs(guestPrefs);

    // Use a dummy phone for guest to allow backend creation if needed, or handle in context?

    // Context requires phone.



    // Clear session for Guest Mode too

    localStorage.removeItem('dineai_user_id');

    logoutGuest();



    loginGuest('Guest', `GUEST-${Date.now()}`, tableNumber, guestPrefs); // Persist with unique guest ID

    setCurrentView('menu');

  };



  // --- WIZARD HANDLERS ---

  const handleWizardComplete = async () => {

    // Determine Name: From state (if set by Wizard onSessionInfo) or default?

    // onSessionInfo sets `guestName`.

    // verifiedPhone is set.



    try {

      // --- PERSISTENCE: New/Updated User ---

      // Fetch latest state after Wizard likely saved to DB/LocalStorage

      const userData = await api.loginUser(guestName, verifiedPhone);



      const sessionUser = {

        name: userData.name || userData.username || guestName,

        // 1. Map Database Fields to App Format

        preferences: userData.preferences || {

          // Handle flat structure if DB is different

          cravings: userData.cravings || userData.moods || ["spicy"],

          healthGoals: userData.goals || userData.healthGoals || ["keto"],

          dietary: userData.dietType || userData.dietary || "non-veg",

          allergies: userData.allergies || userData.allergens || [],

          // Add required fields for TS adaptation

          diningContext: userData.diningContext || ["dine-in"],

          spiceLevel: userData.spiceLevel || "medium"

        }

      };



      // 2. Save to Local Storage

      localStorage.setItem('user', JSON.stringify(sessionUser));

      localStorage.setItem('currentUser', JSON.stringify(sessionUser));



      console.log("✅ [Wizard] Login Session Saved:", sessionUser);



      // Call Context Login (Trigger Backend API)

      // Must be inside try block to access sessionUser, or use default from state

      loginGuest(guestName, verifiedPhone, tableNumber, sessionUser.preferences);

      // --- NEW: INSTANT SYNC TO CONTEXT (Fixes Menu not updating) ---
      updateGuestPreferences(sessionUser.preferences);

    } catch (e) {

      console.error("Wizard persistence sync failed", e);

      // Fallback: Use local state if API failed?

      // For now, try to login with just local state if available, but better to fail gracefully

      loginGuest(guestName, verifiedPhone, tableNumber, userPrefs);

      // Still try to sync even on fallback
      if (userPrefs) updateGuestPreferences(userPrefs);

    }



    setCurrentView('menu');

  };



  // --- ORDER HANDLERS ---

  const handlePlaceOrder = (items: CartItem[]) => {

    setActiveItems(items);

    onPlaceOrder(items, guestName, tableNumber);

    setCurrentView('tracker');

    updateGuestView('tracker'); // Immediate Persistence

  };



  const handleCancelOrderWrapper = () => {

    onCancelOrder();

    setActiveItems([]);

    setCurrentView('menu');

    updateGuestView('menu'); // Immediate Persistence

  };



  // State for transient "Thank You" screen after payment

  const [showThankYou, setShowThankYou] = useState(false);



  // ... (Rest of component)



  // --- SETTLEMENT HANDLER ---

  const handleSettleSession = async () => {

    try {

      console.log("💰 SETTLING TABLE:", tableNumber);

      await api.settleTable(tableNumber);

      // We do NOT reset immediately. Wait for user to click "Start New Session".

    } catch (err) {

      console.error("Settlement Failed", err);

      // Optional: Show toast

    }

  };



  // --- SESSION RESET HANDLER (Post-Payment) ---

  const handleSessionReset = async () => {

    // 1. Hard Reset Logic

    console.log("HARD RESET INITIATED");

    setShowThankYou(false);

    setActiveItems([]);

    setPhoneNumber('');

    setVerifiedPhone('');

    setUserPrefs(undefined);

    setIsReturningUser(false);

    setCountryCode('+91');

    setGuestName('Guest');

    setTableNumber('4');



    // Clear Persisted Data

    logoutGuest(); // Force Context Logout

    localStorage.removeItem('userPrefs');



    // 2. Force Redirect to Landing (Login Page)

    console.log("Redirecting to Login Page...");

    setCurrentView('landing');

  };



  const handlePaymentSuccess = () => {

    // Instead of resetting immediately, we show the Thank You screen

    // The Active Order is GONE from global state (filtered out), but we force the view here.

    setShowThankYou(true);

    setCurrentView('tracker'); // Ensure we stay on tracker

  };



  const handleManualLogout = () => {

    handleSessionReset();

  };



  const handleEditProfile = () => {

    setShowSettings(false);

    setShowWizard(true);

  };



  // ...



  // --- FULL SESSION HISTORY FOR PAYMENT ---

  // Merge backend order items (server source of truth) with local active items if needed.

  // We prefer the backend 'guestOrder' because it contains the merged history of all items.

  const fullOrderItems: CartItem[] = React.useMemo(() => {

    if (guestOrder && guestOrder.items && guestOrder.items.length > 0) {

      return guestOrder.items.map((i: any, idx: number) => ({

        cartId: `server-${idx}`,

        menuId: i.menuId || 'uk',

        name: i.name,

        price: i.price,

        quantity: i.quantity,

        category: i.category || 'Mains',

        notes: i.notes

      }));

    }

    return activeItems;

  }, [guestOrder, activeItems]);



  // Condition: Tracker View OR Payment View + (Active Order OR optimistic tracking OR persistent Thank You)

  if (currentView === 'tracker' || currentView === 'payment' || showThankYou) {

    // Determine effective status

    // If showThankYou is true, force 'paid'. Otherwise use real status.

    const effectiveStatus = showThankYou ? 'paid' : guestOrderStatus;

    const isPaymentOpen = currentView === 'payment';



    return (

      <div className="absolute inset-0 z-50 overflow-hidden">

        {/* Settings Button Overlay for Tracker View */}

        {!showThankYou && (

          <div className="absolute top-4 right-6 z-[60]">

            <button

              onClick={() => setShowSettings(true)}

              className="p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all shadow-sm"

            >

              <User size={20} />

            </button>

          </div>

        )}



        <OrderTracker

          status={effectiveStatus || 'placed'} // Fallback

          cartItems={fullOrderItems}

          orderId={guestOrder?.id} // PASS ID FOR ROBUST RECEIPT

          onBackToMenu={() => setCurrentView('menu')}

          onViewKitchen={() => onNavigate('kitchen')}

          onCancelOrder={handleCancelOrderWrapper}

          onReset={handleSessionReset}

          onPaymentSuccess={handlePaymentSuccess}

          onRequestService={onRequestService}

          guestName={guestName}

          onSettleSession={handleSettleSession}

          // Payment State

          isPaymentOpen={isPaymentOpen}

          onTogglePayment={(open) => setCurrentView(open ? 'payment' : 'tracker')}

        />

        <SettingsModal

          isOpen={showSettings}

          onClose={() => setShowSettings(false)}

          userPrefs={userPrefs}

          onEditProfile={handleEditProfile}

          onLogout={handleManualLogout}

          tableNumber={tableNumber}

        />

      </div>

    );

  }



  // DEFAULT PREFS CONSTANT

  const DEFAULT_GUEST_PREFS: UserPreferences = {

    dietary: 'non-veg',

    allergens: [],

    spiceLevel: 'medium',

    cravings: [],

    healthGoals: [],

    diningContext: []

  };



  if (currentView === 'menu') {

    // Fail-safe: Use existing prefs or fall back to defaults so the menu ALWAYS opens

    const activePrefs = userPrefs || DEFAULT_GUEST_PREFS;



    return (

      <div className="h-full flex flex-col relative overflow-hidden">

        <div className="flex-1 overflow-y-auto no-scrollbar">

          <SmartMenu

            preferences={activePrefs}

            onPlaceOrder={handlePlaceOrder}

            onProfileClick={() => setShowSettings(true)}

            guestName={guestName}

            items={menuItems}

            isLoading={isMenuLoading}

            error={menuError}

            hasActiveOrder={!!guestOrderStatus}

            activeOrderStatus={guestOrderStatus} // New Prop

            onCartCountChange={setCartCount}

            onNavigate={(view) => setCurrentView(view as any)} // For pill click

          />

        </div>



        {/* Floating Pill REMOVED - Moved inside SmartMenu footer */}



        <SettingsModal

          isOpen={showSettings}

          onClose={() => setShowSettings(false)}

          userPrefs={userPrefs}

          onEditProfile={handleEditProfile}

          onLogout={handleManualLogout}

          tableNumber={tableNumber}

        />



        <ConciergeWizard

          isOpen={showWizard}

          onClose={() => setShowWizard(false)}

          onComplete={handleWizardComplete}

          onSessionInfo={(name, table) => {

            setGuestName(name);

            localStorage.setItem('guestName', name);

            if (table) setTableNumber(table);

          }}



          phoneNumber={verifiedPhone}

          initialData={userPrefs}

          isReturningUser={isReturningUser || true}

        />

      </div>

    );

  }







  // DEFAULT: Landing Page

  return (

    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#FAFAFA] dark:bg-[#0F172A] relative">



      {/* Header */}

      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/10 dark:bg-[#0F172A]/30 border-b border-white/5 transition-all duration-300">

        <div

          className="flex items-center gap-2 cursor-pointer select-none"

          onClick={() => setSecretClicks(c => c + 1)}

        >

          <div className="w-8 h-8 bg-secondary dark:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg">

            <ChefHat className="w-4 h-4 text-white dark:text-secondary" />

          </div>

          <span className="font-display font-bold text-secondary dark:text-white text-lg tracking-tight transition-colors drop-shadow-md">

            The Malabar House

          </span>

        </div>



        <div className="flex items-center gap-2">

          <div className="hidden sm:block bg-secondary/90 dark:bg-white/10 px-2 py-1 rounded-full shadow-sm transition-colors backdrop-blur-md">

            <span className="text-[10px] font-bold text-white uppercase tracking-wider">

              Powered by DineAI

            </span>

          </div>

        </div>

      </header>



      {/* Hero */}

      <div className="relative h-[40%] min-h-[300px] w-full shrink-0">

        <img

          src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1287&auto=format&fit=crop"

          alt="Delicious Indian Cuisine"

          className="w-full h-full object-cover"

        />

        {/* Gradient Overlay */}

        <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none transition-colors duration-300

bg-[linear-gradient(to_top,#FAFAFA_0%,#FAFAFA_15%,rgba(250,250,250,0.1)_35%,transparent_55%)]

dark:bg-[linear-gradient(to_top,#0F172A_0%,#0F172A_15%,rgba(15,23,42,0.2)_35%,transparent_55%)]"

        />

      </div>



      {/* Content */}

      {/* Content */}

      <main className="relative z-10 -mt-20 flex-1 flex flex-col items-center px-4 w-full max-w-lg mx-auto">

        {/* Main Card */}

        {/* Removes bg, shadow, border to match the clean "floating on gradient" look or keeps it minimal if design implies card.

Looking at the screenshot, the text sits on a white/light blur area but it fades into the background.

The inputs are on a clean white background? No, the screenshot shows a white background for the whole page bottom half.

Let's match the "curved split" look or just a simple card?

The screenshot looks like: Top Image -> Fade to White -> Content.

Let's use a cleaner layout.

*/}

        <div className="w-full text-center">



          {/* Icon with Badge */}

          <div className="relative w-14 h-14 mx-auto mb-4">

            <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">

              <Utensils className="w-5 h-5 text-[#FF5722]" strokeWidth={2} />

            </div>

            {/* Sparkle Badge */}

            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-orange-100">

              <Sparkles className="w-3 h-3 text-[#FFD700] animate-pulse" fill="#FFD700" />

            </div>

          </div>



          <h2 className="font-display font-bold text-[24px] text-[#1e293b] dark:text-white mb-2 leading-tight tracking-tight">

            A Menu Curated<br />for Your Palate.

          </h2>

          <p className="font-sans text-slate-500 dark:text-slate-400 text-[14px] mb-8 leading-relaxed max-w-xs mx-auto">

            Allow us to filter for your safety and highlight the flavors you love.

          </p>



          {/* PHONE FORM */}

          <div className="space-y-4 max-w-sm mx-auto">



            {/* Input Group */}

            <div className={`relative transition-all duration-200 ${isShaking ? 'animate-shake' : ''} ${error ? 'mb-6' : ''}`}>

              <div className="flex items-center w-full h-[54px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:shadow-md focus-within:border-[#FF5722] transition-all overflow-hidden">



                {/* Country Code */}

                <div className="flex items-center justify-center pl-5 pr-3 h-full border-r border-slate-100 dark:border-slate-700">

                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{countryCode}</span>

                  <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />

                </div>



                {/* Phone Input */}

                <input

                  type="tel"

                  placeholder="99999 99999"

                  maxLength={11}

                  value={phoneNumber}

                  onChange={handleInputChange}

                  className="w-full h-full px-4 bg-transparent border-none text-slate-900 dark:text-white text-lg font-medium placeholder:text-slate-300 focus:ring-0 outline-none"

                />

              </div>



              {error && (

                <div className="absolute -bottom-6 left-0 w-full text-center">

                  <span className="text-xs font-medium text-[#EF4444] animate-fade-in">

                    Please enter a valid 10-digit number

                  </span>

                </div>

              )}

            </div>



            {/* Main Button */}

            <button

              onClick={validateAndSubmit}

              disabled={isLoading}

              className="w-full h-[54px] bg-[#FF5722] hover:bg-[#F4511E] text-white font-display font-bold text-[16px] rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"

            >

              {isLoading ? (

                <>

                  <Loader2 className="w-4 h-4 animate-spin" />

                  <span>Curating Menu...</span>

                </>

              ) : (

                <>

                  <span>Reveal My Personalized Menu</span>

                  <Sparkles className="w-4 h-4" />

                </>

              )}

            </button>



            {/* Guest Link */}

            <button

              onClick={handleGuestLogin}

              className="text-sm text-slate-400 font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline decoration-slate-300 underline-offset-4"

            >

              I'll browse as a guest

            </button>

          </div>

        </div>

      </main>



      {/* Decorative Blob */}

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-0" />



      <ConciergeWizard

        isOpen={showWizard}

        onClose={() => setShowWizard(false)}

        onComplete={handleWizardComplete}

        onSessionInfo={(name, table) => {

          setGuestName(name);

          if (table) setTableNumber(table);

        }}

        phoneNumber={verifiedPhone}

        initialData={userPrefs}

        isReturningUser={isReturningUser}

      />

    </div>

  );

};



export default SplashLanding;

