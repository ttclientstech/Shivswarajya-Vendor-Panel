import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Shield, Zap, Globe, Chrome } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import styles from './Login.module.css';
import shivswarajyaLogo from '/images/logofinal.png';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setError('');
        setIsLoading(true);

        try {
            await authService.sendOtp(email);
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace focus previous
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const otpCode = otp.join('');

        try {
            const response = await authService.verifyOtp(email, otpCode);

            // Login via Context with token and user data
            login(response.token, response.user);

            // Navigate based on profile completion status
            if (response.user.isProfileComplete) {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/onboarding', { replace: true });
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        console.log("Google Login Clicked");
    };

    return (
        <div className={styles.page}>
            {/* Left Side - Form */}
            <section className={styles.formSection}>
                <div className={styles.contentWrapper}>
                    <div className={styles.brandHeader}>
                        <div className={styles.logoContainer}>
                            <img src={shivswarajyaLogo} alt="Shivswarajya Logo" className={styles.logoImage} />
                        </div>
                        <h1 className={styles.title}>
                            SHIVSWARAJYA <br />
                            <span className={styles.highlight}>VENDOR</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Manage your shop and products on Maharashtra's fastest growing digital marketplace.
                        </p>
                    </div>

                    <div className={styles.formCard}>
                        {step === 'email' ? (
                            <>
                                {/* <Button
                                    variant="outline"
                                    fullWidth
                                    icon={<Chrome size={20} />}
                                    onClick={handleGoogleLogin}
                                >
                                    Login with Google
                                </Button> */}

                                <div className={styles.divider}>
                                    <span className={styles.line}></span>
                                    <span>VENDOR ACCESS</span>
                                    <span className={styles.line}></span>
                                </div>

                                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6 w-full">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        icon={<Mail size={20} />}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                   
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        isLoading={isLoading}
                                        icon={<ArrowRight size={20} />}
                                    >
                                        Generate Access Code
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="flex flex-col w-full">
                                <div className={`${styles.divider} ${styles.identityDivider}`}>
                                    <div className={styles.line}></div>
                                    <span>VERIFY IDENTITY</span>
                                    <div className={styles.line}></div>
                                </div>



                                <div className={styles.otpInputContainer}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            maxLength={1}
                                            className={styles.otpDigit}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        />
                                    ))}
                                </div>

                                {error && <p className="text-red-500 text-sm text-center mb-6">{error}</p>}

                                <div className="flex flex-col gap-4">
                                    <Button
                                        type="submit"
                                        fullWidth
                                        isLoading={isLoading}
                                    >
                                        Authorize & Launch
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        fullWidth
                                        onClick={() => {
                                            setStep('email');
                                            setError('');
                                            setOtp(['', '', '', '', '', '']);
                                        }}
                                    >
                                        CANCEL & GO BACK
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Right Side - Visuals */}
            <section className={styles.visualSection}>
                {/* <div className={styles.systemStatus}>
                    <span className={styles.statusDot}></span>
                    SYSTEMS NOMINAL
                </div> */}

                <div className={styles.visualContent}>
                    <h2 className={styles.visualTitle}>
                        Empowering the <br />
                        <span className={styles.highlight}>Spirit of Swarajya</span> <br />
                        in Every Seller.
                    </h2>

                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Shield size={24} />
                            </div>
                            <div className={styles.featureText}>
                                <h3>Secure Trading</h3>
                                <p>End-to-end encrypted transactions ensuring total data sovereignty for your business.</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Zap size={24} />
                            </div>
                            <div className={styles.featureText}>
                                <h3>Direct Settlement</h3>
                                <p>Instant payouts and real-time order synchronization with 99.9% uptime.</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Globe size={24} />
                            </div>
                            <div className={styles.featureText}>
                                <h3>Wider Reach</h3>
                                <p>Access thousands of customers across Maharashtra and grow your local brand.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
