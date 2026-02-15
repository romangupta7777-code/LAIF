"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { getGoals, createGoal, updateGoalProgress, deleteGoal } from "./actions"
import { PageTransition, AnimatedCard, AnimatedProgress, LoadingSpinner, FadeInView } from "@/components/motion"
import { motion, AnimatePresence } from "framer-motion"
const CATEGORIES = [
    { value: "fitness", label: "Fitness", icon: "🏋️" },
    { value: "nutrition", label: "Nutrition", icon: "🥗" },
    { value: "mental", label: "Mental Health", icon: "🧠" },
    { value: "sleep", label: "Sleep", icon: "😴" },
    { value: "finance", label: "Finance", icon: "💰" },
    { value: "learning", label: "Learning", icon: "📚" },
    { value: "social", label: "Social", icon: "👥" },
    { value: "other", label: "Other", icon: "✨" },
]

interface Goal {
    id: string
    title: string
    description: string | null
    category: string
    target: number | null
    current: number
    unit: string | null
    deadline: string | null
    status: string
    createdAt: string
}

export default function GoalsPage() {
    const [isPending, startTransition] = useTransition()
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        target: "",
        unit: "",
        deadline: "",
    })

    useEffect(() => {
        loadGoals()
    }, [])

    const loadGoals = async () => {
        const result = await getGoals()
        if (result.goals) {
            setGoals(result.goals as unknown as Goal[])
        }
        setLoading(false)
    }

    const handleCreate = () => {
        if (!formData.title || !formData.category) {
            setError("Title and category are required.")
            return
        }
        setError("")
        startTransition(async () => {
            const result = await createGoal({
                title: formData.title,
                description: formData.description || undefined,
                category: formData.category,
                target: formData.target ? parseFloat(formData.target) : undefined,
                unit: formData.unit || undefined,
                deadline: formData.deadline || undefined,
            })
            if (result.error) {
                setError(result.error)
            } else {
                setFormData({ title: "", description: "", category: "", target: "", unit: "", deadline: "" })
                setShowForm(false)
                loadGoals()
            }
        })
    }

    const handleUpdateProgress = (goalId: string, current: number) => {
        startTransition(async () => {
            await updateGoalProgress(goalId, current)
            loadGoals()
        })
    }

    const handleDelete = (goalId: string) => {
        startTransition(async () => {
            await deleteGoal(goalId)
            loadGoals()
        })
    }

    const getCategoryInfo = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[7]

    const activeGoals = goals.filter((g) => g.status === "active")
    const completedGoals = goals.filter((g) => g.status === "completed")

    return (
        <PageTransition>
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
                            <h1 className="text-3xl font-bold text-gray-900">🎯 My Goals</h1>
                            <p className="text-gray-500 mt-1">Set targets and track your progress</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowForm(!showForm)}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            {showForm ? "Cancel" : "+ New Goal"}
                        </motion.button>
                    </div>

                    {/* Create Goal Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-8 overflow-hidden">

                                <h3 className="text-lg font-bold text-gray-900 mb-4">Create a New Goal</h3>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Run a 5K marathon"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="What do you want to achieve?"
                                            rows={2}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                        >
                                            <option value="">Select category...</option>
                                            {CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                                        <input
                                            type="number"
                                            value={formData.target}
                                            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                            placeholder="e.g. 5"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            placeholder="e.g. km, kg, hours"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={handleCreate}
                                        disabled={isPending}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                                    >
                                        {isPending ? "Creating..." : "Create Goal"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading ? (
                        <div className="text-center py-16">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                            />
                            <p className="text-gray-500">Loading goals...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
                            <div className="text-6xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Goals Yet</h3>
                            <p className="text-gray-500 mb-6">Set your first goal to start tracking your progress.</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                Create Your First Goal
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Active Goals */}
                            {activeGoals.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Active Goals ({activeGoals.length})</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeGoals.map((goal, i) => {
                                            const cat = getCategoryInfo(goal.category)
                                            const progress = goal.target ? Math.min((goal.current / goal.target) * 100, 100) : 0
                                            return (
                                                <AnimatedCard key={goal.id} delay={i * 0.08} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-shadow">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{cat.icon}</span>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{goal.title}</h3>
                                                                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{cat.label}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(goal.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                                                            title="Delete"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    {goal.description && (
                                                        <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                                                    )}
                                                    {goal.target && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-gray-600">
                                                                    {goal.current} / {goal.target} {goal.unit || ""}
                                                                </span>
                                                                <span className="font-semibold text-blue-600">{progress.toFixed(0)}%</span>
                                                            </div>
                                                            <AnimatedProgress value={goal.current} max={goal.target} height="h-2.5" delay={0.3 + i * 0.08} />
                                                            <div className="flex gap-2 mt-3">
                                                                {[1, 5, 10].map((inc) => (
                                                                    <motion.button
                                                                        key={inc}
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleUpdateProgress(goal.id, goal.current + inc)}
                                                                        disabled={isPending}
                                                                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors disabled:opacity-50"
                                                                    >
                                                                        +{inc}
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {goal.deadline && (
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            📅 Due: {new Date(goal.deadline).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </AnimatedCard>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Completed Goals */}
                            {completedGoals.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4">✅ Completed ({completedGoals.length})</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {completedGoals.map((goal) => {
                                            const cat = getCategoryInfo(goal.category)
                                            return (
                                                <div key={goal.id} className="bg-green-50/80 backdrop-blur-sm rounded-2xl shadow border border-green-100 p-6 opacity-80">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-2xl">{cat.icon}</span>
                                                        <div>
                                                            <h3 className="font-bold text-green-800 line-through">{goal.title}</h3>
                                                            <span className="text-xs text-green-600 font-medium">{cat.label}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-green-700">
                                                        🎉 Completed! {goal.target} {goal.unit}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </PageTransition>
    )
}
