import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Power,
  Edit2,
  Image as ImageIcon
} from 'lucide-react';
import { MenuItem } from './SmartMenu';
import { api } from '../services/api';
import AddItemModal from './AddItemModal';

interface InventoryManagerProps {
  items: MenuItem[];
  onUpdateItems: (items: MenuItem[]) => void;
  onBack: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ items, onUpdateItems, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- FILTERS ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['All', 'Starters', 'Mains', 'Breads/Rice', 'Beverages', 'Dessert'];

  // --- HANDLERS ---
  const handleToggleAvailability = async (id: string) => {
    // Optimistic Update
    const updated = items.map(item =>
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    );
    onUpdateItems(updated);

    try {
      await api.toggleItemAvailability(id);
    } catch (e) {
      console.error("Failed to toggle availability", e);
      // Revert if needed, but for MVP we assume success
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this item?")) {
      const updated = items.filter(item => item.id !== id);
      onUpdateItems(updated);
    }
  };

  const handleAddItem = (newItem: Partial<MenuItem>) => {
    const item: MenuItem = {
      ...newItem,
      id: `new_${Date.now()}`,
    } as MenuItem;

    // Add to top of list
    onUpdateItems([item, ...items]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-[#0F172A] dark:text-white flex flex-col font-sans animate-fade-in">

      {/* HEADER */}
      <header className="px-6 py-4 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-display font-bold">Menu Inventory</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#FF5722] text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            Add New Item
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-black/20 border-none outline-none focus:ring-2 focus:ring-[#FF5722] text-sm font-medium"
            />
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors
                  ${activeCategory === cat
                    ? 'bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A]'
                    : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`
                bg-white dark:bg-[#1E293B] rounded-xl p-3 flex items-center gap-4 border transition-all
                ${item.available ? 'border-gray-100 dark:border-white/5' : 'border-gray-100 dark:border-white/5 opacity-70 grayscale'}
              `}
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://via.placeholder.com/150";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dietaryType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-mono">₹{item.price}</span>
                  <span>•</span>
                  <span>{item.category}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Toggle Availability */}
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  title={item.available ? "Mark Unavailable" : "Mark Available"}
                  className={`
                     p-2.5 rounded-lg transition-colors
                     ${item.available
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-gray-200'}
                   `}
                >
                  <Power size={18} strokeWidth={2.5} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  title="Delete Item"
                  className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <Search size={48} className="mb-4 text-gray-300" />
              <p className="font-bold text-gray-500">No items found</p>
            </div>
          )}
        </div>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddItem}
      />
    </div>
  );
};

export default InventoryManager;