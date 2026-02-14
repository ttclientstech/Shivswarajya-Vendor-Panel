import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ChevronRight, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { orderService, type VendorOrder } from '../services/orderService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Orders: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await orderService.getOrders(page, 20, statusFilter);
            setOrders(data.orders);
            setTotalPages(data.pages);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrderClick = (orderId: string) => {
        navigate(`/orders/${orderId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-100 text-green-700';
            case 'SHIPPED': return 'bg-blue-100 text-blue-700';
            case 'PROCESSING': return 'bg-yellow-100 text-yellow-700';
            case 'PENDING': return 'bg-orange-100 text-orange-700';
            case 'PLACED': return 'bg-purple-100 text-purple-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and track your customer orders.</p>
                </div>
                <Button variant="outline" onClick={() => fetchOrders()} isLoading={isLoading}>
                    <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <Input
                        placeholder="Search by Order ID..."
                        icon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1); // Reset to page 1 on filter change
                        }}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all cursor-pointer appearance-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PLACED">Placed</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading && orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Loading orders...</div>
                ) : filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => handleOrderClick(order._id)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-900">{order.orderNumber}</span>
                                                    <span className="text-xs text-gray-500">{order.items.length} Items</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar size={14} className="mr-2 text-gray-400" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.customerName || `Customer ${order.customerId?.substring(0, 6) || 'N/A'}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize border ${order.paymentStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                order.paymentStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {order.paymentStatus.toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center font-bold text-gray-900">
                                                <DollarSign size={14} className="text-gray-400 mr-1" />
                                                {order.totalAmount.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" className="text-gray-400 hover:text-orange-600">
                                                <ChevronRight size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="text-gray-500 mt-1">When customers place orders, they will appear here.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="text-sm"
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm font-medium text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="text-sm"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
