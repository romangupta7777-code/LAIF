"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

// ============ PAGE TRANSITION ============
export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

// ============ ANIMATED CARD ============
export function AnimatedCard({
    children,
    className = "",
    delay = 0,
    hover = true,
}: {
    children: ReactNode
    className?: string
    delay?: number
    hover?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={hover ? { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" } : undefined}
            whileTap={hover ? { scale: 0.98 } : undefined}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ============ STAGGERED LIST ============
export function StaggerContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ============ ANIMATED BUTTON ============
export function AnimatedButton({
    children,
    onClick,
    disabled = false,
    className = "",
    variant = "primary",
}: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
    variant?: "primary" | "secondary" | "ghost"
}) {
    const baseClass = variant === "primary"
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
        : variant === "secondary"
            ? "bg-white border border-gray-200 text-gray-700"
            : "bg-transparent text-gray-600"

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
            whileTap={{ scale: disabled ? 1 : 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${baseClass} ${className}`}
        >
            {children}
        </motion.button>
    )
}

// ============ ANIMATED PROGRESS BAR ============
export function AnimatedProgress({
    value,
    max = 100,
    color = "from-blue-500 to-indigo-500",
    height = "h-2",
    showPercent = false,
    delay = 0,
}: {
    value: number
    max?: number
    color?: string
    height?: string
    showPercent?: boolean
    delay?: number
}) {
    const percent = Math.min((value / max) * 100, 100)

    return (
        <div className="w-full">
            {showPercent && (
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{Math.round(percent)}%</span>
                    <span>{value}/{max}</span>
                </div>
            )}
            <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`h-full bg-gradient-to-r ${color} rounded-full`}
                />
            </div>
        </div>
    )
}

// ============ COUNTER ANIMATION ============
export function AnimatedCounter({
    value,
    className = "",
}: {
    value: number
    className?: string
}) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={className}
        >
            {value}
        </motion.span>
    )
}

// ============ LOADING SPINNER ============
export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-gray-400 text-sm"
                >
                    {text}
                </motion.p>
            </motion.div>
        </div>
    )
}

// ============ PULSE DOT ============
export function PulseDot({ color = "bg-green-400" }: { color?: string }) {
    return (
        <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-2 h-2 rounded-full ${color}`}
        />
    )
}

// ============ SWIPEABLE CARD (GESTURE) ============
export function SwipeableCard({
    children,
    className = "",
    onSwipeLeft,
    onSwipeRight,
}: {
    children: ReactNode
    className?: string
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
}) {
    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_e, info) => {
                if (info.offset.x < -80 && onSwipeLeft) onSwipeLeft()
                if (info.offset.x > 80 && onSwipeRight) onSwipeRight()
            }}
            whileDrag={{ scale: 0.97, rotate: 0 }}
            className={`cursor-grab active:cursor-grabbing ${className}`}
        >
            {children}
        </motion.div>
    )
}

// ============ FADE IN ON SCROLL ============
export function FadeInView({
    children,
    className = "",
    delay = 0,
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ============ MODAL OVERLAY (ANIMATE PRESENCE) ============
export function AnimatedModal({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-[20%] z-50 max-w-md mx-auto"
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
