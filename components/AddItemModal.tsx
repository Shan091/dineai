import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, DollarSign, Type } from 'lucide-react';
import { MenuItem } from './SmartMenu';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Starters',
    description: '',
    dietaryType: 'veg',
    image: '',
    spiceLevel: 'medium'
  });

  const [isAnimating, setIsAnimating] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
        setIsAnimating(true);
        // Reset form
        setFormData({
            name: '',
            price: '',
            category: 'Starters',
            description: '',
            dietaryType: 'veg',
            image: '',
            spiceLevel: 'medium'
        });
    } else {
        setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    onSave({
      name: formData.name,
      price: Number(formData.price),
      category: formData.category,
      description: formData.description,
      dietaryType: formData.dietaryType as 'veg' | 'non-veg' | 'egg',
      image: formData.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
      spiceLevel: formData.spiceLevel as 'mild' | 'medium' | 'fiery',
      available: true,
      rating: 5.0, // Default new items to 5 stars
      allergens: [],
      tags: ['new'],
      heroIngredient: 'veg',
      prepTime: 15,
      calories: 300,
      stock: 20,
      type: 'unit'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center px-4">
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div className={`
        relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl overflow-hidden
        transform transition-all duration-300
        ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}
      `}>
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
            <h2 className="font-display font-bold text-xl text-[#0F172A] dark:text-white">Add New Item</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
            </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Name & Price */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dish Name</label>
                    <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-[#FF5722] text-[#0F172A] dark:text-white"
                        placeholder="e.g. Truffle Fries"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹)</label>
                    <input 
                        required
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-[#FF5722] text-[#0F172A] dark:text-white"
                        placeholder="250"
                    />
                </div>
            </div>

            {/* Category & Diet */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-[#FF5722] text-[#0F172A] dark:text-white appearance-none"
                    >
                        <option>Starters</option>
                        <option>Mains</option>
                        <option>Breads/Rice</option>
                        <option>Beverages</option>
                        <option>Dessert</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dietary Type</label>
                    <div className="flex bg-slate-50 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10">
                        {['veg', 'non-veg'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({...formData, dietaryType: type})}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${formData.dietaryType === type ? 'bg-white dark:bg-slate-600 shadow-sm text-[#0F172A] dark:text-white' : 'text-slate-400'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-[#FF5722] text-[#0F172A] dark:text-white text-sm"
                    rows={2}
                    placeholder="Describe the dish..."
                />
            </div>

            {/* Image URL */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-[#FF5722] text-[#0F172A] dark:text-white text-sm"
                        placeholder="https://..."
                    />
                </div>
            </div>

        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-black/20 flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                className="flex-1 py-3 bg-[#FF5722] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                Save Item <Check size={16} strokeWidth={3} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;