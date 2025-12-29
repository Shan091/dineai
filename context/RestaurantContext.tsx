import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { playNotificationSound } from '../utils/SoundManager';
import { MenuItem } from '../components/data';

// --- TYPES (Copied from App.tsx or similar) ---
export type OrderStatus = 'placed' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderTicket {
    id: string;
    tableId: number;
    createdAt: Date | string;
    status: OrderStatus;
    type: 'food' | 'request';
    guestName?: string;
    items: {
        name: string;
        quantity: number;
        notes?: string;
        price?: number; // Added for completeness with receipt logic
        status?: 'pending' | 'cooking' | 'served'; // Item status
    }[];
}

interface RestaurantContextType {
    tickets: OrderTicket[];
    menuItems: MenuItem[];
    isMenuLoading: boolean;
    menuError: string | null;
    isOffline: boolean;

    // Audio
    isAudioEnabled: boolean;
    toggleAudio: () => void;

    // Guest Session
    guestSession: GuestSession | null;
    loginGuest: (name: string, phone: string, tableId: string, preferences?: UserPreferences) => void;
    updateGuestView: (view: string) => void;
    updateGuestPreferences: (preferences: UserPreferences) => void; // NEW: Instant preference sync
    logoutGuest: () => void;
    // Expose resetOrderSession in Context
    resetOrderSession: () => void;

    // Actions
    refreshOrders: () => Promise<void>;
    refreshMenu: () => Promise<void>;
    isAppLoading: boolean; // Global Loading State
    placeOrder: (payload: any) => Promise<OrderTicket>;
}

import { UserPreferences } from '../services/db';

export interface GuestSession {
    name: string;
    tableId: string;
    view: string;
    preferences: UserPreferences;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tickets, setTickets] = useState<OrderTicket[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    // Master Loading State
    const [isAppLoading, setIsAppLoading] = useState(true);

    // Audio State
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [prevOrderCount, setPrevOrderCount] = useState(0);

    // --- LAZY STATE INITIALIZATION (Fixes "Flash of Landing") ---
    const [view, setView] = useState(() => {
        try {
            const saved = localStorage.getItem('dineai_guest_session');
            return saved ? JSON.parse(saved).view || 'landing' : 'landing';
        } catch { return 'landing'; }
    });

    // We now use a comprehensive User object
    const [user, setUser] = useState<any | null>(null);

    // Backward compatibility for components using these:
    const [customerName, setCustomerName] = useState('');
    const [tableId, setTableId] = useState('');

    // Derived Session Object (for Context Consumers)
    const guestSession: GuestSession | null = (user && tableId)
        ? {
            name: user.name,
            tableId,
            view,
            // Fallback empty preferences if missing to satisfy type
            preferences: user.preferences || {
                dietary: 'non-veg',
                allergens: [],
                spiceLevel: 'medium',
                cravings: [],
                healthGoals: [],
                diningContext: []
            }
        }
        : null;

    // Persistence Effect: Auto-save View State Only (User ID is saved on login)
    useEffect(() => {
        if (user && tableId) {
            const sessionData = {
                tableId,
                view: view || 'menu'
            };
            localStorage.setItem('dineai_guest_session', JSON.stringify(sessionData));
        }
    }, [user, tableId, view]);

    // --- 0. HELPER FUNCTIONS (Hoisted for Init) ---
    // --- 1. THE SYNC LOOP (POLLING) ---
    const fetchOrders = async () => {
        try {
            const data = await api.getOrders();
            // Convert string timestamps back to Date objects
            const parsedTickets = data.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt)
            }));

            // Audio Logic
            if (isAudioEnabled) {
                if (parsedTickets.length > prevOrderCount) {
                    playNotificationSound('order');
                }
            }

            setTickets(parsedTickets);
            setPrevOrderCount(parsedTickets.length);
            setIsOffline(false);
        } catch (err) {
            console.error("Connection lost:", err);
            setIsOffline(true);
        }
    };

    // --- 1.1 FETCH MENU ON MOUNT & POLL (10s) ---
    const loadMenu = async (isBackground = false) => {
        if (!isBackground) setIsMenuLoading(true);
        try {
            const data = await api.fetchMenu();
            if (data) {
                setMenuItems(data);
                setMenuError(null);
            }
        } catch (e) {
            console.error("Failed to load menu.");
            if (!isBackground) setMenuError("Failed to load menu. Please ask staff.");
        } finally {
            if (!isBackground) setIsMenuLoading(false);
        }
    };

    // RESTORE USER SESSION ON MOUNT
    useEffect(() => {
        const loadApp = async () => {
            console.log("🚀 Starting App...");

            try {
                // 1. FETCH MENU (Critical - Must run first)
                console.log("Fetching Menu Items...");
                // Reuse existing loadMenu logic but await it here manually for control
                const menuData = await api.fetchMenu();
                if (menuData) {
                    setMenuItems(menuData);
                    setMenuError(null);
                    console.log(`✅ Menu Loaded: ${menuData.length} items`);
                }

                // 2. RESTORE USER (If exists)
                const storedUserId = localStorage.getItem('dineai_user_id');
                if (storedUserId) {
                    console.log("Restoring User...");
                    try {
                        const userData = await api.getUser(storedUserId);
                        setUser(userData);
                        setCustomerName(userData.name); // Sync legacy
                        setView('menu'); // Force view to Menu
                        console.log(`✅ User Restored: ${userData.name}`);

                        // 3. RESTORE ACTIVE ORDER (If exists)
                        if (userData.currentSession?.activeOrderId) {
                            // We rely on polling loop for tickets mainly, but if we strictly needed active order:
                            // const order = await api.getOrder(userData.currentSession.activeOrderId);
                            // setActiveOrder(order); (We don't have setActiveOrder in this scope/interface easily)
                        }
                    } catch (e) {
                        console.warn("User restore failed, clearing session.", e);
                        localStorage.removeItem('dineai_user_id');
                        setView('landing');
                    }
                } else {
                    // No user? Stay on Landing page
                    setView('landing');
                }
            } catch (error) {
                console.error("❌ Critical Load Error:", error);
                setMenuError("Failed to load application data.");
            } finally {
                // 4. OPEN THE GATES (Must always run)
                console.log("🏁 App Ready. Unlocking.");
                setIsAppLoading(false);
            }
        };

        loadApp();
    }, []);

    const loginGuest = async (name: string, phone: string, id: string, preferences?: UserPreferences) => { // Updated sig to include Preferences
        // setCustomerName(name); // Derived from user now
        setTableId(id);

        try {
            // 1. Force Clear First (Safety against Sticky Sessions)
            localStorage.removeItem('dineai_user_id');
            setUser(null);

            // 2. Backend Login (Upsert) - Uses FRESH args, not stale state
            const userData = await api.loginUser(name, phone, preferences);

            // 3. Set State
            setUser(userData);
            setCustomerName(userData.name);

            // 4. Persist Token
            localStorage.setItem('dineai_user_id', userData.id);

            setView('menu');
        } catch (e: any) {
            console.error("Login Failed Details:", e.response?.data || e.message);
            alert("Login Failed: " + (e.response?.data?.detail || e.message || "Check console"));
        }
    };

    const updateGuestView = (newView: string) => {
        // if (!guestSession) return; // Relax this check to allow view switching during load
        setView(newView);
    };

    const logoutGuest = () => {
        console.log("👋 Logging out...");
        // 1. Clear All Local Storage
        localStorage.removeItem('dineai_user_id');
        localStorage.removeItem('dineai_guest_session'); // Clear old session types too

        // 2. Reset State
        setCustomerName('');
        setTableId('');
        setUser(null);
        // setActiveOrder(null); // Not explicitly in context state, strictly. Tickets are the source of truth.
        setTickets([]); // Clear tickets to be safe? Or keep for cache? Better clear.

        // 3. CRITICAL: Force Navigation to Landing Page
        setView('landing');
    };

    const resetOrderSession = () => {
        console.log("🔄 Starting New Order Session...");
        // Keep User, Clear Tickets
        setTickets([]);
        // Force View to Menu
        setView('menu');
    };

    // --- NEW: INSTANT PREFERENCE SYNC ---
    const updateGuestPreferences = (newPreferences: UserPreferences) => {
        console.log("⚡ Updating Preferences (Real-time):", newPreferences);

        // 1. Update user state with new preferences
        setUser((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev, preferences: newPreferences };

            // 2. Sync to localStorage immediately (for crash recovery & SmartMenu fallback)
            localStorage.setItem('user', JSON.stringify(updated));
            localStorage.setItem('currentUser', JSON.stringify(updated));

            return updated;
        });
    };

    const toggleAudio = () => {
        const newState = !isAudioEnabled;
        setIsAudioEnabled(newState);
        if (newState) {
            playNotificationSound('order');
        }
    };

    // --- 1. THE SYNC LOOP (POLLING) ---
    // (Moved to top)

    // Audio Polling
    useEffect(() => {
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [isAudioEnabled, prevOrderCount]);

    // Initial Load Logic merged into the effect above
    // Keeping menu polling
    useEffect(() => {
        const menuInterval = setInterval(() => loadMenu(true), 10000);
        return () => {
            clearInterval(menuInterval);
        };
    }, []);

    // --- ACTIONS ---
    const placeOrder = async (payload: any) => {
        try {
            const updatedOrder = await api.placeOrder(payload);

            // IMMEDIATE STATE UPDATE (Fixing Partial Receipt/Display Lag)
            // Convert string dates if needed (though API returns ISO strings, usually fine or we parse)
            const parsedOrder = {
                ...updatedOrder,
                createdAt: new Date(updatedOrder.createdAt)
            } as OrderTicket;

            setTickets(prev => {
                const existingIndex = prev.findIndex(t => t.id === parsedOrder.id);
                if (existingIndex >= 0) {
                    // Replace existing
                    const newTickets = [...prev];
                    newTickets[existingIndex] = parsedOrder;
                    return newTickets;
                } else {
                    // Append new
                    return [...prev, parsedOrder];
                }
            });

            // Also trigger audio if needed? 
            // The polling loop handles other people's orders. 
            // For our own order, we might want a specific sound in the UI component, not here.

            return parsedOrder;
        } catch (error) {
            console.error("Place Order Failed", error);
            throw error;
        }
    };

    return (
        <RestaurantContext.Provider value={{
            tickets,
            menuItems,
            isMenuLoading,
            menuError,
            isOffline,
            isAudioEnabled,
            toggleAudio,
            guestSession,
            loginGuest,
            updateGuestView,
            updateGuestPreferences, // NEW
            logoutGuest,
            resetOrderSession,
            refreshOrders: fetchOrders,
            refreshMenu: () => loadMenu(true),
            isAppLoading,
            placeOrder // Exposed
        }}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
};
