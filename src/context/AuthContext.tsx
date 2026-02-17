import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    role: 'vendor' | 'VENDOR';
    isProfileComplete: boolean;
    businessName?: string;
    ownerName?: string;
    logo?: string;
    coverImage?: string;
    isVerified?: boolean;
    status?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (token: string, user: any) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for persisted auth state on mount
        const storedAuth = localStorage.getItem('vendor_auth');
        const token = localStorage.getItem('vendor_token');

        if (storedAuth && token) {
            try {
                const userData = JSON.parse(storedAuth);
                setUser({ ...userData, role: 'vendor' });
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Failed to parse auth storage", error);
                localStorage.removeItem('vendor_auth');
                localStorage.removeItem('vendor_token');
            }
        } else {
            // Clean up if partial data exists
            localStorage.removeItem('vendor_auth');
            localStorage.removeItem('vendor_token');
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, userData: any) => {
        const newUser = { ...userData, role: 'vendor' };
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('vendor_token', token);
        localStorage.setItem('vendor_auth', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('vendor_auth');
        localStorage.removeItem('vendor_token');
    };

    const updateUser = (data: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updatedUser = { ...prev, ...data };
            localStorage.setItem('vendor_auth', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
