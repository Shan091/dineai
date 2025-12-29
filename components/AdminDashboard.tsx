import React, { useState, useEffect, useMemo } from 'react';
import {
    ShoppingBag,
    DollarSign,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Search,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { api, MenuItem, Order } from '../services/api';
import { DietaryType, SpiceLevel } from '../services/db';

interface AdminDashboardProps {
    onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: '',
        description: '',
        price: 0,
        category: 'Mains',
        image: '',
        isAvailable: true,
        tags: [],
        dietaryType: 'veg',
        spiceLevel: 'medium'
    });

    const [tagInput, setTagInput] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Orders for Analytics
            const fetchedOrders = await api.getOrders('paid');
            setOrders(fetchedOrders);

            // 2. Fetch Menu
            const fetchedMenu = await api.fetchMenu();
            setMenuItems(fetchedMenu);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ANALYTICS ---
    const analytics = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length; // Already filtered by 'paid'
        return { totalRevenue, totalOrders };
    }, [orders]);

    // --- HANDLERS ---
    const handleToggleAvailability = async (id: string) => {
        try {
            await api.toggleItemAvailability(id);
            // Optimistic Update
            setMenuItems(prev => prev.map(m =>
                m.id === id ? { ...m, isAvailable: !m.isAvailable } : m
            ));
        } catch (e) {
            alert("Failed to toggle availability");
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
        try {
            await api.deleteMenuItem(id);
            setMenuItems(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            alert("Failed to delete item");
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) {
            alert("Please enter Name and Price");
            return;
        }

        try {
            const added = await api.addMenuItem(newItem as MenuItem);
            setMenuItems(prev => [...prev, added]);
            setShowAddModal(false);
            // Reset Form
            setNewItem({
                name: '', description: '', price: 0, category: 'Mains', image: '',
                isAvailable: true, tags: [], dietaryType: 'veg', spiceLevel: 'medium'
            });
            setTagInput('');
        } catch (e) {
            alert("Failed to create item");
        }
    };

    const addTag = () => {
        if (tagInput.trim()) {
            setNewItem(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
            setTagInput('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] p-6 pb-20 font-sans">

            {/* HEADER */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-[#0F172A] dark:text-white">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Manage your menu and track performance
                    </p>
                </div>
                <button
                    onClick={() => onNavigate('/')}
                    className="text-sm font-bold text-slate-500 hover:text-[#FF5722] transition-colors"
                >
                    Exit
                </button>
            </header>

            {/* SECTION A: ANALYTICS */}
            <section className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-bold text-[#0F172A] dark:text-white">
                        ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                    </p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-[#0F172A] dark:text-white">
                        {analytics.totalOrders}
                    </p>
                </div>
            </section>

            {/* SECTION B: MENU MANAGEMENT */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Menu Items</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF5722] text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-[#F4511E] active:scale-95 transition-all"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading Menu...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-black/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Item</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {menuItems.map(item => (
                                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"}
                                                    alt={item.name}
                                                    className="w-10 h-10 rounded-lg object-cover bg-slate-200"
                                                />
                                                <div>
                                                    <p className="font-bold text-sm text-[#0F172A] dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-sm">₹{item.price}</td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${item.isAvailable
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {item.isAvailable ? 'Available' : 'Sold Out'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleAvailability(item.id)}
                                                    title="Toggle Availability"
                                                    className={`p-2 rounded-lg transition-colors ${item.isAvailable
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* ADD ITEM MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-display font-bold text-[#0F172A] dark:text-white">Add New Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-[#FF5722]"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g. Butter Chicken"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-[#FF5722]"
                                        value={newItem.price || ''}
                                        onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        placeholder="350"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 dark:bg-black/20 rounded-xl text-sm font-medium text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-[#FF5722]"
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="A rich and creamy tomato based curry..."
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-[#0F172A] dark:text-white outline-none"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    >
                                        <option>Starters</option>
                                        <option>Mains</option>
                                        <option>Breads/Rice</option>
                                        <option>Beverages</option>
                                        <option>Dessert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image URL</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="flex-1 p-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs font-medium text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-[#FF5722]"
                                            value={newItem.image}
                                            onChange={e => setNewItem({ ...newItem, image: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        {newItem.image && (
                                            <img src={newItem.image} className="w-10 h-10 rounded-lg object-cover bg-slate-200" alt="Preview" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diet Type</label>
                                    <div className="flex gap-2">
                                        {['veg', 'non-veg', 'egg'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewItem({ ...newItem, dietaryType: type as any })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${newItem.dietaryType === type
                                                        ? 'bg-[#FF5722] text-white border-[#FF5722]'
                                                        : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Spice Level</label>
                                    <div className="flex gap-2">
                                        {['mild', 'medium', 'fiery'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setNewItem({ ...newItem, spiceLevel: level as any })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${newItem.spiceLevel === level
                                                        ? 'bg-[#FF5722] text-white border-[#FF5722]'
                                                        : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (Press Enter)</label>
                                <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-2 flex flex-wrap gap-2 min-h-[48px]">
                                    {newItem.tags?.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white dark:bg-white/10 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                                            {tag}
                                            <button onClick={() => setNewItem(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }))}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        className="bg-transparent text-sm outline-none flex-1 min-w-[100px]"
                                        placeholder="Add tag..."
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-2 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                            <button
                                onClick={handleAddItem}
                                className="w-full py-4 bg-[#FF5722] hover:bg-[#F4511E] text-white font-display font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all"
                            >
                                Create Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
