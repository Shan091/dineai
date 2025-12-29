import { DietaryType, SpiceLevel } from './db';

const API_URL = 'http://127.0.0.1:8000'; // Specific requirement

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    isAvailable: boolean;
    dietaryType: DietaryType;
    spiceLevel: SpiceLevel;
    tags: string[];

    // Rich Data Fields
    heroIngredient?: string;
    allergens?: string[];
    prepTime?: number;
    calories?: number;
    stock?: number;
    rating?: number;

    // Portions & Addons
    type?: 'unit' | 'portion';
    sizes?: { label: string; price: number }[];
    addons?: { name: string; price: number }[];
    pairingId?: string;
}

export interface OrderItem {
    name: string;
    quantity: number;
    notes?: string;
    price: number;
}

// Strictly matches OrderCreate(BaseModel) in backend/main.py
export interface OrderCreate {
    tableId: number;
    guestName?: string;
    items: OrderItem[];
    totalAmount: number;
    type: 'food' | 'request';
}

export interface Order extends OrderCreate {
    id: string;
    status: 'placed' | 'ready' | 'served' | 'paid' | 'cancelled';
    createdAt: string;
}

export const api = {
    // GET Menu
    fetchMenu: async (): Promise<MenuItem[]> => {
        try {
            const res = await fetch(`${API_URL}/api/menu`);
            if (!res.ok) throw new Error(`Fetch menu failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error (fetchMenu):", error);
            throw error;
        }
    },

    // PATCH Menu Availability
    toggleItemAvailability: async (itemId: string): Promise<MenuItem> => {
        try {
            const res = await fetch(`${API_URL}/api/menu/${itemId}/toggle`, {
                method: 'PATCH'
            });
            if (!res.ok) throw new Error("Toggle failed");
            return await res.json();
        } catch (error) {
            console.error("API Error (toggleItem):", error);
            throw error;
        }
    },

    // POST Add Menu Item
    addMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
        try {
            const res = await fetch(`${API_URL}/api/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, id: '' }), // Send empty ID, backend generates
            });
            if (!res.ok) throw new Error("Failed to add menu item");
            return await res.json();
        } catch (error) {
            console.error("API Error (addMenuItem):", error);
            throw error;
        }
    },

    // DELETE Menu Item
    deleteMenuItem: async (id: string): Promise<void> => {
        try {
            const res = await fetch(`${API_URL}/api/menu/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete menu item");
        } catch (error) {
            console.error("API Error (deleteMenuItem):", error);
            throw error;
        }
    },

    // UPDATE Menu Item (PATCH)
    updateMenuItem: async (id: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
        try {
            const res = await fetch(`${API_URL}/api/menu/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error("Failed to update menu item");
            return await res.json();
        } catch (error) {
            console.error("API Error (updateMenuItem):", error);
            throw error;
        }
    },



    // POST Order
    placeOrder: async (order: OrderCreate): Promise<Order> => {
        console.log("POSTing order:", order);

        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order),
            });

            if (!res.ok) {
                let errorMsg = `Server Error (${res.status})`;
                try {
                    const errorData = await res.json();
                    errorMsg = JSON.stringify(errorData);
                    console.error("SERVER REJECTED ORDER:", errorData);
                } catch (e) {
                    console.error("Non-JSON API Error:", await res.text());
                }
                throw new Error(errorMsg);
            }

            return await res.json();
        } catch (error) {
            console.error("API Error (placeOrder):", error);
            throw error; // Re-throw so UI catches it
        }
    },

    // GET Orders (with optional filter)
    getOrders: async (status?: string): Promise<Order[]> => {
        try {
            const url = status
                ? `${API_URL}/api/orders?status=${status}`
                : `${API_URL}/api/orders`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch orders failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error (getOrders):", error);
            throw error;
        }
    },

    // GET Single Order by ID
    getOrder: async (orderId: string): Promise<Order> => {
        try {
            const res = await fetch(`${API_URL}/api/orders/${orderId}`);
            if (!res.ok) throw new Error(`Fetch single order failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error (getOrder):", error);
            throw error;
        }
    },

    // PATCH Order Status
    updateStatus: async (orderId: string, status: string): Promise<Order> => {
        try {
            // Must use query param for status as per backend implementation
            const res = await fetch(`${API_URL}/api/orders/${orderId}/status?status=${status}`, {
                method: 'PATCH'
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Update status failed: ${errText}`);
            }
            return await res.json();
        } catch (error) {
            console.error("API Error (updateStatus):", error);
            throw error;
        }
    },

    // POST Settle Table
    settleTable: async (tableId: string): Promise<{ status: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/tables/${tableId}/settle`, {
                method: 'POST'
            });

            if (!res.ok) throw new Error('Failed to settle table');
            return await res.json();
        } catch (error) {
            console.error("API Error (settleTable):", error);
            throw error;
        }
    },

    // DELETE Cancel Order
    cancelOrder: async (orderId: string): Promise<void> => {
        try {
            const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Failed to cancel order");
            }
        } catch (error) {
            console.error("API Error (cancelOrder):", error);
            throw error;
        }
    },

    // GET Session Status
    getSession: async (tableId: string): Promise<{ active: boolean; guestName?: string; status?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/tables/${tableId}/session`);
            if (!res.ok) return { active: false };
            return await res.json();
        } catch (error) {
            console.error("API Warning (getSession):", error);
            return { active: false };
        }
    },

    // --- USER / LOYALTY ROUTES ---
    checkUser: async (phone: string): Promise<{ exists: boolean; name?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/users/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            if (!res.ok) throw new Error("Check failed");
            return await res.json();
        } catch (error) {
            console.error("API Warning (checkUser):", error);
            // Default to not exists if check fails
            return { exists: false };
        }
    },

    loginUser: async (name: string, phone: string, preferences?: any): Promise<any> => {
        try {
            const res = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, preferences }) // Send Prefs
            });
            if (!res.ok) throw new Error("Login failed");
            return await res.json();
        } catch (error) {
            console.error("API Error (loginUser):", error);
            throw error;
        }
    },

    getUser: async (userId: string): Promise<any> => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`);
            if (!res.ok) throw new Error("Fetch user failed");
            return await res.json();
        } catch (error) {
            console.error("API Error (getUser):", error);
            throw error;
        }
    },

    addPreference: async (userId: string, preference: string): Promise<any> => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/preferences`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preference })
            });
            if (!res.ok) throw new Error("Update pref failed");
            return await res.json();
        } catch (error) {
            console.error("API Error (addPreference):", error);
            throw error;
        }
    }
};