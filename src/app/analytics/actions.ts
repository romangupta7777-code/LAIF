"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function getAnalyticsData() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const userId = session.user.id
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
        totalGoals,
        completedGoals,
        totalHabits,
        moodEntries7d,
        moodEntries30d,
        healthLogs7d,
        suggestions,
        activities,
    ] = await Promise.all([
        prisma.goal.count({ where: { userId } }),
        prisma.goal.count({ where: { userId, status: "completed" } }),
        prisma.habit.count({ where: { userId } }),
        prisma.moodEntry.findMany({
            where: { userId, createdAt: { gte: sevenDaysAgo } },
            orderBy: { createdAt: "asc" },
        }),
        prisma.moodEntry.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            orderBy: { createdAt: "asc" },
        }),
        prisma.healthLog.findMany({
            where: { userId, date: { gte: sevenDaysAgo } },
            orderBy: { date: "asc" },
        }),
        prisma.suggestion.count({ where: { userId } }),
        prisma.activity.count({ where: { userId } }),
    ])

    // Calculate averages for 7-day mood
    const avgMood7d = moodEntries7d.length > 0
        ? moodEntries7d.reduce((sum, m) => sum + m.mood, 0) / moodEntries7d.length
        : 0
    const avgEnergy7d = moodEntries7d.filter(m => m.energy).length > 0
        ? moodEntries7d.filter(m => m.energy).reduce((sum, m) => sum + (m.energy || 0), 0) / moodEntries7d.filter(m => m.energy).length
        : 0
    const avgStress7d = moodEntries7d.filter(m => m.stress).length > 0
        ? moodEntries7d.filter(m => m.stress).reduce((sum, m) => sum + (m.stress || 0), 0) / moodEntries7d.filter(m => m.stress).length
        : 0

    // Calculate health averages
    const avgSteps = healthLogs7d.filter(h => h.steps).length > 0
        ? Math.round(healthLogs7d.filter(h => h.steps).reduce((sum, h) => sum + (h.steps || 0), 0) / healthLogs7d.filter(h => h.steps).length)
        : 0
    const avgSleep = healthLogs7d.filter(h => h.sleepHours).length > 0
        ? (healthLogs7d.filter(h => h.sleepHours).reduce((sum, h) => sum + (h.sleepHours || 0), 0) / healthLogs7d.filter(h => h.sleepHours).length).toFixed(1)
        : "0"
    const avgWater = healthLogs7d.filter(h => h.waterGlasses).length > 0
        ? Math.round(healthLogs7d.filter(h => h.waterGlasses).reduce((sum, h) => sum + (h.waterGlasses || 0), 0) / healthLogs7d.filter(h => h.waterGlasses).length)
        : 0

    // Mood trend data (daily for chart)
    const moodTrend = moodEntries30d.map(m => ({
        date: m.createdAt.toISOString().split("T")[0],
        mood: m.mood,
        energy: m.energy,
        stress: m.stress,
    }))

    // Health trend data
    const healthTrend = healthLogs7d.map(h => ({
        date: h.date.toISOString().split("T")[0],
        steps: h.steps,
        sleep: h.sleepHours,
        water: h.waterGlasses,
        workout: h.workoutMins,
    }))

    // Best habit streak
    const habits = await prisma.habit.findMany({
        where: { userId },
        orderBy: { bestStreak: "desc" },
        take: 3,
    })

    return {
        overview: {
            totalGoals,
            completedGoals,
            totalHabits,
            totalMoodEntries: moodEntries30d.length,
            totalSuggestions: suggestions,
            totalActivities: activities,
            healthLogsDays: healthLogs7d.length,
        },
        averages: {
            mood: Math.round(avgMood7d * 10) / 10,
            energy: Math.round(avgEnergy7d * 10) / 10,
            stress: Math.round(avgStress7d * 10) / 10,
            steps: avgSteps,
            sleep: avgSleep,
            water: avgWater,
        },
        moodTrend,
        healthTrend,
        topHabits: habits.map(h => ({
            name: h.name,
            streak: h.streak,
            bestStreak: h.bestStreak,
        })),
    }
}
