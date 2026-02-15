"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

interface GoalData {
    title: string
    description?: string
    category: string
    target?: number
    unit?: string
    deadline?: string
}

export async function getGoals() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const goals = await prisma.goal.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    })

    return { goals }
}

export async function createGoal(data: GoalData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const goal = await prisma.goal.create({
            data: {
                userId: session.user.id,
                title: data.title,
                description: data.description || null,
                category: data.category,
                target: data.target || null,
                unit: data.unit || null,
                deadline: data.deadline ? new Date(data.deadline) : null,
            },
        })
        return { success: true, goal }
    } catch (error) {
        console.error("Failed to create goal:", error)
        return { error: "Failed to create goal." }
    }
}

export async function updateGoalProgress(goalId: string, current: number) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const goal = await prisma.goal.findFirst({
            where: { id: goalId, userId: session.user.id },
        })
        if (!goal) return { error: "Goal not found" }

        const updated = await prisma.goal.update({
            where: { id: goalId },
            data: {
                current,
                status: goal.target && current >= goal.target ? "completed" : "active",
            },
        })
        return { success: true, goal: updated }
    } catch (error) {
        console.error("Failed to update goal:", error)
        return { error: "Failed to update goal." }
    }
}

export async function deleteGoal(goalId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        await prisma.goal.deleteMany({
            where: { id: goalId, userId: session.user.id },
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to delete goal:", error)
        return { error: "Failed to delete goal." }
    }
}
