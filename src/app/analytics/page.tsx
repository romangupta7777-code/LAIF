"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAnalyticsData } from "./actions"
import { getLocalEvents } from "@/lib/analytics"

const MOOD_LABELS = ["", "😞 Rough", "😔 Low", "😐 Okay", "🙂 Good", "😄 Great"]

interface AnalyticsState {
    overview: {
        totalGoals: number; completedGoals: number; totalHabits: number;
        totalMoodEntries: number; totalSuggestions: number; totalActivities: number;
        healthLogsDays: number;
    }
    averages: {
        mood: number; energy: number; stress: number;
        steps: number; sleep: string; water: number;
    }
    moodTrend: Array<{ date: string; mood: number; energy: number | null; stress: number | null }>
    healthTrend: Array<{ date: string; steps: number | null; sleep: number | null; water: number | null; workout: number | null }>
    topHabits: Array<{ name: string; streak: number; bestStreak: number }>
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsState | null>(null)
    const [loading, setLoading] = useState(true)
    const [eventCount, setEventCount] = useState(0)
    const [recentEvents, setRecentEvents] = useState<Array<{ event: string; timestamp: string }>>([])

    useEffect(() => {
        loadData()
        loadLocalEvents()
    }, [])

    const loadData = async () => {
        const result = await getAnalyticsData()
        if (!result.error) {
            setData(result as unknown as AnalyticsState)
        }
        setLoading(false)
    }

    const loadLocalEvents = () => {
        const events = getLocalEvents()
        setEventCount(events.length)
        setRecentEvents(events.slice(-10).reverse())
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading analytics...</div>
            </div>
        )
    }

    if (!data) return null

    const goalCompletion = data.overview.totalGoals > 0
        ? Math.round((data.overview.completedGoals / data.overview.totalGoals) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 pb-24">
            {/* Header */}
            <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 flex justify-between items-center h-14">
                    <h1 className="text-xl font-bold text-gray-900">
                        <span className="text-blue-600">📊</span> Analytics
                    </h1>
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
                {/* Overview Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Goals", value: `${data.overview.completedGoals}/${data.overview.totalGoals}`, sub: `${goalCompletion}% done`, color: "from-blue-500 to-indigo-500" },
                        { label: "Habits", value: data.overview.totalHabits, sub: "Active", color: "from-purple-500 to-pink-500" },
                        { label: "Check-ins", value: data.overview.totalMoodEntries, sub: "Last 30d", color: "from-teal-500 to-green-500" },
                    ].map((card) => (
                        <div key={card.label} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                            <p className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
                            <p className="text-[10px] text-gray-400">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* 7-Day Averages */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">📈 7-Day Averages</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{data.averages.mood > 0 ? MOOD_LABELS[Math.round(data.averages.mood)] : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Mood</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-amber-600">⚡ {data.averages.energy > 0 ? data.averages.energy.toFixed(1) : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Energy</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-green-600">🌿 {data.averages.stress > 0 ? data.averages.stress.toFixed(1) : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Stress</p>
                        </div>
                    </div>
                    <hr className="my-3 border-gray-100" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-800">{data.averages.steps > 0 ? data.averages.steps.toLocaleString() : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Steps</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-indigo-600">{parseFloat(data.averages.sleep) > 0 ? `${data.averages.sleep}h` : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Sleep</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-cyan-600">{data.averages.water > 0 ? `${data.averages.water} 💧` : "—"}</p>
                            <p className="text-[10px] text-gray-400">Avg Water</p>
                        </div>
                    </div>
                </div>

                {/* Mood Trend (Simple bar chart) */}
                {data.moodTrend.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">😊 Mood Trend (30 Days)</h3>
                        <div className="flex items-end gap-1 h-24">
                            {data.moodTrend.slice(-30).map((entry, i) => {
                                const height = (entry.mood / 5) * 100
                                const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-emerald-400"]
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col items-center justify-end group relative"
                                    >
                                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition text-[9px] text-gray-500 whitespace-nowrap bg-white/90 px-1 rounded shadow">
                                            {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {MOOD_LABELS[entry.mood]}
                                        </div>
                                        <div
                                            className={`w-full rounded-t-sm ${colors[entry.mood]} transition-all hover:opacity-80`}
                                            style={{ height: `${height}%`, minHeight: "4px" }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                            <span>Older</span><span>Recent</span>
                        </div>
                    </div>
                )}

                {/* Health Trend */}
                {data.healthTrend.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">🏃 Health Trend (7 Days)</h3>
                        <div className="space-y-2">
                            {data.healthTrend.map((day, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="text-xs text-gray-500 w-16">
                                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                    </span>
                                    <div className="flex-1 flex gap-4">
                                        {day.steps !== null && <span className="text-xs">👟 {day.steps?.toLocaleString()}</span>}
                                        {day.sleep !== null && <span className="text-xs">😴 {day.sleep}h</span>}
                                        {day.water !== null && <span className="text-xs">💧 {day.water}</span>}
                                        {day.workout !== null && <span className="text-xs">💪 {day.workout}m</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Habits */}
                {data.topHabits.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">🔥 Top Habits</h3>
                        <div className="space-y-2">
                            {data.topHabits.map((habit, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{habit.name}</span>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-orange-600">🔥 {habit.streak} day streak</span>
                                        <span className="text-gray-400">Best: {habit.bestStreak}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Event Activity */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">📡 Event Tracking</h3>
                    <p className="text-xs text-gray-400 mb-3">{eventCount} events tracked locally</p>
                    {recentEvents.length > 0 ? (
                        <div className="space-y-1.5">
                            {recentEvents.map((evt, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 font-medium">{evt.event}</span>
                                    <span className="text-gray-400">{new Date(evt.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400">No events tracked yet. Navigate around the app to see events appear.</p>
                    )}
                </div>

                {/* Mixpanel Status */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">🔗 Mixpanel Integration</h3>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>Token: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {process.env.NEXT_PUBLIC_MIXPANEL_TOKEN && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN !== "your-mixpanel-token"
                                ? "✅ Configured"
                                : "⚠️ Not configured — events stored locally only"
                            }
                        </code></p>
                        <p className="text-gray-400">Add your Mixpanel token to <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable cloud analytics.</p>
                    </div>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
                    {[
                        { href: "/dashboard", icon: "🏠", label: "Home" },
                        { href: "/wellness", icon: "❤️", label: "Wellness" },
                        { href: "/analytics", icon: "📊", label: "Analytics", active: true },
                        { href: "/suggestions", icon: "🤖", label: "AI Coach" },
                        { href: "/profile", icon: "👤", label: "Profile" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${item.active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className={`text-[10px] font-semibold ${item.active ? "text-blue-600" : ""}`}>{item.label}</span>
                            {item.active && <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />}
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    )
}
