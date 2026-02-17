import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Mail, Package, CheckCircle, AlertCircle, Calendar, Hash } from 'lucide-react';
import { orderService, type VendorOrder } from '../services/orderService';
import { productService } from '../services/productService';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

export const OrderDetail: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<VendorOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    const fetchOrder = async (id: string) => {
        try {
            const data = await orderService.getOrder(id);

            // Enrich items with images if missing
            const enrichedItems = await Promise.all(data.items.map(async (item) => {
                // 1. Try common field names on the item itself
                let image = item.image ||
                    (item as any).images?.[0] ||
                    (item as any).productImage ||
                    (item as any).thumbnail ||
                    (item as any).imageUrl ||
                    (item as any).img;

                // 2. Check if productId is an object (populated product)
                if (!image && item.productId && typeof item.productId === 'object') {
                    const prodObj = item.productId as any;
                    image = prodObj.images?.[0] || prodObj.image || prodObj.productImage || prodObj.thumbnail;
                }

                // 3. Fallback to fetching product details if we have a string ID
                if (!image && item.productId && typeof item.productId === 'string') {
                    try {
                        const product = await productService.getProduct(item.productId);
                        image = (product.images && product.images.length > 0) ? product.images[0] : (product as any).image;
                    } catch (err) {
                        console.error(`Failed to fetch product details for ${item.productId}:`, err);
                    }
                }

                // 4. One last check for any nested product object (sometimes patterns vary)
                if (!image && (item as any).product && typeof (item as any).product === 'object') {
                    const prodObj = (item as any).product;
                    image = prodObj.images?.[0] || prodObj.image || prodObj.imageUrl;
                }

                return { ...item, image };
            }));

            setOrder({ ...data, items: enrichedItems });
        } catch (error) {
            console.error('Failed to fetch order details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (productId: any, newStatus: string) => {
        if (!order || !orderId) return;

        // Ensure we use the string ID if productId is an object (populated)
        const targetProductId = typeof productId === 'object' ? (productId?._id || productId?.id || productId) : productId;

        setUpdatingItemId(targetProductId);
        const previousOrder = { ...order };

        try {
            // Optimistic update - compare string IDs
            const updatedItems = order.items.map(item => {
                const itemProdId = typeof item.productId === 'object' ? (item.productId as any)?._id || (item.productId as any)?.id : item.productId;
                return itemProdId === targetProductId ? { ...item, status: newStatus as any } : item;
            });
            setOrder({ ...order, items: updatedItems });

            await orderService.updateOrderItemStatus(orderId, targetProductId, newStatus);

            // Always fetch the fresh order details to ensure we have the source of truth
            await fetchOrder(orderId);
        } catch (error: any) {
            console.error('Failed to update status', error);
            alert(`Failed to update order status: ${error.message || 'Unknown error'}`);
            // Revert changes
            setOrder(previousOrder);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'text-green-600 bg-green-50 border-green-100';
            case 'SHIPPED': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'PROCESSING': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-gray-500">Loading order details...</div>;
    }

    if (!order) {
        return (
            <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Order Not Found</h3>
                <Button variant="ghost" onClick={() => navigate('/orders')} className="mt-4">
                    <ArrowLeft size={16} className="mr-2" /> Back to Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/orders')} className="text-gray-500 hover:text-gray-900 -ml-2">
                    <ArrowLeft size={20} className="mr-2" /> Back
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={14} /> {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Package size={20} className="text-orange-500" />
                                Order Items ({order.items.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items.map((item) => (
                                <div key={item._id} className="p-6 flex flex-col sm:flex-row gap-6">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        {item.image ? (
                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400 p-2 text-center">
                                                <Package size={24} className="mb-1" />
                                                <span className="text-[10px] leading-tight px-1 font-medium">Image Not Found</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{item.productName}</h3>
                                                {/* <p className="text-sm text-gray-500">Product ID: {item.productId}</p> */}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">₹{item.subtotal}</p>
                                                <p className="text-xs text-gray-500">{item.quantity} x ₹{item.price}</p>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-wrap items-center gap-4">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Update Status</label>
                                                <Select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusUpdate(item.productId, e.target.value)}
                                                    disabled={
                                                        item.status === 'DELIVERED' || 
                                                        item.status === 'CANCELLED' || 
                                                        updatingItemId === (typeof item.productId === 'object' ? (item.productId as any)?._id || (item.productId as any)?.id : item.productId)
                                                    }
                                                    options={[
                                                        { value: 'PROCESSING', label: 'Processing' },
                                                        { value: 'SHIPPED', label: 'Shipped' },
                                                        { value: 'DELIVERED', label: 'Delivered' }
                                                    ]}
                                                    className={`${item.status === 'DELIVERED' ? 'border-green-200 bg-green-50 text-green-700' :
                                                        item.status === 'SHIPPED' ? 'border-blue-200 bg-blue-50 text-blue-700' : ''
                                                        }`}
                                                />
                                            </div>
                                            {item.status === 'DELIVERED' && (
                                                <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg mt-5">
                                                    <CheckCircle size={16} className="mr-2" />
                                                    Delivered
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                            <span className="font-medium text-gray-600">Total Order Value</span>
                            <span className="text-2xl font-bold text-gray-900">₹{order.totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Shipping */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <AlertCircle size={20} />
                            </div>
                            Customer Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-gray-400"><Hash size={16} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Customer Name</p>
                                    <p className="text-sm font-semibold text-gray-900">{order.shippingAddress?.fullName || 'Guest'}</p>
                                    <p className="text-xs text-gray-400 mt-1">ID: {order.customerId || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-gray-400"><Mail size={16} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Contact</p>
                                    <p className="text-sm text-gray-600 font-medium">{order.shippingAddress?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <MapPin size={20} />
                            </div>
                            Shipping Address
                        </h2>
                        {order.shippingAddress ? (
                            <div className="space-y-1 text-sm text-gray-600">
                                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.addressLine}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                <p>{order.shippingAddress.country || 'India'} - {order.shippingAddress.pincode}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No shipping address provided</p>
                        )}
                    </div>

                    {/* Support Card */}
                    <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
                        <h3 className="font-bold text-orange-800 mb-2">Need Help?</h3>
                        <p className="text-sm text-orange-700 mb-4">Contact admin support for order disputes or issues.</p>
                        <Button className="w-full bg-white text-orange-600 border border-orange-200 hover:bg-orange-50">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
