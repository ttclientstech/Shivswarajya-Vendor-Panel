import React from 'react';
import { Monitor, AlertCircle } from 'lucide-react';
import styles from './MobileDisclaimer.module.css';
import shivswarajyaLogo from '/images/logofinal.png';

export const MobileDisclaimer: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.logoWrapper}>
                    <img src={shivswarajyaLogo} alt="Shivswarajya Logo" className={styles.logo} />
                </div>

                <h1 className={styles.title}>SHIVSWARAJYA</h1>
                <p className={styles.subTitle}>VENDOR PANEL</p>

                <div className={styles.disclaimerCard}>
                    <div className={styles.iconWrapper}>
                        <Monitor size={32} />
                    </div>

                    <h2 className={styles.message}>
                        This vendor dashboard is optimized strictly for desktop and laptop experience.
                    </h2>

                    <p className={styles.message}>
                        To ensure efficient management of your shop and products,
                        please access this link from a Desktop or Laptop device.
                        Mobiles and Tablets are not supported for this dashboard.
                    </p>

                    <div className={styles.actionHint}>
                        <AlertCircle size={16} />
                        <span>Responsive vendor dashboard coming soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
