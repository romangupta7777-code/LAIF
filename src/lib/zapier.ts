const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || ""

interface ZapierPayload {
    event: string
    userId: string
    userName?: string
    data: Record<string, string | number | boolean | null | undefined>
    timestamp: string
}

export async function triggerZapierWebhook(payload: ZapierPayload): Promise<boolean> {
    if (!ZAPIER_WEBHOOK_URL || ZAPIER_WEBHOOK_URL === "your-zapier-webhook-url") {
        console.log("[Zapier] Webhook not configured, skipping:", payload.event)
        return false
    }

    try {
        const response = await fetch(ZAPIER_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        console.log(`[Zapier] Webhook sent: ${payload.event} — Status: ${response.status}`)
        return response.ok
    } catch (error) {
        console.error("[Zapier] Webhook failed:", error)
        return false
    }
}

// Pre-built triggers for common events
export async function zapierGoalCompleted(userId: string, userName: string, goalTitle: string) {
    return triggerZapierWebhook({
        event: "goal_completed",
        userId,
        userName,
        data: { goalTitle, completedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
    })
}

export async function zapierMoodAlert(userId: string, userName: string, mood: number, stress: number) {
    if (mood <= 2 || stress >= 8) {
        return triggerZapierWebhook({
            event: "low_mood_alert",
            userId,
            userName,
            data: { mood, stress, alertType: mood <= 2 ? "low_mood" : "high_stress" },
            timestamp: new Date().toISOString(),
        })
    }
    return false
}

export async function zapierHealthMilestone(userId: string, userName: string, milestone: string, value: number) {
    return triggerZapierWebhook({
        event: "health_milestone",
        userId,
        userName,
        data: { milestone, value },
        timestamp: new Date().toISOString(),
    })
}

export async function zapierDailySummary(userId: string, userName: string, summary: {
    mood?: number; steps?: number; sleepHours?: number;
    goalsCompleted?: number; habitsCompleted?: number
}) {
    return triggerZapierWebhook({
        event: "daily_summary",
        userId,
        userName,
        data: summary,
        timestamp: new Date().toISOString(),
    })
}

export async function zapierHabitStreak(userId: string, userName: string, habitName: string, streak: number) {
    if (streak % 7 === 0) {
        return triggerZapierWebhook({
            event: "habit_streak_milestone",
            userId,
            userName,
            data: { habitName, streak, milestone: `${streak}-day streak` },
            timestamp: new Date().toISOString(),
        })
    }
    return false
}
