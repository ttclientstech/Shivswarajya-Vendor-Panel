import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,

    Box,
    Search,
    Bell,
    LogOut,
    ShoppingBag
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShoppingBag, label: 'Orders', path: '/orders' },
        { icon: Box, label: 'Categories', path: '/categories' },
    ];

    // Get initials from business name or owner name or email
    const getInitials = () => {
        if (user?.businessName) return user.businessName.charAt(0).toUpperCase();
        if (user?.ownerName) return user.ownerName.charAt(0).toUpperCase();
        return 'V';
    };

    return (
        <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-10">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <div className="text-white font-bold text-xl">{getInitials()}</div>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg leading-tight">SHIVSWARAJYA</h1>
                        <p className="text-xs text-orange-600 font-semibold tracking-wider">VENDOR PORTAL</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-4 py-3 rounded-lg w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

const Header = () => {
    const { user } = useAuth();

    // Prioritize logo, then business name initials, then fallback
    const nameForAvatar = user?.businessName || user?.ownerName || 'Vendor';
    const avatarSrc = user?.logo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=FF6B00&color=fff&bold=true`;

    console.log('Header Avatar Debug:', { user, nameForAvatar, avatarSrc });

    return (
        <header className="bg-white h-20 border-b border-gray-100 flex items-center justify-end px-8 fixed top-0 right-0 left-64 z-10">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Deep Search..."
                        className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl w-64 focus:ring-2 focus:ring-orange-100 focus:outline-none text-sm"
                    />
                </div>
                <div className="relative cursor-pointer">
                    <Bell className="text-gray-500 hover:text-orange-600 transition-colors" size={20} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </div>
                <NavLink to="/profile" className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-300 transition-all">
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                </NavLink>
            </div>
        </header>
    )
}

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <Header />
            <main className="pl-64 pt-20 transition-all duration-300">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
