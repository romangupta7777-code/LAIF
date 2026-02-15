"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getDashboardData, saveMoodEntry } from "./actions"
import { askLAifQuestion } from "../suggestions/actions"
import { track, EVENTS } from "@/lib/analytics"
import { PageTransition, AnimatedCard, FadeInView, AnimatedProgress, LoadingSpinner, AnimatedCounter, AnimatedModal } from "@/components/motion"
import { motion } from "framer-motion"

const AI_TIPS = [
    "You're doing well. A short walk today could boost your mood.",
    "Try drinking an extra glass of water today — hydration helps focus.",
    "A 10-minute stretch session can reduce stress and improve flexibility.",
    "Consider journaling for 5 minutes tonight to reflect on your day.",
    "Try a breathing exercise: 4 seconds in, 7 hold, 8 out. Repeat 3x.",
    "Your consistency is paying off! Keep the momentum going.",
    "Small wins matter. Celebrate completing even one habit today.",
    "Fresh air and sunlight do wonders. Step outside for 5 minutes.",
]

const MOOD_LEVELS = [
    { value: 1, emoji: "😞", label: "Rough" },
    { value: 2, emoji: "😔", label: "Low" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
]

interface DashboardState {
    user: { name: string | null | undefined; email: string | null | undefined; image: string | null | undefined }
    stats: { activeGoals: number; completedGoals: number; totalHabits: number; habitsToday: number; topStreak: number }
    goals: Array<{ id: string; title: string; category: string; target: number | null; current: number; status: string }>
    habits: Array<{ id: string; name: string; streak: number; lastDone: string | null }>
    latestMood: { mood: number; energy: number | null; stress: number | null; createdAt: string } | null
    profile: { activityLevel: string | null; sleepGoal: number | null } | null
}

function BottomNav() {
    const pathname = usePathname()
    const navItems = [
        { href: "/dashboard", icon: "🏠", label: "Home" },
        { href: "/schedule", icon: "📋", label: "Routine" },
        { href: "/wellness", icon: "❤️", label: "Wellness" },
        { href: "/automations", icon: "⚡", label: "Automate" },
        { href: "/suggestions", icon: "🤖", label: "AI Coach" },
        { href: "/profile", icon: "👤", label: "Profile" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50">
            <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive
                                ? "text-blue-600"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className={`text-[10px] font-semibold ${isActive ? "text-blue-600" : ""}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

export default function DashboardPage() {
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<DashboardState | null>(null)
    const [loading, setLoading] = useState(true)
    const [showMoodPicker, setShowMoodPicker] = useState(false)
    const [selectedMood, setSelectedMood] = useState(0)
    const [energy, setEnergy] = useState(7)
    const [stress, setStress] = useState(3)
    const router = useRouter()
    const [tip] = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)])
    const [askInput, setAskInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]
    )
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const result = await getDashboardData()
        if (!result.error) {
            setData(result as unknown as DashboardState)
        }
        setLoading(false)
    }

    const handleSaveMood = () => {
        if (selectedMood === 0) return
        startTransition(async () => {
            await saveMoodEntry({ mood: selectedMood, energy, stress })
            setShowMoodPicker(false)
            loadData()
        })
    }

    const getMoodLabel = (mood: number) => {
        if (mood >= 5) return "Great"
        if (mood >= 4) return "Good"
        if (mood >= 3) return "Okay"
        if (mood >= 2) return "Low"
        return "Rough"
    }

    const getStressLabel = (s: number | null | undefined) => {
        if (!s) return "Unknown"
        if (s <= 2) return "Low"
        if (s <= 4) return "Moderate"
        if (s <= 6) return "Medium"
        if (s <= 8) return "High"
        return "Very High"
    }

    if (loading) {
        return <LoadingSpinner text="Loading your dashboard..." />
    }

    const userName = data?.user?.name?.split(" ")[0] || "there"
    const moodData = data?.latestMood
    const stats = data?.stats

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 pb-24">
                {/* Header */}
                <div className="text-center pt-10 pb-2 px-4">
                    <div className="mb-1">
                        <span className="text-3xl font-light tracking-wide text-gray-800">L</span>
                        <span className="text-3xl font-light tracking-wide text-gray-800">A</span>
                        <span className="text-3xl font-light tracking-wide text-blue-500">i</span>
                        <span className="text-3xl font-light tracking-wide text-gray-800">f</span>
                    </div>
                    <h1 className="text-sm font-bold tracking-[0.3em] text-gray-900 uppercase">
                        AI Lifestyle Hub
                    </h1>
                </div>

                {/* Mood Orb Section */}
                <div className="relative flex items-center justify-center mx-auto mt-6 mb-4" style={{ height: "320px", maxWidth: "400px" }}>
                    {/* Outer glow ring */}
                    <div className="absolute w-56 h-56 rounded-full border-2 border-blue-200/60 animate-pulse" />

                    {/* Inner orb */}
                    <button
                        onClick={() => setShowMoodPicker(true)}
                        className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-100 via-blue-200/80 to-sky-100 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.25)] hover:shadow-[0_0_80px_rgba(59,130,246,0.35)] transition-all duration-500 cursor-pointer group"
                    >
                        <div className="text-center">
                            <p className="text-xl font-semibold text-blue-900/80 leading-snug group-hover:scale-105 transition-transform">
                                How are you<br />feeling today?
                            </p>
                        </div>
                    </button>

                    {/* Floating Badges */}
                    {/* Energy Badge - top left */}
                    <div className="absolute top-8 left-2 sm:left-4 bg-white/90 backdrop-blur-sm rounded-full px-3.5 py-1.5 shadow-lg border border-blue-100 text-sm font-medium text-gray-700 animate-float-slow">
                        ⚡ Energy: {moodData?.energy ?? "—"}/10
                    </div>

                    {/* Focus Badge - top right */}
                    <div className="absolute top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm rounded-full px-3.5 py-1.5 shadow-lg border border-blue-100 text-sm font-medium text-gray-700 animate-float-delay">
                        🧠 Focus: {moodData ? getMoodLabel(moodData.mood) : "—"}
                    </div>

                    {/* Stress Badge - bottom left */}
                    <div className="absolute bottom-12 left-4 sm:left-8 bg-white/90 backdrop-blur-sm rounded-full px-3.5 py-1.5 shadow-lg border border-green-100 text-sm font-medium text-green-700 animate-float-slow2">
                        🌿 Stress: {moodData ? getStressLabel(moodData.stress) : "—"}
                    </div>

                    {/* Streak Badge - bottom right */}
                    <div className="absolute bottom-8 right-4 sm:right-8 bg-white/90 backdrop-blur-sm rounded-full px-3.5 py-1.5 shadow-lg border border-orange-100 text-sm font-medium text-orange-600 animate-float-delay2">
                        🔥 Streak: {stats?.topStreak ?? 0}
                    </div>
                </div>

                {/* Mood Picker Modal */}
                {showMoodPicker && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-1">How are you feeling?</h3>
                            <p className="text-sm text-gray-500 text-center mb-6">Tap to log your current mood</p>

                            {/* Mood Emojis */}
                            <div className="flex justify-center gap-3 mb-6">
                                {MOOD_LEVELS.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setSelectedMood(m.value)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${selectedMood === m.value
                                            ? "bg-blue-50 border-2 border-blue-400 scale-110"
                                            : "border-2 border-transparent hover:bg-gray-50"
                                            }`}
                                    >
                                        <span className="text-3xl">{m.emoji}</span>
                                        <span className="text-xs font-medium text-gray-600">{m.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Energy slider */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 font-medium">⚡ Energy</span>
                                    <span className="text-blue-600 font-bold">{energy}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={energy}
                                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            {/* Stress slider */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 font-medium">🌿 Stress</span>
                                    <span className="text-blue-600 font-bold">{stress}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={stress}
                                    onChange={(e) => setStress(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMoodPicker(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMood}
                                    disabled={selectedMood === 0 || isPending}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Suggestion Card */}
                <FadeInView className="max-w-md mx-auto px-5 mb-6">
                    <AnimatedCard className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100">
                        <div className="flex items-start gap-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                            >
                                AI
                            </motion.div>
                            <div>
                                <p className="text-gray-800 text-[15px] leading-relaxed">{tip}</p>
                                <p className="text-xs text-gray-400 mt-2">LAif AI • Just now</p>
                            </div>
                        </div>
                    </AnimatedCard>
                </FadeInView>

                {/* Quick Stats Row */}
                <div className="max-w-md mx-auto px-5 mb-6">
                    <div className="grid grid-cols-3 gap-3">
                        <AnimatedCard delay={0} className="">
                            <Link href="/goals" className="block bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                                <p className="text-2xl font-bold text-blue-600"><AnimatedCounter value={stats?.activeGoals ?? 0} /></p>
                                <p className="text-xs text-gray-500 mt-1">Active Goals</p>
                            </Link>
                        </AnimatedCard>
                        <AnimatedCard delay={0.1} className="">
                            <Link href="/schedule" className="block bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                                <p className="text-2xl font-bold text-green-600">{stats?.habitsToday ?? 0}/{stats?.totalHabits ?? 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Today&apos;s Habits</p>
                            </Link>
                        </AnimatedCard>
                        <AnimatedCard delay={0.2} className="">
                            <Link href="/goals" className="block bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                                <p className="text-2xl font-bold text-purple-600"><AnimatedCounter value={stats?.completedGoals ?? 0} /></p>
                                <p className="text-xs text-gray-500 mt-1">Completed</p>
                            </Link>
                        </AnimatedCard>
                    </div>
                </div>

                {/* Active Goals Preview */}
                {data?.goals && data.goals.length > 0 && (
                    <div className="max-w-md mx-auto px-5 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900">Active Goals</h3>
                            <Link href="/goals" className="text-xs text-blue-600 font-medium">See All →</Link>
                        </div>
                        <div className="space-y-2.5">
                            {data.goals.map((goal, i) => {
                                const progress = goal.target ? Math.min((goal.current / goal.target) * 100, 100) : 0
                                return (
                                    <AnimatedCard key={goal.id} delay={i * 0.08} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-800">{goal.title}</p>
                                            {goal.target && (
                                                <span className="text-xs text-blue-600 font-bold">{progress.toFixed(0)}%</span>
                                            )}
                                        </div>
                                        {goal.target && (
                                            <AnimatedProgress value={goal.current} max={goal.target} height="h-1.5" delay={0.2 + i * 0.08} />
                                        )}
                                    </AnimatedCard>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="max-w-md mx-auto px-5 mb-4">
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                const res = await fetch("/api/webhooks/daily-summary", { method: "POST" })
                                const data = await res.json()
                                if (data.webhookSent) {
                                    alert("✅ Daily report sent to your email via Zapier!")
                                } else {
                                    alert("📧 Summary ready! Configure Zapier webhook URL in .env.local to send via email.")
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                        >
                            📧 Send Daily Report
                        </button>
                        <Link
                            href="/automations"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/80 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all"
                        >
                            ⚡ Automations
                        </Link>
                    </div>
                </div>

                {/* Ask LAif Inline Chat */}
                <div className="max-w-md mx-auto px-5 mb-6">
                    {/* Chat Messages */}
                    {chatMessages.length > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 max-h-60 overflow-y-auto space-y-3">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-md"
                                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {aiLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            value={askInput}
                            onChange={(e) => setAskInput(e.target.value)}
                            placeholder="Ask LAif anything..."
                            className="w-full px-5 py-3.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition pr-12"
                            disabled={aiLoading}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && askInput.trim() && !aiLoading) {
                                    e.preventDefault()
                                    const q = askInput.trim()
                                    setAskInput("")
                                    setChatMessages((prev) => [...prev, { role: "user", text: q }])
                                    setAiLoading(true)
                                    askLAifQuestion(q).then((res) => {
                                        setAiLoading(false)
                                        if (res.answer) {
                                            setChatMessages((prev) => [...prev, { role: "ai", text: res.answer! }])
                                        } else {
                                            setChatMessages((prev) => [...prev, { role: "ai", text: res.error || "Something went wrong." }])
                                        }
                                    })
                                }
                            }}
                        />
                        <button
                            disabled={aiLoading || !askInput.trim()}
                            onClick={() => {
                                if (!askInput.trim() || aiLoading) return
                                const q = askInput.trim()
                                setAskInput("")
                                setChatMessages((prev) => [...prev, { role: "user", text: q }])
                                setAiLoading(true)
                                askLAifQuestion(q).then((res) => {
                                    setAiLoading(false)
                                    if (res.answer) {
                                        setChatMessages((prev) => [...prev, { role: "ai", text: res.answer! }])
                                    } else {
                                        setChatMessages((prev) => [...prev, { role: "ai", text: res.error || "Something went wrong." }])
                                    }
                                })
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <BottomNav />
            </div>
        </PageTransition>
    )
}
