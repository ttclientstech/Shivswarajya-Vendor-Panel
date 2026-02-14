import { apiClient } from './apiClient';

export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    categoryId: string;
    category?: {
        _id: string;
        name: string;
    };
    images: string[];
    stock: number;
    sku?: string;
    tags: string[];
    isActive: boolean;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string; // Add updated date field
}

export interface ProductsResponse {
    products: Product[];
    total: number;
    pages: number;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive: boolean;
    productCount?: number;
}

export const productService = {
    getCategories: async () => {
        // Public endpoint to fetch categories
        const response = await apiClient.get<{ categories: Category[] }>('/public/categories');
        return response.categories;
    },

    getProducts: async (page = 1, limit = 20, search?: string) => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search ? { search } : {})
        });
        return apiClient.get<ProductsResponse>(`/vendor/products?${queryParams.toString()}`);
    },

    getProduct: async (id: string) => {
        return apiClient.get<Product>(`/vendor/products/${id}`);
    },

    createProduct: async (data: Partial<Product>) => {
        return apiClient.post<Product>('/vendor/products', data);
    },

    updateProduct: async (id: string, data: Partial<Product>) => {
        return apiClient.patch<Product>(`/vendor/products/${id}`, data);
    },

    updateProductStatus: async (id: string, isActive: boolean) => {
        return apiClient.patch<Product>(`/vendor/products/${id}/status`, { isActive });
    },

    deleteProduct: async (id: string) => {
        return apiClient.delete<{ message: string }>(`/vendor/products/${id}`);
    }
};
