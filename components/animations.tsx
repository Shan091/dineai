import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- VARIANTS ---
export const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const slideUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

// --- COMPONENTS ---

// 1. Simple Fade In Wrapper
export const FadeIn = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeInVariants}
        className={className}
    >
        {children}
    </motion.div>
);

// 2. Slide Up Item (Good for Lists)
export const SlideUp = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideUpVariants}
        transition={{ delay }}
        className={className}
    >
        {children}
    </motion.div>
);

// 3. Scale Button (Tactile Feedback)
export const ScaleButton = ({ children, onClick, className, disabled }: { children: React.ReactNode; onClick?: (e: any) => void; className?: string; disabled?: boolean }) => (
    <motion.button
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onClick={onClick}
        className={className}
        disabled={disabled}
    >
        {children}
    </motion.button>
);

// 4. Staggered List Wrapper
export const StaggerList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className={className}
    >
        {children}
    </motion.div>
);
