"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveOnboardingProfile } from "./actions"

const STEPS = [
    { id: 1, title: "Basics", icon: "👤", description: "Tell us about yourself" },
    { id: 2, title: "Body", icon: "📏", description: "Your physical details" },
    { id: 3, title: "Lifestyle", icon: "🌟", description: "Your daily habits" },
]

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"]
const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
    { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
    { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
    { value: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week" },
    { value: "extreme", label: "Extra Active", desc: "Very hard exercise & physical job" },
]
const BUDGET_OPTIONS = [
    { value: "free", label: "Free Only", desc: "No budget for health products" },
    { value: "low", label: "Budget-Friendly", desc: "Under $50/month" },
    { value: "moderate", label: "Moderate", desc: "$50–$150/month" },
    { value: "premium", label: "Premium", desc: "$150+/month" },
]

export default function OnboardingPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [step, setStep] = useState(1)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        age: "",
        gender: "",
        height: "",
        weight: "",
        activityLevel: "",
        sleepGoal: "8",
        budget: "",
    })

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.age !== "" && formData.gender !== ""
            case 2:
                return formData.height !== "" && formData.weight !== ""
            case 3:
                return formData.activityLevel !== "" && formData.budget !== ""
            default:
                return false
        }
    }

    const handleNext = () => {
        if (step < 3) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleComplete = () => {
        setError("")
        startTransition(async () => {
            const result = await saveOnboardingProfile({
                age: parseInt(formData.age),
                gender: formData.gender,
                height: parseFloat(formData.height),
                weight: parseFloat(formData.weight),
                activityLevel: formData.activityLevel,
                sleepGoal: parseInt(formData.sleepGoal),
                budget: formData.budget,
            })

            if (result.error) {
                setError(result.error)
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        })
    }

    return (
        <div className="flex items-center justify-center px-4 pb-12">
            <div className="w-full max-w-lg">
                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div
                                className={`
                                    flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold transition-all duration-300
                                    ${step === s.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                                        : step > s.id
                                            ? "bg-green-500 text-white"
                                            : "bg-white text-gray-400 border-2 border-gray-200"
                                    }
                                `}
                            >
                                {step > s.id ? "✓" : s.icon}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`w-12 h-1 mx-1 rounded-full transition-colors duration-300 ${step > s.id ? "bg-green-400" : "bg-gray-200"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Title */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {STEPS[step - 1].title}
                    </h2>
                    <p className="text-gray-500 mt-1">{STEPS[step - 1].description}</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basics */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    How old are you?
                                </label>
                                <input
                                    type="number"
                                    min="13"
                                    max="120"
                                    value={formData.age}
                                    onChange={(e) => updateField("age", e.target.value)}
                                    placeholder="e.g. 25"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Gender
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {GENDER_OPTIONS.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => updateField("gender", g)}
                                            className={`
                                                px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                                                ${formData.gender === g
                                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Body */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    min="100"
                                    max="250"
                                    value={formData.height}
                                    onChange={(e) => updateField("height", e.target.value)}
                                    placeholder="e.g. 175"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="300"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => updateField("weight", e.target.value)}
                                    placeholder="e.g. 70"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg"
                                />
                            </div>
                            {/* BMI Preview */}
                            {formData.height && formData.weight && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                    <p className="text-sm text-gray-600 mb-1">Your BMI</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(() => {
                                            const bmi = parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)
                                            if (bmi < 18.5) return "Underweight"
                                            if (bmi < 25) return "Normal weight"
                                            if (bmi < 30) return "Overweight"
                                            return "Obese"
                                        })()}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Lifestyle */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Activity Level
                                </label>
                                <div className="space-y-2">
                                    {ACTIVITY_LEVELS.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => updateField("activityLevel", level.value)}
                                            className={`
                                                w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200
                                                ${formData.activityLevel === level.value
                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            <p className={`text-sm font-semibold ${formData.activityLevel === level.value ? "text-blue-700" : "text-gray-700"}`}>
                                                {level.label}
                                            </p>
                                            <p className="text-xs text-gray-500">{level.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Daily Sleep Goal (hours)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="4"
                                        max="12"
                                        value={formData.sleepGoal}
                                        onChange={(e) => updateField("sleepGoal", e.target.value)}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="text-2xl font-bold text-blue-700 w-12 text-center">
                                        {formData.sleepGoal}h
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Health & Wellness Budget
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {BUDGET_OPTIONS.map((b) => (
                                        <button
                                            key={b.value}
                                            type="button"
                                            onClick={() => updateField("budget", b.value)}
                                            className={`
                                                px-4 py-3 rounded-xl border-2 text-left transition-all duration-200
                                                ${formData.budget === b.value
                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            <p className={`text-sm font-semibold ${formData.budget === b.value ? "text-blue-700" : "text-gray-700"}`}>
                                                {b.label}
                                            </p>
                                            <p className="text-xs text-gray-500">{b.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                ← Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200 hover:shadow-blue-300"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={!canProceed() || isPending}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    "Complete Setup ✨"
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Step counter */}
                <p className="text-center text-sm text-gray-400 mt-4">
                    Step {step} of 3
                </p>
            </div>
        </div>
    )
}
