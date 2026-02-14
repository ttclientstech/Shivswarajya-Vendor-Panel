
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Save,
    ShieldCheck,
    Store,
    MapPin,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FileUpload } from '../components/ui/FileUpload';
import { profileService } from '../services/profileService';
import { fileUploadService } from '../services/fileUploadService';

const BUSINESS_CATEGORIES = [
    { value: 'grocery', label: 'Grocery & Essentials' },
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'home', label: 'Home & Kitchen' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'other', label: 'Other Business' },
];

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

    // Form State
    const [formData, setFormData] = useState({
        // Stage 1: Business Details
        legalShopName: '',
        ownerName: '',
        businessCategory: '',
        businessId: '',
        // Stage 2: Location & Contact
        mobile: '',
        address: '',
        city: '',
        pincode: '',
        // Stage 3: Documents
        idProof: null as File | string | null, // Can be File object or URL string
        license: null as File | string | null, // Can be File object or URL string
    });

    const handleInputChange = (field: string, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (field: string, file: File) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            const url = await fileUploadService.uploadFile(file);
            handleInputChange(field, url); // Store URL directly in formData
        } catch (error) {
            console.error(`Failed to upload ${field} `, error);
            alert('File upload failed. Please try again.');
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const isStepValid = () => {
        if (step === 1) {
            return formData.legalShopName && formData.ownerName && formData.businessCategory && formData.businessId;
        }
        if (step === 2) {
            return formData.mobile && formData.address && formData.city && formData.pincode;
        }
        if (step === 3) {
            // In a real app, we'd check if URLs are present. 
            // For now, checks if files are selected or URLs are set (if we had them)
            // Since handleInputChange now stores URLs for file fields, check truthiness
            return formData.idProof && formData.license;
        }
        return false;
    };

    const handleNext = () => {
        if (isStepValid()) {
            setStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStepValid()) return;

        setIsLoading(true);
        try {
            // Prepare payload
            const payload = {
                businessName: formData.legalShopName,
                ownerName: formData.ownerName,
                phone: formData.mobile,
                gstNumber: formData.businessId, // Use actual input
                address: {
                    street: formData.address,
                    city: formData.city,
                    state: 'Maharashtra',
                    pincode: formData.pincode
                },
                description: `Category: ${formData.businessCategory} `,
                // Assuming handleFileUpload has updated these with URLs. 
                // If they are File objects (not uploaded), this might fail if backend expects strings.
                // But simplified flow assumes upload happens or we pass placeholder/blob URLs.
                shopActLicenseUrl: formData.license instanceof File ? URL.createObjectURL(formData.license) : (formData.license as string),
                identityProofUrl: formData.idProof instanceof File ? URL.createObjectURL(formData.idProof) : (formData.idProof as string)
            };

            try {
                await profileService.setupProfile(payload);
            } catch (error: any) {
                // Check if error is 409 Conflict (Profile already exists)
                // The error message might vary, checking for status or message text
                if (error.message && (error.message.includes('409') || error.message.includes('exists'))) {
                    console.log("Profile exists, attempting update...");
                    await profileService.updateProfile(payload);
                } else {
                    throw error; // Re-throw if it's not a conflict error
                }
            }

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Onboarding failed', error);
            alert(error.message || 'Failed to complete onboarding. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Sidebar - Visuals */}
            <div className="hidden lg:flex w-[40%] bg-zinc-900 text-white flex-col justify-between p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-orange-500 p-2 rounded-lg">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl leading-none">SHIVSWARAJYA</h1>
                            <p className="text-xs text-orange-400 font-semibold tracking-wider mt-1">VENDOR PORTAL</p>
                        </div>
                    </div>

                    <div className="space-y-8 mt-20">
                        <h2 className="text-4xl font-bold leading-tight">
                            Start selling to <br />
                            <span className="text-orange-500">millions</span> today.
                        </h2>
                        <p className="text-gray-400 text-lg max-w-md">
                            Join Maharashtra's fastest-growing digital marketplace. Setup your shop in minutes and reach customers seamlessly.
                        </p>

                        <div className="space-y-4 pt-8">
                            {[
                                'Zero commission for first 3 months',
                                'Instant payouts & settlement',
                                '24/7 Seller Support',
                                'Smart inventory management'
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                    </div>
                                    <span className="text-gray-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-gray-500">
                    © 2024 Shivswarajya. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <div className="flex-1 max-w-3xl mx-auto w-full p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {step === 1 && "Tell us about your business"}
                            {step === 2 && "Where are you located?"}
                            {step === 3 && "Verify your identity"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Step {step} of 3 • {step === 1 ? "Business Details" : step === 2 ? "Location" : "Documents"}
                        </p>
                    </div>

                    <ProgressBar
                        currentStep={step}
                        totalSteps={3}
                        steps={['Business', 'Location', 'Documents']}
                    />

                    <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 gap-6">
                                    <Input
                                        label="Legal Shop Name"
                                        placeholder="e.g. Omkar Electronics"
                                        value={formData.legalShopName}
                                        onChange={(e) => handleInputChange('legalShopName', e.target.value)}
                                        required
                                        icon={<Store size={18} />}
                                    />
                                    <Input
                                        label="Owner Name"
                                        placeholder="Full name as per PAN"
                                        value={formData.ownerName}
                                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Business Category"
                                        options={BUSINESS_CATEGORIES}
                                        value={formData.businessCategory}
                                        onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Business ID / GSTIN"
                                        placeholder="GSTIN or Shop Act No."
                                        value={formData.businessId}
                                        onChange={(e) => handleInputChange('businessId', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Mobile Number"
                                        placeholder="+91 00000 00000"
                                        value={formData.mobile}
                                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                                        required
                                        type="tel"
                                    />
                                    {/* Email Removed as it is handled by Auth */}
                                </div>
                                <Input
                                    label="Shop Address"
                                    placeholder="Building, Street, Area"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    required
                                    icon={<MapPin size={18} />}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="City"
                                        placeholder="Mumbai"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Pincode"
                                        placeholder="400001"
                                        maxLength={6}
                                        value={formData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                                    <FileText size={20} className="text-orange-600 shrink-0" />
                                    <p className="text-sm text-orange-800">
                                        Upload clear images of your documents. This helps us verify your business faster (usually within 24 hours).
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <FileUpload
                                        label="Owner ID Proof"
                                        placeholder="Upload Aadhaar or PAN Card"
                                        onFilesSelect={(files) => handleFileUpload('idProof', files[0])}
                                        isLoading={uploading.idProof}
                                        uploadedFileName={typeof formData.idProof === 'string' ? formData.idProof.split('/').pop() : formData.idProof?.name}
                                    />
                                    <FileUpload
                                        label="Business License"
                                        placeholder="Shop Act or GST Certificate"
                                        onFilesSelect={(files) => handleFileUpload('license', files[0])}
                                        isLoading={uploading.license}
                                        uploadedFileName={typeof formData.license === 'string' ? formData.license.split('/').pop() : formData.license?.name}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="!w-auto text-gray-500 hover:text-gray-900"
                                >
                                    <ArrowLeft size={18} className="mr-2" /> Back
                                </Button>
                            ) : <div></div>}

                            <div className="flex gap-4">
                                {step < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!isStepValid()}
                                        className="!w-auto px-8 bg-black hover:bg-zinc-800 text-white"
                                    >
                                        Next Step <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        disabled={!isStepValid()}
                                        className="!w-auto px-8 bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        Complete Setup <Save size={18} className="ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

