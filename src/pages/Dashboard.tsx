import { useEffect, useState } from 'react';

import { IndianRupee, Users, Package, AlertTriangle, X } from 'lucide-react';
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
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'PRODUCTS' | 'ORDERS' | 'LOW_STOCK' | null;
        title: string;
        data: any[];
    }>({ isOpen: false, type: null, title: '', data: [] });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Products and Categories in parallel
                const [productsResponse, categoriesData] = await Promise.all([
                    productService.getProducts(1, 1000), // Fetch more to get better distribution
                    productService.getCategories()
                ]);

                const products = productsResponse.products || [];
                setAllProducts(products); // Save for modal

                // Create Category ID -> Name map
                const catMap: Record<string, string> = {};
                categoriesData.forEach((cat: any) => {
                    catMap[cat._id] = cat.name;
                    catMap[cat.id] = cat.name;
                });
                setCategoryMap(catMap); // Save for modal

                // Calculate Product Stats
                const totalProducts = productsResponse.total || 0;
                const lowStockCount = products.filter((p: Product) => p.stock < 5).length;

                // Calculate Category Split
                const categoryCount: { [key: string]: number } = {};
                products.forEach((p: Product) => {
                    // Try to get category ID from populated object or direct ID
                    const catId = p.category?._id ||
                        (typeof p.categoryId === 'object' && p.categoryId !== null ? (p.categoryId as any)._id : p.categoryId);

                    // Get name from map or use populated name if available, fallback to Uncategorized
                    const catName = catMap[catId] || p.category?.name || 'Uncategorized';

                    categoryCount[catName] = (categoryCount[catName] || 0) + 1;
                });

                const categorySplit = Object.entries(categoryCount).map(([name, value]) => ({
                    name,
                    value
                })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories

                setCategoryData(categorySplit);

                // Fetch Orders
                const ordersResponse = await orderService.getOrders(1, 100);
                // console.log("Order API Response:", ordersResponse); // Debugging Log
                const orders = ordersResponse.orders || [];

                // Process recent orders for display (Fetch details for top 10)
                const recentOrdersRaw = orders.slice(0, 10);
                const ordersWithDetails = await Promise.all(
                    recentOrdersRaw.map(async (order) => {
                        try {
                            const detailedOrder = await orderService.getOrder(order._id);
                            return {
                                ...order,
                                shippingAddress: detailedOrder.shippingAddress,
                                customerName: detailedOrder.customerName || detailedOrder.shippingAddress?.fullName
                            };
                        } catch (err) {
                            console.error(`Failed to fetch details for order ${order._id}`, err);
                            return order;
                        }
                    })
                );
                setAllOrders(ordersWithDetails); // Save for modal (Detailed 10)

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

    const handleCardClick = (type: 'PRODUCTS' | 'ORDERS' | 'LOW_STOCK') => {
        let data = [];
        let title = '';

        if (type === 'LOW_STOCK') {
            title = 'Low Stock Products (Less than 5)';
            data = allProducts.filter(p => p.stock < 5);
        } else if (type === 'PRODUCTS') {
            title = 'All Products';
            data = allProducts;
        } else if (type === 'ORDERS') {
            title = 'Recent Orders';
            data = allOrders;
        }

        setModalConfig({ isOpen: true, type, title, data });
    };

    const statCards = [
        {
            label: 'TOTAL REVENUE',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            growth: '+12%', // hardcoded for now as we lack historical data
            icon: IndianRupee,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            onClick: null
        },
        {
            label: 'TOTAL PRODUCTS', // Changed from Active Vendors
            value: stats.totalProducts,
            growth: '+5%',
            icon: Package, // Changed icon to Package
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            onClick: () => handleCardClick('PRODUCTS')
        },
        {
            label: 'TOTAL ORDERS',
            value: stats.totalOrders,
            growth: '+8%',
            icon: Users, // Kept Users icon but could be ShoppingBag
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            onClick: () => handleCardClick('ORDERS')
        },
        {
            label: 'LOW STOCK PRODUCTS',
            value: stats.lowStockProducts,
            growth: stats.lowStockProducts > 0 ? '-2%' : '+0%', // Dynamic direction if needed
            icon: AlertTriangle,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            onClick: () => handleCardClick('LOW_STOCK')
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
                    <div
                        key={index}
                        onClick={stat.onClick ? stat.onClick : undefined}
                        className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all ${stat.onClick ? 'cursor-pointer active:scale-95' : ''}`}
                    >
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

            {/* Detail Modal */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{modalConfig.title}</h2>
                            <button
                                onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} /> {/* Assuming X is imported from lucide-react */}
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-0 overflow-y-auto custom-scrollbar">
                            {modalConfig.data.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No data found.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            {modalConfig.type === 'ORDERS' ? (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {modalConfig.data.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                {modalConfig.type === 'ORDERS' ? (
                                                    <>
                                                        <td className="px-6 py-4 font-medium text-gray-900">#{item.orderNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{item.customerName || item.shippingAddress?.fullName || 'N/A'}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-900">₹{item.totalAmount}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide
                                                                ${item.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                                    item.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {item.orderStatus}
                                                            </span>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={item.images?.[0] || 'https://placehold.co/100'}
                                                                    alt=""
                                                                    className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                                                />
                                                                <div className="font-medium text-gray-900 line-clamp-1">{item.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {/* Resolve Category Name */}
                                                            {(() => {
                                                                const catId = item.category?._id ||
                                                                    (typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId);
                                                                return categoryMap[catId] || item.category?.name || 'Uncategorized';
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">₹{item.price}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-bold ${item.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {item.stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide
                                                                ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                {item.isActive ? 'Active' : 'Draft'}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}


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
