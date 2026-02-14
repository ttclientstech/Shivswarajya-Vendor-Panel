export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiClient = {
    request: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
        // const token = localStorage.getItem('vendor_token');
        const token = '2'; // Hardcoded token for testing vendor access

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);

            // Handle 401 Unauthorized globally if needed (e.g., redirect to login)
            if (response.status === 401) {
                // Optionally emit an event or clear token
                // localStorage.removeItem('vendor_token');
                // window.location.href = '/login';
            }

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error?.message || data.message || 'Something went wrong';
                throw new Error(errorMessage);
            }

            return data.data !== undefined ? data.data : data;
        } catch (error: any) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    get: <T>(endpoint: string, headers?: Record<string, string>) =>
        apiClient.request<T>(endpoint, { method: 'GET', headers }),

    post: <T>(endpoint: string, body: any, headers?: Record<string, string>) =>
        apiClient.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), headers }),

    patch: <T>(endpoint: string, body: any, headers?: Record<string, string>) =>
        apiClient.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers }),

    delete: <T>(endpoint: string, headers?: Record<string, string>) =>
        apiClient.request<T>(endpoint, { method: 'DELETE', headers }),
};
