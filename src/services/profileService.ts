import { apiClient } from './apiClient';

export interface VendorProfile {
    _id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    gstNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    description?: string;
    logo?: string;
    coverImage?: string;
    shopActLicenseUrl: string;
    identityProofUrl: string;
    isVerified: boolean;
    isActive: boolean;
    status: string;
}

export const profileService = {
    getProfile: async () => {
        return apiClient.get<VendorProfile>('/vendor/profile');
    },

    setupProfile: async (data: any) => {
        return apiClient.post<VendorProfile>('/vendor/profile/setup', data);
    },

    updateProfile: async (data: Partial<VendorProfile>) => {
        return apiClient.patch<VendorProfile>('/vendor/profile/update', data);
    }
};
