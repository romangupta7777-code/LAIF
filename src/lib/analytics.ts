import mixpanel from "mixpanel-browser"

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || ""

let initialized = false

export function initMixpanel() {
    if (initialized || !MIXPANEL_TOKEN || MIXPANEL_TOKEN === "your-mixpanel-token") return
    try {
        mixpanel.init(MIXPANEL_TOKEN, {
            debug: process.env.NODE_ENV === "development",
            track_pageview: true,
            persistence: "localStorage",
        })
        initialized = true
    } catch (e) {
        console.warn("Mixpanel init failed:", e)
    }
}

export function identify(userId: string, traits?: Record<string, string | number | boolean>) {
    if (!initialized) return
    mixpanel.identify(userId)
    if (traits) mixpanel.people.set(traits)
}

export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
    if (!initialized) {
        // Store locally if Mixpanel not configured
        storeLocalEvent(event, properties)
        return
    }
    mixpanel.track(event, properties || {})
    storeLocalEvent(event, properties)
}

export function trackPageView(page: string) {
    track("Page View", { page })
}

export function reset() {
    if (!initialized) return
    mixpanel.reset()
}

// ======= LOCAL ANALYTICS STORAGE =======
// Always store events locally for the in-app analytics dashboard

interface StoredEvent {
    event: string
    properties?: Record<string, string | number | boolean | null>
    timestamp: string
}

function storeLocalEvent(event: string, properties?: Record<string, string | number | boolean | null>) {
    try {
        const key = "laif_analytics"
        const existing: StoredEvent[] = JSON.parse(localStorage.getItem(key) || "[]")
        existing.push({ event, properties: properties || {}, timestamp: new Date().toISOString() })
        // Keep last 500 events
        if (existing.length > 500) existing.splice(0, existing.length - 500)
        localStorage.setItem(key, JSON.stringify(existing))
    } catch {
        // silently fail
    }
}

export function getLocalEvents(): StoredEvent[] {
    try {
        return JSON.parse(localStorage.getItem("laif_analytics") || "[]")
    } catch {
        return []
    }
}

// ======= EVENT NAMES (constants) =======
export const EVENTS = {
    // Auth
    SIGN_IN: "Sign In",
    SIGN_OUT: "Sign Out",

    // Onboarding
    ONBOARDING_STARTED: "Onboarding Started",
    ONBOARDING_COMPLETED: "Onboarding Completed",

    // Dashboard
    DASHBOARD_VIEWED: "Dashboard Viewed",
    MOOD_LOGGED: "Mood Logged",
    ASK_LAIF: "Ask LAif",

    // Goals
    GOAL_CREATED: "Goal Created",
    GOAL_UPDATED: "Goal Updated",
    GOAL_COMPLETED: "Goal Completed",

    // Wellness
    HEALTH_LOGGED: "Health Log Saved",
    MENTAL_CHECKIN: "Mental Health Check-in",

    // Habits
    HABIT_CREATED: "Habit Created",
    HABIT_COMPLETED: "Habit Completed",

    // AI
    AI_SUGGESTION_GENERATED: "AI Suggestion Generated",
    AI_QUESTION_ASKED: "AI Question Asked",

    // Profile
    PROFILE_UPDATED: "Profile Updated",

    // Navigation
    PAGE_VIEW: "Page View",
}
