import React from 'react';
import { Construction, Sparkles, Clock } from 'lucide-react';
import styles from './Maintenance.module.css';
import shivswarajyaLogo from '/images/logofinal.png';

export const Maintenance: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={styles.contentWrapper}>
                <div className={styles.brandHeader}>
                    <div className={styles.logoContainer}>
                        <img src={shivswarajyaLogo} alt="Shivswarajya Logo" className={styles.logoImage} />
                    </div>
                    <h1 className={styles.title}>
                        SHIVSWARAJYA <br />
                        <span className={styles.highlight}>VENDOR PANEL</span>
                    </h1>
                </div>

                <div className={styles.statusCard}>
                    <div className={styles.statusIcon}>
                        <Construction size={36} color="white" />
                    </div>
                    
                    <div className={styles.badge}>
                        <span className={styles.dot}></span>
                        SITE UNDER MAINTENANCE
                    </div>

                    <h2 className={styles.message}>
                        Website is currently under development
                    </h2>

                    <p className={styles.description}>
                        We are upgrading the vendor experience to provide you with better tools and faster service. 
                        Our systems will be back shortly with more powerful features.
                    </p>

                    <div className="flex gap-8 mt-4 text-sm font-medium opacity-80">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} /> Improved UI
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} /> Back Soon
                        </div>
                    </div>
                </div>

                <p className="mt-12 text-gray-400 text-sm font-medium tracking-widest uppercase">
                    Shivswarajya Digital Marketplace &copy; 2026
                </p>
            </div>
        </div>
    );
};
