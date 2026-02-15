"use client"

import { useState } from "react"
import Link from "next/link"

export default function AutomationsPage() {
    const [testResult, setTestResult] = useState<string | null>(null)
    const [testing, setTesting] = useState(false)

    const testEndpoint = async (url: string, method: string = "GET") => {
        setTesting(true)
        setTestResult(null)
        try {
            const res = await fetch(url, { method })
            const data = await res.json()
            setTestResult(JSON.stringify(data, null, 2))
        } catch (err) {
            setTestResult(`Error: ${err}`)
        }
        setTesting(false)
    }

    const integrations = [
        {
            name: "Zapier Webhooks",
            icon: "⚡",
            description: "Automated triggers for goals, mood alerts, milestones, and daily summaries",
            status: process.env.NEXT_PUBLIC_ZAPIER_CONFIGURED === "true" ? "active" : "setup-needed",
            triggers: [
                { event: "Goal Completed", desc: "Fires when you complete a goal" },
                { event: "Low Mood Alert", desc: "Fires when mood ≤ 2 or stress ≥ 8" },
                { event: "Health Milestone", desc: "Fires on step/workout milestones" },
                { event: "Habit Streak (7 day)", desc: "Fires every 7-day streak milestone" },
                { event: "Daily Summary", desc: "On-demand daily wellness report" },
            ],
        },
    ]

    const apiEndpoints = [
        {
            name: "Health Data Export",
            method: "GET",
            url: "/api/sync/health?days=7",
            description: "Export health logs, mood entries, goals, and habits as JSON",
        },
        {
            name: "Calendar Sync",
            method: "GET",
            url: "/api/sync/calendar?days=30",
            description: "Export goal deadlines, habits, and workouts as calendar events",
        },
        {
            name: "Daily Summary",
            method: "GET",
            url: "/api/webhooks/daily-summary",
            description: "Get today's wellness summary",
        },
        {
            name: "Send Daily Summary Webhook",
            method: "POST",
            url: "/api/webhooks/daily-summary",
            description: "Send today's summary to Zapier",
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-blue-50 pb-24">
            {/* Header */}
            <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 flex justify-between items-center h-14">
                    <h1 className="text-xl font-bold text-gray-900">
                        <span className="text-blue-600">⚡</span> Automations
                    </h1>
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
                {/* Zapier Integration */}
                {integrations.map((int) => (
                    <div key={int.name} className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{int.icon}</span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">{int.name}</h3>
                                <p className="text-xs text-gray-500">{int.description}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-3">
                            {int.triggers.map((trigger) => (
                                <div key={trigger.event} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                                    <span className="font-medium text-gray-700">{trigger.event}</span>
                                    <span className="text-gray-400 ml-auto">{trigger.desc}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-600 mb-1">Setup Instructions:</p>
                            <ol className="list-decimal list-inside space-y-0.5">
                                <li>Go to <a href="https://zapier.com" className="text-blue-600 underline" target="_blank">zapier.com</a> → Create a Zap</li>
                                <li>Choose &quot;Webhooks by Zapier&quot; as trigger → &quot;Catch Hook&quot;</li>
                                <li>Copy the webhook URL</li>
                                <li>Paste in <code className="bg-gray-200 px-1 rounded">.env.local</code> as <code className="bg-gray-200 px-1 rounded">ZAPIER_WEBHOOK_URL</code></li>
                                <li>Restart server and test with the button below</li>
                            </ol>
                        </div>
                    </div>
                ))}

                {/* API Endpoints */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">🔗 Data Sync Endpoints</h3>
                    <p className="text-xs text-gray-500 mb-4">Use these endpoints to sync LAif data with external services</p>

                    <div className="space-y-3">
                        {apiEndpoints.map((endpoint) => (
                            <div key={endpoint.url + endpoint.method} className="border border-gray-100 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${endpoint.method === "GET" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        }`}>
                                        {endpoint.method}
                                    </span>
                                    <code className="text-xs text-gray-700">{endpoint.url}</code>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{endpoint.description}</p>
                                <button
                                    onClick={() => testEndpoint(endpoint.url, endpoint.method)}
                                    disabled={testing}
                                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                                >
                                    {testing ? "Testing..." : "🧪 Test"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications Config */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">🔔 Notification Workflows</h3>
                    <p className="text-xs text-gray-500 mb-3">Automated alerts and reminders</p>
                    <div className="space-y-2">
                        {[
                            { name: "Low Mood Alert", desc: "Notifies when mood drops below 2/5 or stress exceeds 8/10", active: true },
                            { name: "Streak Milestones", desc: "Celebrates every 7-day habit streak", active: true },
                            { name: "Goal Completion", desc: "Sends notification when a goal is marked complete", active: true },
                            { name: "Daily Summary", desc: "End-of-day wellness report via Zapier", active: true },
                        ].map((notif) => (
                            <div key={notif.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                                <div>
                                    <p className="text-xs font-medium text-gray-700">{notif.name}</p>
                                    <p className="text-[10px] text-gray-400">{notif.desc}</p>
                                </div>
                                <div className={`w-8 h-5 rounded-full flex items-center ${notif.active ? "bg-green-400 justify-end" : "bg-gray-300 justify-start"} p-0.5`}>
                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Test Output */}
                {testResult && (
                    <div className="bg-gray-900 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-gray-400">API Response</p>
                            <button onClick={() => setTestResult(null)} className="text-xs text-gray-500 hover:text-gray-300">✕ Close</button>
                        </div>
                        <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                            {testResult}
                        </pre>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
                    {[
                        { href: "/dashboard", icon: "🏠", label: "Home" },
                        { href: "/wellness", icon: "❤️", label: "Wellness" },
                        { href: "/analytics", icon: "📊", label: "Analytics" },
                        { href: "/automations", icon: "⚡", label: "Automations", active: true },
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
