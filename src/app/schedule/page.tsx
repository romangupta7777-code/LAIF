"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { getHabits, createHabit, markHabitDone, deleteHabit } from "./actions"

const FREQUENCIES = [
    { value: "daily", label: "Daily", icon: "☀️" },
    { value: "weekdays", label: "Weekdays", icon: "💼" },
    { value: "weekends", label: "Weekends", icon: "🌴" },
    { value: "weekly", label: "Weekly", icon: "📅" },
    { value: "3x_week", label: "3x / Week", icon: "🔄" },
]

interface Habit {
    id: string
    name: string
    frequency: string
    streak: number
    bestStreak: number
    lastDone: string | null
    createdAt: string
}

export default function SchedulePage() {
    const [isPending, startTransition] = useTransition()
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState("")

    const [name, setName] = useState("")
    const [frequency, setFrequency] = useState("")

    useEffect(() => {
        loadHabits()
    }, [])

    const loadHabits = async () => {
        const result = await getHabits()
        if (result.habits) {
            setHabits(result.habits as unknown as Habit[])
        }
        setLoading(false)
    }

    const handleCreate = () => {
        if (!name || !frequency) {
            setError("Name and frequency are required.")
            return
        }
        setError("")
        startTransition(async () => {
            const result = await createHabit({ name, frequency })
            if (result.error) {
                setError(result.error)
            } else {
                setName("")
                setFrequency("")
                setShowForm(false)
                loadHabits()
            }
        })
    }

    const handleMarkDone = (habitId: string) => {
        startTransition(async () => {
            await markHabitDone(habitId)
            loadHabits()
        })
    }

    const handleDelete = (habitId: string) => {
        startTransition(async () => {
            await deleteHabit(habitId)
            loadHabits()
        })
    }

    const isDoneToday = (lastDone: string | null) => {
        if (!lastDone) return false
        const last = new Date(lastDone)
        const today = new Date()
        return last.toDateString() === today.toDateString()
    }

    const getFreqLabel = (freq: string) => FREQUENCIES.find((f) => f.value === freq)?.label || freq
    const getFreqIcon = (freq: string) => FREQUENCIES.find((f) => f.value === freq)?.icon || "📋"

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Nav */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                            <span className="text-blue-600">LAif</span>
                        </Link>
                        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📋 My Routine</h1>
                        <p className="text-gray-500 mt-1">Build healthy habits and track your streaks</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        {showForm ? "Cancel" : "+ New Habit"}
                    </button>
                </div>

                {/* Create Habit Form */}
                {showForm && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-8 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add a Habit to Your Routine</h3>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Morning jog, Drink 2L water, Meditate"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                                <div className="flex flex-wrap gap-2">
                                    {FREQUENCIES.map((f) => (
                                        <button
                                            key={f.value}
                                            type="button"
                                            onClick={() => setFrequency(f.value)}
                                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${frequency === f.value
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            {f.icon} {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleCreate}
                                disabled={isPending}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                            >
                                {isPending ? "Adding..." : "Add Habit"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Habits List */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-500">Loading routine...</p>
                    </div>
                ) : habits.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Habits Yet</h3>
                        <p className="text-gray-500 mb-6">Build your routine by adding daily habits to track.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Add Your First Habit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Today's Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900">Today&apos;s Progress</h3>
                                    <p className="text-sm text-blue-700">
                                        {habits.filter((h) => isDoneToday(h.lastDone)).length} of {habits.length} habits completed
                                    </p>
                                </div>
                                <div className="text-4xl font-bold text-blue-600">
                                    {habits.length > 0
                                        ? Math.round((habits.filter((h) => isDoneToday(h.lastDone)).length / habits.length) * 100)
                                        : 0}%
                                </div>
                            </div>
                            <div className="mt-3 w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${habits.length > 0 ? (habits.filter((h) => isDoneToday(h.lastDone)).length / habits.length) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Habit Cards */}
                        {habits.map((habit) => {
                            const done = isDoneToday(habit.lastDone)
                            return (
                                <div
                                    key={habit.id}
                                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border p-5 transition-all ${done ? "border-green-200 bg-green-50/50" : "border-white/50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => !done && handleMarkDone(habit.id)}
                                                disabled={done || isPending}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${done
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600"
                                                    } disabled:cursor-default`}
                                            >
                                                {done ? "✓" : getFreqIcon(habit.frequency)}
                                            </button>
                                            <div>
                                                <h3 className={`font-bold ${done ? "text-green-700 line-through" : "text-gray-900"}`}>
                                                    {habit.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {getFreqLabel(habit.frequency)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-orange-500">
                                                    <span className="text-lg">🔥</span>
                                                    <span className="font-bold text-lg">{habit.streak}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    Best: {habit.bestStreak}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(habit.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors text-sm p-1"
                                                title="Delete"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
