"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

function getTodayDate() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

export async function getHealthLog(dateStr?: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const date = dateStr ? new Date(dateStr) : getTodayDate()
    date.setHours(0, 0, 0, 0)

    const log = await prisma.healthLog.findFirst({
        where: {
            userId: session.user.id,
            date: date,
        },
    })

    return { log }
}

export async function saveHealthLog(data: {
    steps?: number
    sleepHours?: number
    waterGlasses?: number
    workoutMins?: number
    workoutType?: string
    notes?: string
    date?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const date = data.date ? new Date(data.date) : getTodayDate()
    date.setHours(0, 0, 0, 0)

    try {
        const log = await prisma.healthLog.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: date,
                },
            },
            create: {
                userId: session.user.id,
                date: date,
                steps: data.steps,
                sleepHours: data.sleepHours,
                waterGlasses: data.waterGlasses,
                workoutMins: data.workoutMins,
                workoutType: data.workoutType,
                notes: data.notes,
            },
            update: {
                steps: data.steps,
                sleepHours: data.sleepHours,
                waterGlasses: data.waterGlasses,
                workoutMins: data.workoutMins,
                workoutType: data.workoutType,
                notes: data.notes,
            },
        })
        return { success: true, log }
    } catch (error) {
        console.error("Failed to save health log:", error)
        return { error: "Failed to save health log." }
    }
}

export async function getHealthHistory(days: number = 7) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const [logs, moods] = await Promise.all([
        prisma.healthLog.findMany({
            where: {
                userId: session.user.id,
                date: { gte: since },
            },
            orderBy: { date: "desc" },
        }),
        prisma.moodEntry.findMany({
            where: {
                userId: session.user.id,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: "desc" },
        }),
    ])

    return { logs, moods }
}

export async function getMoodHistory() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const moods = await prisma.moodEntry.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
    })

    return { moods }
}
