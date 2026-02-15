"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

interface HabitData {
    name: string
    frequency: string
}

export async function getHabits() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const habits = await prisma.habit.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    })

    return { habits }
}

export async function createHabit(data: HabitData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const habit = await prisma.habit.create({
            data: {
                userId: session.user.id,
                name: data.name,
                frequency: data.frequency,
            },
        })
        return { success: true, habit }
    } catch (error) {
        console.error("Failed to create habit:", error)
        return { error: "Failed to create habit." }
    }
}

export async function markHabitDone(habitId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const habit = await prisma.habit.findFirst({
            where: { id: habitId, userId: session.user.id },
        })
        if (!habit) return { error: "Habit not found" }

        const now = new Date()
        const lastDone = habit.lastDone
        const isConsecutive = lastDone
            ? (now.getTime() - lastDone.getTime()) < 2 * 24 * 60 * 60 * 1000
            : false

        const newStreak = isConsecutive ? habit.streak + 1 : 1
        const bestStreak = Math.max(newStreak, habit.bestStreak)

        const updated = await prisma.habit.update({
            where: { id: habitId },
            data: {
                streak: newStreak,
                bestStreak,
                lastDone: now,
            },
        })
        return { success: true, habit: updated }
    } catch (error) {
        console.error("Failed to mark habit:", error)
        return { error: "Failed to update habit." }
    }
}

export async function deleteHabit(habitId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        await prisma.habit.deleteMany({
            where: { id: habitId, userId: session.user.id },
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to delete habit:", error)
        return { error: "Failed to delete habit." }
    }
}
