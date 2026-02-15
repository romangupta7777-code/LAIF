import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { zapierDailySummary } from "@/lib/zapier"

// POST /api/webhooks/daily-summary — Triggers a daily summary to Zapier
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayMood, todayHealth, completedGoals, habits] = await Promise.all([
        prisma.moodEntry.findFirst({
            where: { userId: session.user.id, createdAt: { gte: today } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.healthLog.findFirst({
            where: { userId: session.user.id, date: today },
        }),
        prisma.goal.count({
            where: { userId: session.user.id, status: "completed", updatedAt: { gte: today } },
        }),
        prisma.habit.count({
            where: { userId: session.user.id, lastDone: { gte: today } },
        }),
    ])

    const summary = {
        mood: todayMood?.mood,
        steps: todayHealth?.steps ?? undefined,
        sleepHours: todayHealth?.sleepHours ?? undefined,
        goalsCompleted: completedGoals,
        habitsCompleted: habits,
    }

    const sent = await zapierDailySummary(
        session.user.id,
        session.user.name || "User",
        summary
    )

    return NextResponse.json({
        success: true,
        webhookSent: sent,
        summary,
    })
}

// GET /api/webhooks/daily-summary — Get today's summary without sending
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayMood, todayHealth, completedGoals, habits] = await Promise.all([
        prisma.moodEntry.findFirst({
            where: { userId: session.user.id, createdAt: { gte: today } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.healthLog.findFirst({
            where: { userId: session.user.id, date: today },
        }),
        prisma.goal.count({
            where: { userId: session.user.id, status: "completed", updatedAt: { gte: today } },
        }),
        prisma.habit.count({
            where: { userId: session.user.id, lastDone: { gte: today } },
        }),
    ])

    return NextResponse.json({
        summary: {
            date: today.toISOString().split("T")[0],
            mood: todayMood?.mood || null,
            energy: todayMood?.energy || null,
            stress: todayMood?.stress || null,
            steps: todayHealth?.steps || null,
            sleepHours: todayHealth?.sleepHours || null,
            waterGlasses: todayHealth?.waterGlasses || null,
            workoutMins: todayHealth?.workoutMins || null,
            goalsCompletedToday: completedGoals,
            habitsCompletedToday: habits,
        },
    })
}
