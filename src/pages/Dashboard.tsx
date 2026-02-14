import { useEffect, useState } from 'react';
import { financialGrowthData } from '../data/mockData';
import { IndianRupee, Users, Package, AlertTriangle } from 'lucide-react';
import { productService, type Product } from '../services/productService';
import { orderService } from '../services/orderService';
import {
    AreaChart,
    Area,
    XAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#FF6B00', '#FF8C42', '#FFAD7D', '#FFCEB5', '#E5E7EB'];

export const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProducts: 0,
        totalOrders: 0,
        lowStockProducts: 0
    });
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
    const [monthlyRevenueData, setMonthlyRevenueData] = useState<{ name: string; revenue: number }[]>([]);
    const [timeRange, setTimeRange] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
    const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Products
                const productsResponse = await productService.getProducts(1, 100);
                const products = productsResponse.products || [];

                // Calculate Product Stats
                const totalProducts = productsResponse.total || 0;
                const lowStockCount = products.filter((p: Product) => p.stock < 10).length;

                // Calculate Category Split
                const categoryCount: { [key: string]: number } = {};
                products.forEach((p: Product) => {
                    const catName = p.category?.name || 'Uncategorized';
                    categoryCount[catName] = (categoryCount[catName] || 0) + 1;
                });

                const categorySplit = Object.entries(categoryCount).map(([name, value]) => ({
                    name,
                    value
                })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories

                setCategoryData(categorySplit);

                // Fetch Orders
                const ordersResponse = await orderService.getOrders(1, 100);
                console.log("Order API Response:", ordersResponse); // Debugging Log
                const orders = ordersResponse.orders || [];
                const totalOrders = ordersResponse.total || 0;

                // Calculate Revenue (Sum of totalAmount from fetched orders)
                // Note: Ideally backend should provide this aggregation
                const validOrders = orders.filter(
                    order => ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus) && order.paymentStatus !== 'FAILED'
                );
                const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

                // Calculate Weekly Revenue Data (Last 7 Days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                });

                const weeklyRevenue = last7Days.map(date => {
                    const dateString = date.toLocaleDateString();
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                    const dailyRevenue = validOrders
                        .filter(order => new Date(order.createdAt).toLocaleDateString() === dateString)
                        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

                    return {
                        name: dayName,
                        revenue: dailyRevenue
                    };
                });

                setRevenueData(weeklyRevenue);

                // --- Monthly Revenue Data (Last 6 Months) ---
                const last6Months = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - (5 - i));
                    return d;
                });

                const monthlyRevenue = last6Months.map(date => {
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    const monthIndex = date.getMonth();
                    const year = date.getFullYear();

                    const monthlyTotal = validOrders
                        .filter(order => {
                            const d = new Date(order.createdAt);
                            return d.getMonth() === monthIndex && d.getFullYear() === year;
                        })
                        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

                    return {
                        name: monthName,
                        revenue: monthlyTotal
                    };
                });
                setMonthlyRevenueData(monthlyRevenue);

                setStats({
                    totalRevenue,
                    totalProducts, // Replaces "Active Vendors" with "Total Products" which is more relevant
                    totalOrders,
                    lowStockProducts: lowStockCount
                });

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        {
            label: 'TOTAL REVENUE',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            growth: '+12%', // hardcoded for now as we lack historical data
            icon: IndianRupee,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600'
        },
        {
            label: 'TOTAL PRODUCTS', // Changed from Active Vendors
            value: stats.totalProducts,
            growth: '+5%',
            icon: Package, // Changed icon to Package
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'TOTAL ORDERS',
            value: stats.totalOrders,
            growth: '+8%',
            icon: Users, // Kept Users icon but could be ShoppingBag
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'LOW STOCK PRODUCTS',
            value: stats.lowStockProducts,
            growth: stats.lowStockProducts > 0 ? '-2%' : '+0%', // Dynamic direction if needed
            icon: AlertTriangle,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
    ];

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                                <stat.icon className={stat.iconColor} size={24} />
                            </div>
                            <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                ↗ {stat.growth}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold tracking-wider mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Growth Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Income Analysis & Trends</p>
                        </div>
                        <div className="flex bg-gray-50 rounded-lg p-1">
                            <button
                                onClick={() => setTimeRange('WEEKLY')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all ${timeRange === 'WEEKLY' ? 'text-orange-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                WEEKLY
                            </button>
                            <button
                                onClick={() => setTimeRange('MONTHLY')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all ${timeRange === 'MONTHLY' ? 'text-orange-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                MONTHLY
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeRange === 'WEEKLY' ? revenueData : monthlyRevenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dy={10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#FF6B00"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Split Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900">Category Split</h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Inventory Distribution</p>
                    </div>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {(categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1 }]).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Overly */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total SKU</p>
                        </div>
                    </div>
                    {/* Legend for Categories */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {categoryData.slice(0, 3).map((entry, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="text-xs text-gray-500">{entry.name}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};
