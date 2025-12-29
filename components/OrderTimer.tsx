import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderTimerProps {
    startTime: Date | string;
}

const OrderTimer: React.FC<OrderTimerProps> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        // Helper to calculate minutes
        const calculateElapsed = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            return Math.floor((now - start) / 60000); // Minutes
        };

        // Initial set
        setElapsed(calculateElapsed());

        // Update every minute (or 30s for responsiveness)
        const interval = setInterval(() => {
            setElapsed(calculateElapsed());
        }, 30000);

        return () => clearInterval(interval);
    }, [startTime]);


    // ... inside OrderTimer ...

    // Determine Styling
    let badgeStyle = "bg-green-100 text-green-800 border-green-200";
    let isCritical = false;

    if (elapsed >= 10 && elapsed < 20) {
        badgeStyle = "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (elapsed >= 20) {
        badgeStyle = "bg-red-100 text-red-800 border-red-200 font-bold";
        isCritical = true;
    }

    return (
        <motion.div
            animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
            transition={isCritical ? { repeat: Infinity, duration: 2 } : {}}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${badgeStyle} transition-colors duration-500`}
        >
            <Timer size={16} />
            <span className="font-mono font-medium whitespace-nowrap">
                {elapsed} min
            </span>
        </motion.div>
    );
};

export default OrderTimer;
