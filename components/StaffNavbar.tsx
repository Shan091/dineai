import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChefHat, Utensils, LayoutList, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

const StaffNavbar: React.FC = () => {
    const location = useLocation();
    const { isAudioEnabled, toggleAudio } = useRestaurant();

    const navItems = [
        { to: '/kitchen', label: 'Kitchen', icon: ChefHat },
        { to: '/service', label: 'Service', icon: Utensils },
        { to: '/inventory', label: 'Inventory', icon: LayoutList },
        { to: '/manager', label: 'Manager', icon: TrendingUp },
    ];

    return (
        <div className="fixed top-0 left-0 w-full bg-slate-950 z-[100] flex items-center px-6 py-4 shadow-xl border-b border-white/5">
            <div className="flex items-center gap-8 mx-auto w-full max-w-7xl">
                <h1 className="text-white font-bold text-xl tracking-tight mr-4">
                    <span className="text-orange-500">Dine</span>AI <span className="text-slate-500 text-sm font-normal">Staff</span>
                </h1>

                <nav className="flex items-center gap-6 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `
                flex items-center gap-2 text-sm font-medium transition-colors
                ${isActive
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-200'}
              `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Audio Toggle */}
                <button
                    onClick={toggleAudio}
                    className={`p-2 rounded-full transition-colors ${isAudioEnabled ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    title={isAudioEnabled ? "Mute Notifications" : "Enable Audio"}
                >
                    {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>
        </div>
    );
};

export default StaffNavbar;
