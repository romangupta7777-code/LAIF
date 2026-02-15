"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { saveHealthLog, getHealthLog, getHealthHistory, getMoodHistory } from "./actions"
import { saveMoodEntry } from "../dashboard/actions"

const WORKOUT_TYPES = ["Walking", "Running", "Cycling", "Yoga", "Gym", "Swimming", "Sports", "Other"]
const MOOD_EMOJIS = [
    { value: 1, emoji: "😞", label: "Rough" },
    { value: 2, emoji: "😔", label: "Low" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
]

interface HealthData {
    steps: string
    sleepHours: string
    waterGlasses: string
    workoutMins: string
    workoutType: string
    notes: string
}

interface MoodLog {
    id: string
    mood: number
    energy: number | null
    stress: number | null
    notes: string | null
    createdAt: string
}

export default function WellnessPage() {
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState<"log" | "mental" | "history">("log")
    const [saved, setSaved] = useState(false)
    const [moodSaved, setMoodSaved] = useState(false)
    const [healthData, setHealthData] = useState<HealthData>({
        steps: "", sleepHours: "", waterGlasses: "", workoutMins: "", workoutType: "", notes: "",
    })
    const [mood, setMood] = useState(0)
    const [energy, setEnergy] = useState(7)
    const [stress, setStress] = useState(3)
    const [mentalNotes, setMentalNotes] = useState("")
    const [moodHistory, setMoodHistory] = useState<MoodLog[]>([])
    const [healthHistory, setHealthHistory] = useState<Array<{
        date: string; steps: number | null; sleepHours: number | null;
        waterGlasses: number | null; workoutMins: number | null; workoutType: string | null
    }>>([])

    useEffect(() => {
        loadTodayData()
        loadHistory()
    }, [])

    const loadTodayData = async () => {
        const result = await getHealthLog()
        if (result.log) {
            setHealthData({
                steps: result.log.steps?.toString() || "",
                sleepHours: result.log.sleepHours?.toString() || "",
                waterGlasses: result.log.waterGlasses?.toString() || "",
                workoutMins: result.log.workoutMins?.toString() || "",
                workoutType: result.log.workoutType || "",
                notes: result.log.notes || "",
            })
        }
    }

    const loadHistory = async () => {
        const [healthRes, moodRes] = await Promise.all([getHealthHistory(7), getMoodHistory()])
        if (healthRes.logs) {
            setHealthHistory(healthRes.logs.map((l) => ({
                date: new Date(l.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
                steps: l.steps, sleepHours: l.sleepHours,
                waterGlasses: l.waterGlasses, workoutMins: l.workoutMins, workoutType: l.workoutType,
            })))
        }
        if (moodRes.moods) {
            setMoodHistory(moodRes.moods.map((m) => ({
                ...m,
                createdAt: new Date(m.createdAt).toLocaleString("en-US", {
                    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                }),
            })) as MoodLog[])
        }
    }

    const handleSaveHealth = () => {
        setSaved(false)
        startTransition(async () => {
            await saveHealthLog({
                steps: healthData.steps ? parseInt(healthData.steps) : undefined,
                sleepHours: healthData.sleepHours ? parseFloat(healthData.sleepHours) : undefined,
                waterGlasses: healthData.waterGlasses ? parseInt(healthData.waterGlasses) : undefined,
                workoutMins: healthData.workoutMins ? parseInt(healthData.workoutMins) : undefined,
                workoutType: healthData.workoutType || undefined,
                notes: healthData.notes || undefined,
            })
            setSaved(true)
            loadHistory()
            setTimeout(() => setSaved(false), 2000)
        })
    }

    const handleSaveMood = () => {
        if (mood === 0) return
        setMoodSaved(false)
        startTransition(async () => {
            await saveMoodEntry({ mood, energy, stress, notes: mentalNotes || undefined })
            setMoodSaved(true)
            setMood(0)
            setMentalNotes("")
            loadHistory()
            setTimeout(() => setMoodSaved(false), 2000)
        })
    }

    const tabs = [
        { id: "log" as const, label: "Daily Log", icon: "🏃" },
        { id: "mental" as const, label: "Mental Health", icon: "🧠" },
        { id: "history" as const, label: "History", icon: "📊" },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 pb-24">
            {/* Header */}
            <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 flex justify-between items-center h-14">
                    <h1 className="text-xl font-bold text-gray-900">
                        <span className="text-blue-600">Wellness</span> Tracker
                    </h1>
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
                </div>
            </nav>

            {/* Tabs */}
            <div className="max-w-2xl mx-auto px-4 pt-4">
                <div className="flex gap-2 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4">
                {/* ============ DAILY LOG TAB ============ */}
                {activeTab === "log" && (
                    <div className="space-y-4">
                        <div className="text-center mb-2">
                            <p className="text-sm text-gray-500">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </p>
                        </div>

                        {/* Quick Input Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Steps */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="text-2xl mb-1">👟</div>
                                <label className="text-xs text-gray-500 font-medium">Steps</label>
                                <input
                                    type="number"
                                    value={healthData.steps}
                                    onChange={(e) => setHealthData({ ...healthData, steps: e.target.value })}
                                    placeholder="0"
                                    className="w-full mt-1 text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300"
                                />
                            </div>

                            {/* Sleep */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="text-2xl mb-1">😴</div>
                                <label className="text-xs text-gray-500 font-medium">Sleep (hours)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={healthData.sleepHours}
                                    onChange={(e) => setHealthData({ ...healthData, sleepHours: e.target.value })}
                                    placeholder="0"
                                    className="w-full mt-1 text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300"
                                />
                            </div>

                            {/* Water */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="text-2xl mb-1">💧</div>
                                <label className="text-xs text-gray-500 font-medium">Water (glasses)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        onClick={() => setHealthData({ ...healthData, waterGlasses: Math.max(0, parseInt(healthData.waterGlasses || "0") - 1).toString() })}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition"
                                    >−</button>
                                    <span className="text-2xl font-bold text-gray-900 min-w-[2ch] text-center">{healthData.waterGlasses || "0"}</span>
                                    <button
                                        onClick={() => setHealthData({ ...healthData, waterGlasses: (parseInt(healthData.waterGlasses || "0") + 1).toString() })}
                                        className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 transition"
                                    >+</button>
                                </div>
                            </div>

                            {/* Workout */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="text-2xl mb-1">💪</div>
                                <label className="text-xs text-gray-500 font-medium">Workout (mins)</label>
                                <input
                                    type="number"
                                    value={healthData.workoutMins}
                                    onChange={(e) => setHealthData({ ...healthData, workoutMins: e.target.value })}
                                    placeholder="0"
                                    className="w-full mt-1 text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300"
                                />
                            </div>
                        </div>

                        {/* Workout Type */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Workout Type</label>
                            <div className="flex flex-wrap gap-2">
                                {WORKOUT_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setHealthData({ ...healthData, workoutType: type })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${healthData.workoutType === type
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Notes</label>
                            <textarea
                                value={healthData.notes}
                                onChange={(e) => setHealthData({ ...healthData, notes: e.target.value })}
                                placeholder="How did today go?"
                                rows={2}
                                className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none placeholder-gray-400"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveHealth}
                            disabled={isPending}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-md"
                        >
                            {isPending ? "Saving..." : saved ? "✅ Saved!" : "Save Today's Log"}
                        </button>
                    </div>
                )}

                {/* ============ MENTAL HEALTH TAB ============ */}
                {activeTab === "mental" && (
                    <div className="space-y-4">
                        <div className="text-center mb-2">
                            <h2 className="text-lg font-bold text-gray-900">Mental Health Check-in</h2>
                            <p className="text-sm text-gray-500">Take a moment to reflect on how you&apos;re feeling</p>
                        </div>

                        {/* Mood Selection */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-3">How are you feeling right now?</h3>
                            <div className="flex justify-center gap-3">
                                {MOOD_EMOJIS.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(m.value)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${mood === m.value
                                                ? "bg-blue-50 border-2 border-blue-400 scale-110"
                                                : "border-2 border-transparent hover:bg-gray-50"
                                            }`}
                                    >
                                        <span className="text-3xl">{m.emoji}</span>
                                        <span className="text-[10px] font-medium text-gray-500">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Energy Level */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-700">⚡ Energy Level</h3>
                                <span className="text-blue-600 font-bold text-sm">{energy}/10</span>
                            </div>
                            <input
                                type="range" min="1" max="10" value={energy}
                                onChange={(e) => setEnergy(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>Exhausted</span><span>Energized</span>
                            </div>
                        </div>

                        {/* Stress Level */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-700">🌿 Stress Level</h3>
                                <span className="text-blue-600 font-bold text-sm">{stress}/10</span>
                            </div>
                            <input
                                type="range" min="1" max="10" value={stress}
                                onChange={(e) => setStress(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>Relaxed</span><span>Very Stressed</span>
                            </div>
                        </div>

                        {/* Reflection */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">📝 Reflection</h3>
                            <textarea
                                value={mentalNotes}
                                onChange={(e) => setMentalNotes(e.target.value)}
                                placeholder="What's on your mind? How was your day?"
                                rows={3}
                                className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none placeholder-gray-400"
                            />
                        </div>

                        <button
                            onClick={handleSaveMood}
                            disabled={isPending || mood === 0}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-md"
                        >
                            {isPending ? "Saving..." : moodSaved ? "✅ Check-in Saved!" : "Save Check-in"}
                        </button>
                    </div>
                )}

                {/* ============ HISTORY TAB ============ */}
                {activeTab === "history" && (
                    <div className="space-y-5">
                        {/* Health History */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">📊 Health Log (Last 7 Days)</h3>
                            {healthHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {healthHistory.map((day, i) => (
                                        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
                                            <p className="text-xs text-gray-500 font-medium mb-2">{day.date}</p>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">{day.steps ?? "—"}</p>
                                                    <p className="text-[10px] text-gray-400">Steps</p>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">{day.sleepHours ?? "—"}<span className="text-xs text-gray-400">h</span></p>
                                                    <p className="text-[10px] text-gray-400">Sleep</p>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">{day.waterGlasses ?? "—"}</p>
                                                    <p className="text-[10px] text-gray-400">Water</p>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-gray-900">{day.workoutMins ?? "—"}<span className="text-xs text-gray-400">m</span></p>
                                                    <p className="text-[10px] text-gray-400">{day.workoutType || "Workout"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/80 rounded-xl p-6 text-center border border-gray-100">
                                    <p className="text-gray-400 text-sm">No health logs yet. Start tracking in the Daily Log tab!</p>
                                </div>
                            )}
                        </div>

                        {/* Mood History */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">🧠 Mood History</h3>
                            {moodHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {moodHistory.slice(0, 10).map((entry) => (
                                        <div key={entry.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                                            <span className="text-2xl">
                                                {MOOD_EMOJIS.find((m) => m.value === entry.mood)?.emoji || "😐"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {MOOD_EMOJIS.find((m) => m.value === entry.mood)?.label || "Unknown"}
                                                    {entry.energy && <span className="text-gray-400 mx-1">·</span>}
                                                    {entry.energy && <span className="text-xs text-gray-500">⚡{entry.energy}/10</span>}
                                                    {entry.stress && <span className="text-gray-400 mx-1">·</span>}
                                                    {entry.stress && <span className="text-xs text-gray-500">🌿{entry.stress}/10</span>}
                                                </p>
                                                {entry.notes && <p className="text-xs text-gray-400 truncate">{entry.notes}</p>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 whitespace-nowrap">{entry.createdAt}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/80 rounded-xl p-6 text-center border border-gray-100">
                                    <p className="text-gray-400 text-sm">No mood entries yet. Check in on the Mental Health tab!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
                    {[
                        { href: "/dashboard", icon: "🏠", label: "Home" },
                        { href: "/schedule", icon: "📋", label: "Routine" },
                        { href: "/wellness", icon: "❤️", label: "Wellness", active: true },
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
