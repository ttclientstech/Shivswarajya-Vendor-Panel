import React, { useState, useEffect } from 'react';
import { Camera, Save, MapPin, Phone, Globe, Lock, Bell, Shield, Database, LayoutTemplate, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { profileService, type VendorProfile } from '../services/profileService';
import { fileUploadService } from '../services/fileUploadService';

import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
    const { updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState<Partial<VendorProfile>>({
        businessName: '',
        ownerName: '',
        description: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
        },
        gstNumber: '',
        shopActLicenseUrl: '',
        identityProofUrl: '',
        status: ''
    });

    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<{ logo: boolean }>({ logo: false });

    // ... imports 
    // We also need to store social media links separately?
    // Backend doesn't support them, so we just use the main profile data.

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const profile = await profileService.getProfile();
            console.log('Profile Data fetched:', profile);
            setFormData(profile);
            // Sync with global auth context (Header)
            updateUser({
                businessName: profile.businessName,
                ownerName: profile.ownerName,
                logo: profile.logo,
                isVerified: profile.isVerified,
                status: profile.status
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (type: 'logo', file: File) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        try {
            // Import fileUploadService at top if not present, but using strict replacement here
            // Assuming fileUploadService is imported
            // const { fileUploadService } = await import('../services/fileUploadService');

            const url = await fileUploadService.uploadFile(file);

            setFormData(prev => ({
                ...prev,
                [type]: url
            }));

            // Optional: Auto-save or just let them click save.
            // For better UX, we can just update the preview and let them save.

        } catch (error) {
            console.error(`Failed to upload ${type} `, error);
            alert(`Failed to upload ${type}. Please try again.`);
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await profileService.updateProfile(formData);

            // Sync with global auth context (Header)
            updateUser({
                businessName: formData.businessName,
                ownerName: formData.ownerName,
                logo: formData.logo,
                isVerified: formData.isVerified,
                status: formData.status
            });

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Details', icon: Briefcase },
        { id: 'security', label: 'Security & Login', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy Settings', icon: Shield },
    ];

    if (isFetching) {
        return <div className="p-12 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Hidden Inputs */}
            <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload('logo', e.target.files[0])}
            />

            {/* Header / Cover Section */}
            <div className="relative group">
                <div className="h-64 md:h-80 w-full rounded-3xl bg-gray-900 overflow-hidden shadow-xl relative">
                    {/* Fixed High-Quality Marketplace Image */}
                    <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop"
                        alt="Marketplace Banner"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                </div>

                {/* Profile Avatar & Quick Info Layer */}
                <div className="px-8 md:px-12 relative -mt-24 flex flex-col md:flex-row items-end gap-6">
                    <div className="relative group/avatar">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[6px] border-white shadow-2xl bg-white overflow-hidden relative z-10">
                            <img
                                src={formData.logo || "https://ui-avatars.com/api/?name=" + (formData.businessName || "Vendor") + "&background=0f172a&color=fff&size=200&font-size=0.33"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                            <div
                                className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                <Camera className="text-white drop-shadow-md" size={32} />
                            </div>
                            {uploading.logo && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 pb-4 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-sm">{formData.businessName}</h1>
                        <p className="text-gray-500 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full inline-block ${(formData.isVerified || formData.status?.toUpperCase() === 'APPROVED' || formData.status?.toLowerCase() === 'active') ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                            {(formData.isVerified || formData.status?.toUpperCase() === 'APPROVED' || formData.status?.toLowerCase() === 'active') ? 'Verified Vendor' : 'Unverified Vendor'}
                            <span className="text-gray-300 mx-1">|</span>
                            {formData.ownerName}
                        </p>
                    </div>

                    <div className="pb-6 w-full md:w-auto flex justify-center md:block">
                        <Button onClick={handleSave} isLoading={isLoading} className="px-8 py-3 text-sm tracking-wide bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                            <Save size={18} className="mr-2" /> Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs & Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-4 md:px-0">

                {/* Vertical Navigation (Desktop) / Horizontal (Mobile) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
                                            ${activeTab === tab.id
                                                ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Contact Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-lg text-white hidden lg:block">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Globe size={18} className="text-blue-400" /> Quick Access
                            </h3>
                            <ul className="space-y-4 text-sm text-gray-300">
                                <li className="flex items-start gap-3">
                                    <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                                    {formData.address?.city || 'City'}, {formData.address?.state || 'State'}
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={16} className="shrink-0 text-gray-400" />
                                    {formData.phone}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">

                    {/* Profile Details Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Shop Info Section */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Shop Information</h2>
                                        <p className="text-gray-500 text-sm mt-1">Details about your business visible to customers.</p>
                                    </div>
                                    <LayoutTemplate className="text-gray-300" size={24} />
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <Input label="Shop Name" name="businessName" value={formData.businessName} onChange={handleInputChange} />
                                    <Input label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleInputChange} />

                                    <div className="md:col-span-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1 mb-2 block">About Our Shop</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm resize-none"
                                            placeholder="Tell customers about your business structure, history, and values..."
                                        />
                                    </div>

                                    <Input label="Business Phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled className="bg-gray-50/50 text-gray-500 cursor-not-allowed" />
                                    {/* Email Removed from editable fields */}
                                    <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} disabled className="bg-gray-50/50 text-gray-500 cursor-not-allowed" />
                                </div>
                            </div>

                            {/* Online Presence Section Removed as per backend schema */}
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fadeIn">
                            <div className="max-w-xl">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Security & Login</h2>
                                <p className="text-gray-500 text-sm mb-8">Ensure your account is secure by using a strong password.</p>

                                <div className="space-y-6">
                                    <Input type="password" label="Current Password" placeholder="••••••••" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="password" label="New Password" placeholder="••••••••" />
                                        <Input type="password" label="Confirm Password" placeholder="••••••••" />
                                    </div>
                                    <div className="pt-4">
                                        <Button className="bg-gray-900 hover:bg-black text-white px-6">Update Password</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
                            <div className="p-8 border-b border-gray-50">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                                <p className="text-gray-500 text-sm">Manage what emails and alerts you receive.</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[
                                    { title: 'New Orders', desc: 'Get notified immediately when a new order is placed.', icon: Bell },
                                    { title: 'Inventory Alerts', desc: 'Receive a digest when products run low on stock.', icon: Database },
                                    { title: 'Account Security', desc: 'Alerts for any suspicious activity on your account.', icon: Lock }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="p-3 rounded-full bg-orange-50 text-orange-600 shrink-0">
                                            <item.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                    <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fadeIn">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                                    <Database size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Data Export</h2>
                                    <p className="text-gray-500 text-sm mb-4 leading-relaxed max-w-lg">
                                        You can download a copy of your data at any time. This includes your product listings, order history, and account activity logs in JSON or CSV format.
                                    </p>
                                    <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                                        Download My Data
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
