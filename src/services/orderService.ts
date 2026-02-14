import { apiClient } from './apiClient';

export interface OrderItem {
    _id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    vendorId: string;
    status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    image?: string;
}

export interface VendorOrder {
    _id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    orderStatus: 'PLACED' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    items: OrderItem[];
    customerId?: string;
    shippingAddress?: {
        fullName?: string;
        phone?: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
    };
    customerName?: string;
}

export interface OrdersResponse {
    orders: VendorOrder[];
    total: number;
    pages: number;
}

export const orderService = {
    getOrders: async (page = 1, limit = 20, status?: string) => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && status !== 'ALL' ? { status } : {})
        });
        return apiClient.get<OrdersResponse>(`/vendor/orders?${queryParams.toString()}`);
    },

    getOrder: async (orderId: string) => {
        return apiClient.get<VendorOrder>(`/vendor/orders/${orderId}`);
    },

    updateOrderItemStatus: async (orderId: string, productId: string, status: string) => {
        return apiClient.patch<VendorOrder>(`/vendor/orders/${orderId}/status`, { productId, status });
    }
};
