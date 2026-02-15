import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// GET /api/sync/calendar — Export data in calendar-friendly format (iCal-like JSON)
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [goals, habits, healthLogs] = await Promise.all([
        prisma.goal.findMany({
            where: { userId: session.user.id, deadline: { gte: since } },
            orderBy: { deadline: "asc" },
        }),
        prisma.habit.findMany({
            where: { userId: session.user.id },
        }),
        prisma.healthLog.findMany({
            where: { userId: session.user.id, date: { gte: since } },
            orderBy: { date: "asc" },
        }),
    ])

    // Build calendar events
    const events = []

    // Goal deadlines as calendar events
    for (const goal of goals) {
        if (goal.deadline) {
            events.push({
                type: "goal_deadline",
                title: `🎯 Goal: ${goal.title}`,
                date: goal.deadline.toISOString().split("T")[0],
                allDay: true,
                status: goal.status,
                description: `Category: ${goal.category || "General"} | Progress: ${goal.current || 0}/${goal.target || "N/A"}`,
            })
        }
    }

    // Habits as recurring events
    for (const habit of habits) {
        events.push({
            type: "habit",
            title: `📋 ${habit.name}`,
            frequency: habit.frequency,
            recurring: true,
            streak: habit.streak,
            description: `Current streak: ${habit.streak} days | Best: ${habit.bestStreak} days`,
        })
    }

    // Workout logs as calendar events
    for (const log of healthLogs) {
        if (log.workoutMins && log.workoutMins > 0) {
            events.push({
                type: "workout",
                title: `💪 ${log.workoutType || "Workout"} — ${log.workoutMins}min`,
                date: log.date.toISOString().split("T")[0],
                allDay: false,
                duration: log.workoutMins,
                description: `Steps: ${log.steps || "N/A"} | Sleep: ${log.sleepHours || "N/A"}h`,
            })
        }
    }

    return NextResponse.json({
        calendar: {
            generatedAt: new Date().toISOString(),
            totalEvents: events.length,
            events,
        },
    })
}
