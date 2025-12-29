import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { OrderTicket } from '../App'; // Using the App types for now
import StaffNavbar from '../components/StaffNavbar';
import { TrendingUp, DollarSign, Activity, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            const data = await api.getOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to load metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 10000); // Poll faster for analytics
        return () => clearInterval(interval);
    }, []);

    // --- METRICS CALCULATION ---
    // 1. Total Revenue (Paid Orders)
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // 2. Average Order Value
    const aov = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // 3. Active Orders (Live)
    const activeOrdersCount = orders.filter(o => !['paid', 'cancelled'].includes(o.status)).length;

    // 4. Best Seller Logic
    const itemCounts: { [key: string]: number } = {};
    paidOrders.forEach(o => {
        o.items?.forEach((i: any) => {
            itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
        });
    });
    // Find key with max value
    const bestSeller = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]; // [name, count]

    return (
        <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0F172A] pt-20 pb-12 font-sans transition-colors">
            <StaffNavbar />

            <div className="max-w-7xl mx-auto px-6">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time performance metrics</p>
                </header>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="bg-green-500"
                        trend="+12% today"
                    />
                    <StatCard
                        title="Active Orders"
                        value={activeOrdersCount}
                        icon={Activity}
                        color="bg-blue-500"
                        trend="Live"
                    />
                    <StatCard
                        title="Avg. Ticket"
                        value={`₹${Math.round(aov)}`}
                        icon={TrendingUp}
                        color="bg-purple-500"
                    />
                    <StatCard
                        title="Top Seller"
                        value={bestSeller ? bestSeller[0] : "N/A"}
                        sub={bestSeller ? `${bestSeller[1]} units sold` : ""}
                        icon={ShoppingBag}
                        color="bg-orange-500"
                    />
                </div>

                {/* RECENT ACTIVITY TABLE */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h3>
                        <span className="text-xs text-slate-400">showing last 10</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-white/5 uppercase text-xs font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Guest / Table</th>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {[...paidOrders].reverse().slice(0, 10).map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{order.id.slice(-6)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            {order.guestName} <span className="opacity-50">#T{order.tableId}</span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px]">
                                            {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 font-bold">₹{order.totalAmount}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {paidOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No paid orders yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Subcomponent
const StatCard = ({ title, value, icon: Icon, color, sub, trend }: any) => (
    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 flex items-start justify-between">
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                    <ArrowUpRight size={12} />
                    {trend}
                </div>
            )}
        </div>
        <div className={`p-3 rounded-lg ${color} text-white shadow-lg shadow-${color.replace('bg-', '')}/30`}>
            <Icon size={24} />
        </div>
    </div>
);

export default ManagerDashboard;
