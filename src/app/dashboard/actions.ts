"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function getDashboardData() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const [goals, habits, latestMood, profile] = await Promise.all([
        prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.habit.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.moodEntry.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.userProfile.findUnique({
            where: { userId: session.user.id },
        }),
    ])

    const activeGoals = goals.filter((g) => g.status === "active")
    const completedGoals = goals.filter((g) => g.status === "completed")

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const habitsCompletedToday = habits.filter((h) => {
        if (!h.lastDone) return false
        const last = new Date(h.lastDone)
        last.setHours(0, 0, 0, 0)
        return last.getTime() === today.getTime()
    })

    const topStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0)

    return {
        user: {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
        },
        stats: {
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            totalHabits: habits.length,
            habitsToday: habitsCompletedToday.length,
            topStreak,
        },
        goals: activeGoals.slice(0, 3),
        habits: habits.slice(0, 5),
        latestMood,
        profile,
    }
}

export async function saveMoodEntry(data: {
    mood: number
    energy: number
    stress: number
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const entry = await prisma.moodEntry.create({
            data: {
                userId: session.user.id,
                mood: data.mood,
                energy: data.energy,
                stress: data.stress,
                notes: data.notes || null,
            },
        })
        return { success: true, entry }
    } catch (error) {
        console.error("Failed to save mood:", error)
        return { error: "Failed to save mood entry." }
    }
}
