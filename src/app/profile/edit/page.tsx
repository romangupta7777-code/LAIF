"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProfile, updateProfile } from "../actions"

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"]
const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Sedentary" },
    { value: "light", label: "Lightly Active" },
    { value: "moderate", label: "Moderately Active" },
    { value: "active", label: "Very Active" },
    { value: "extreme", label: "Extra Active" },
]
const BUDGET_OPTIONS = [
    { value: "free", label: "Free Only" },
    { value: "low", label: "Budget-Friendly" },
    { value: "moderate", label: "Moderate" },
    { value: "premium", label: "Premium" },
]

export default function EditProfilePage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        height: "",
        weight: "",
        activityLevel: "",
        sleepGoal: "8",
        budget: "",
    })

    useEffect(() => {
        const loadProfile = async () => {
            const result = await getProfile()
            if (result.error) {
                setError(result.error)
                setLoading(false)
                return
            }

            setFormData({
                name: result.user?.name || "",
                age: result.profile?.age?.toString() || "",
                gender: result.profile?.gender || "",
                height: result.profile?.height?.toString() || "",
                weight: result.profile?.weight?.toString() || "",
                activityLevel: result.profile?.activityLevel || "",
                sleepGoal: result.profile?.sleepGoal?.toString() || "8",
                budget: result.profile?.budget || "",
            })
            setLoading(false)
        }
        loadProfile()
    }, [])

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        startTransition(async () => {
            const result = await updateProfile({
                name: formData.name || undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                gender: formData.gender || undefined,
                height: formData.height ? parseFloat(formData.height) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                activityLevel: formData.activityLevel || undefined,
                sleepGoal: formData.sleepGoal ? parseInt(formData.sleepGoal) : undefined,
                budget: formData.budget || undefined,
            })

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => router.push("/profile"), 1000)
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-500">Loading your profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                            <span className="text-blue-600">LAif</span>
                        </Link>
                        <Link
                            href="/profile"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Back to Profile
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                    <p className="text-gray-500 mt-1">Update your personal details and preferences</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                                ✅ Profile updated! Redirecting...
                            </div>
                        )}

                        {/* Personal Info */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Personal Info
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                        <input
                                            type="number"
                                            min="13"
                                            max="120"
                                            value={formData.age}
                                            onChange={(e) => updateField("age", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => updateField("gender", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                        >
                                            <option value="">Select...</option>
                                            {GENDER_OPTIONS.map((g) => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Body Stats */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Body Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                    <input
                                        type="number"
                                        min="100"
                                        max="250"
                                        value={formData.height}
                                        onChange={(e) => updateField("height", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        min="30"
                                        max="300"
                                        step="0.1"
                                        value={formData.weight}
                                        onChange={(e) => updateField("weight", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Lifestyle
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                                    <select
                                        value={formData.activityLevel}
                                        onChange={(e) => updateField("activityLevel", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                    >
                                        <option value="">Select...</option>
                                        {ACTIVITY_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sleep Goal: <span className="text-blue-600 font-bold">{formData.sleepGoal}h</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="4"
                                        max="12"
                                        value={formData.sleepGoal}
                                        onChange={(e) => updateField("sleepGoal", e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Health Budget</label>
                                    <select
                                        value={formData.budget}
                                        onChange={(e) => updateField("budget", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                    >
                                        <option value="">Select...</option>
                                        {BUDGET_OPTIONS.map((b) => (
                                            <option key={b.value} value={b.value}>{b.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-8">
                        <Link
                            href="/profile"
                            className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-white/60 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                        >
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}
