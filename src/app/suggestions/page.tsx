"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { getAISuggestions, askLAifQuestion } from "./actions"

const TABS = [
    { id: "all", label: "All", icon: "✨", desc: "Complete lifestyle plan" },
    { id: "diet", label: "Diet", icon: "🥗", desc: "Nutrition & meals" },
    { id: "exercise", label: "Exercise", icon: "🏋️", desc: "Workouts & activities" },
    { id: "product", label: "Products", icon: "🛒", desc: "Health products" },
] as const

type TabType = (typeof TABS)[number]["id"]

export default function SuggestionsPage() {
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState<TabType>("all")
    const [content, setContent] = useState<Record<string, string>>({})
    const [error, setError] = useState("")
    const [question, setQuestion] = useState("")
    const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([])

    const handleGenerate = (type: TabType) => {
        setError("")
        startTransition(async () => {
            const result = await getAISuggestions(type)
            if (result.error) {
                setError(result.error)
            } else if (result.content) {
                setContent((prev) => ({ ...prev, [type]: result.content! }))
            }
        })
    }

    const handleAsk = () => {
        if (!question.trim()) return
        const q = question.trim()
        setQuestion("")
        setChatHistory((prev) => [...prev, { role: "user", text: q }])
        setError("")

        startTransition(async () => {
            const result = await askLAifQuestion(q)
            if (result.error) {
                setError(result.error)
            } else if (result.answer) {
                setChatHistory((prev) => [...prev, { role: "ai", text: result.answer! }])
            }
        })
    }

    const formatContent = (text: string) => {
        return text.split("\n").map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) return null
            if (trimmed.startsWith("## ") || trimmed.startsWith("**") && trimmed.endsWith("**")) {
                return (
                    <h3 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">
                        {trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "")}
                    </h3>
                )
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                    <p key={i} className="text-sm text-gray-700 pl-4 mb-1.5 before:content-['•'] before:mr-2 before:text-blue-400">
                        {trimmed.slice(2)}
                    </p>
                )
            }
            return (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">
                    {trimmed.replace(/\*\*/g, "")}
                </p>
            )
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 pb-24">
            {/* Nav */}
            <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 flex justify-between items-center h-14">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                        <span className="text-blue-600">LAif</span> AI
                    </Link>
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Dashboard
                    </Link>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Lifestyle Coach</h1>
                    <p className="text-sm text-gray-500">Personalized recommendations powered by Gemini</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* Content Area */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {TABS.find((t) => t.id === activeTab)?.icon}{" "}
                                {TABS.find((t) => t.id === activeTab)?.label} Recommendations
                            </h2>
                            <p className="text-xs text-gray-500">{TABS.find((t) => t.id === activeTab)?.desc}</p>
                        </div>
                        <button
                            onClick={() => handleGenerate(activeTab)}
                            disabled={isPending}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-md"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                "Generate ✨"
                            )}
                        </button>
                    </div>

                    {content[activeTab] ? (
                        <div className="prose prose-sm max-w-none">{formatContent(content[activeTab])}</div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">🤖</div>
                            <p className="text-gray-500 text-sm">
                                Click &quot;Generate&quot; to get personalized {activeTab} recommendations
                            </p>
                            <p className="text-gray-400 text-xs mt-1">Powered by your profile data + Google Gemini</p>
                        </div>
                    )}
                </div>

                {/* Ask LAif Chat Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">💬 Ask LAif</h2>

                    {/* Chat History */}
                    {chatHistory.length > 0 && (
                        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                            {chatHistory.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-br-md"
                                                : "bg-gray-100 text-gray-800 rounded-bl-md"
                                            }`}
                                    >
                                        {msg.role === "ai" ? (
                                            <div className="space-y-1">{formatContent(msg.text)}</div>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isPending && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                            placeholder="Ask about diet, exercise, wellness..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
                            disabled={isPending}
                        />
                        <button
                            onClick={handleAsk}
                            disabled={isPending || !question.trim()}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
                    {[
                        { href: "/dashboard", icon: "🏠", label: "Home" },
                        { href: "/schedule", icon: "📋", label: "Routine" },
                        { href: "/goals", icon: "🎯", label: "Goals" },
                        { href: "/suggestions", icon: "🤖", label: "AI Coach", active: true },
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
