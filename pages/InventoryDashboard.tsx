import React, { useState, useEffect } from 'react';
import { api, MenuItem } from '../services/api';
import StaffNavbar from '../components/StaffNavbar';
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, X, Loader2, Image as ImageIcon } from 'lucide-react';

const InventoryDashboard: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Mains',
        description: '',
        image: '',
        tags: '',
        dietaryType: 'veg',
        spiceLevel: 'medium',
        heroIngredient: 'veg',
        stock: '20',
        prepTime: '15'
    });

    // Fetch Menu
    const loadMenu = async () => {
        try {
            const data = await api.fetchMenu();
            setItems(data);
        } catch (err) {
            console.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    // Handlers
    const handleToggle = async (id: string) => {
        try {
            const updated = await api.toggleItemAvailability(id);
            setItems(prev => prev.map(item => item.id === id ? updated : item));
        } catch (err) {
            alert("Failed to toggle item");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.deleteMenuItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert("Failed to delete item");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newItem = {
                name: formData.name,
                price: parseFloat(formData.price),
                category: formData.category,
                description: formData.description || 'Delicious item',
                image: formData.image || '',
                isAvailable: true,
                dietaryType: formData.dietaryType as any,
                spiceLevel: formData.spiceLevel as any,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                heroIngredient: formData.heroIngredient,
                stock: parseInt(formData.stock || '0'),
                prepTime: parseInt(formData.prepTime || '0'),
                allergens: [], // TODO: Add Multi-select for Allergens later
                rating: 4.5, // Default rating 
                calories: 0  // Default calories
            };

            const created = await api.addMenuItem(newItem);
            setItems([...items, created]);
            setIsAdding(false);
            setFormData({ name: '', price: '', category: 'Mains', description: '', image: '', tags: '' });
        } catch (err) {
            alert("Failed to add item");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0F172A] pt-20 pb-12 transition-colors">
            <StaffNavbar />

            <div className="max-w-7xl mx-auto px-6">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your menu items and availability</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} />
                        Add Item
                    </button>
                </header>

                {/* ADD ITEM FORM (Inline for simplicity) */}
                {isAdding && (
                    <div className="mb-8 bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 animate-fade-in-down">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Item</h2>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Item Name"
                                className="input-field"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Price (₹)"
                                type="number"
                                className="input-field"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            <select
                                className="input-field"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Starters">Starters</option>
                                <option value="Mains">Mains</option>
                                <option value="Breads/Rice">Breads/Rice</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Dessert">Dessert</option>
                            </select>
                            <input
                                placeholder="Tags (comma separated)"
                                className="input-field"
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            />


                            {/* Rich Data Fields */}
                            <select
                                className="input-field"
                                value={formData.dietaryType}
                                onChange={e => setFormData({ ...formData, dietaryType: e.target.value })}
                            >
                                <option value="veg">Veg</option>
                                <option value="non-veg">Non-Veg</option>
                                <option value="egg">Egg</option>
                            </select>

                            <select
                                className="input-field"
                                value={formData.spiceLevel}
                                onChange={e => setFormData({ ...formData, spiceLevel: e.target.value })}
                            >
                                <option value="mild">Mild</option>
                                <option value="medium">Medium</option>
                                <option value="fiery">Fiery</option>
                            </select>

                            <select
                                className="input-field"
                                value={formData.heroIngredient}
                                onChange={e => setFormData({ ...formData, heroIngredient: e.target.value })}
                            >
                                <option value="veg">Veg</option>
                                <option value="poultry">Poultry</option>
                                <option value="red_meat">Red Meat</option>
                                <option value="seafood">Seafood</option>
                                <option value="rice">Rice</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Stock"
                                    type="number"
                                    className="input-field"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                />
                                <input
                                    placeholder="Prep Time (min)"
                                    type="number"
                                    className="input-field"
                                    value={formData.prepTime}
                                    onChange={e => setFormData({ ...formData, prepTime: e.target.value })}
                                />
                            </div>
                            <input
                                placeholder="Image URL"
                                className="input-field md:col-span-2"
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                            />
                            <textarea
                                placeholder="Description"
                                className="input-field md:col-span-2 min-h-[80px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />

                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save Item</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* INVENTORY LIST */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className={`
              bg-white dark:bg-[#1E293B] rounded-xl p-4 border shadow-sm transition-all
              ${item.isAvailable ? 'border-slate-200 dark:border-white/5 opacity-100' : 'border-red-200 dark:border-red-900/30 opacity-75'}
            `}>
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/10 rounded-lg shrink-0 overflow-hidden relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon size={24} /></div>
                                    )}
                                    {!item.isAvailable && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                                            Sold Out
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2">{item.name}</h3>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">₹{item.price}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{item.category}</p>

                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={() => handleToggle(item.id)}
                                            className={`
                        flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${item.isAvailable
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300'
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300'}
                      `}
                                        >
                                            {item.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .input-field {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 0.5rem;
          color: inherit;
          font-size: 0.875rem;
        }
        .dark .input-field {
          border-color: rgba(255,255,255,0.1);
        }
        .input-field:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
        </div>
    );
};

export default InventoryDashboard;
