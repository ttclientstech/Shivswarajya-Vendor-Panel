import { apiClient } from './apiClient';

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
        isProfileComplete: boolean;
        businessName?: string; // Optional if needed
    };
}

export const authService = {
    sendOtp: async (email: string) => {
        return apiClient.post<{ message: string }>('/auth/login/send-otp', { email });
    },

    verifyOtp: async (email: string, otp: string) => {
        return apiClient.post<AuthResponse>('/auth/vendor/verify-otp', { email, otp });
    }
};
