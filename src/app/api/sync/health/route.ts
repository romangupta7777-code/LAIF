import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// GET /api/sync/health — Export health data
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [healthLogs, moods, goals, habits] = await Promise.all([
        prisma.healthLog.findMany({
            where: { userId: session.user.id, date: { gte: since } },
            orderBy: { date: "desc" },
        }),
        prisma.moodEntry.findMany({
            where: { userId: session.user.id, createdAt: { gte: since } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.habit.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
        }),
    ])

    return NextResponse.json({
        export: {
            generatedAt: new Date().toISOString(),
            period: `Last ${days} days`,
            healthLogs: healthLogs.map(h => ({
                date: h.date, steps: h.steps, sleepHours: h.sleepHours,
                waterGlasses: h.waterGlasses, workoutMins: h.workoutMins,
                workoutType: h.workoutType, notes: h.notes,
            })),
            moodEntries: moods.map(m => ({
                date: m.createdAt, mood: m.mood, energy: m.energy,
                stress: m.stress, notes: m.notes,
            })),
            goals: goals.map(g => ({
                title: g.title, category: g.category, target: g.target,
                progress: g.current, status: g.status,
            })),
            habits: habits.map(h => ({
                name: h.name, frequency: h.frequency,
                streak: h.streak, bestStreak: h.bestStreak,
            })),
        },
    })
}
