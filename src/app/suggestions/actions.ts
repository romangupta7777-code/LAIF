"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { generateSuggestions, askLAif } from "@/lib/ai"

async function getUserProfile() {
    const session = await auth()
    if (!session?.user?.id) return null

    const profile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
    })

    return { userId: session.user.id, profile }
}

export async function getAISuggestions(
    type: "general" | "diet" | "exercise" | "product" | "all"
) {
    const data = await getUserProfile()
    if (!data) return { error: "Not authenticated" }

    try {
        const content = await generateSuggestions(
            {
                age: data.profile?.age,
                gender: data.profile?.gender,
                height: data.profile?.height,
                weight: data.profile?.weight,
                activityLevel: data.profile?.activityLevel,
                sleepGoal: data.profile?.sleepGoal,
                budget: data.profile?.budget,
            },
            type
        )

        // Save the suggestion to DB
        await prisma.suggestion.create({
            data: {
                userId: data.userId,
                type,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Suggestions`,
                content,
                priority: "medium",
            },
        })

        return { content }
    } catch (error) {
        const err = error as Error & { isRateLimit?: boolean }

        // If rate limited, try to return the most recent cached suggestion from DB
        if (err.isRateLimit) {
            const cached = await prisma.suggestion.findFirst({
                where: { userId: data.userId, type },
                orderBy: { createdAt: "desc" },
            })
            if (cached) {
                return {
                    content: cached.content,
                    fromCache: true,
                    rateLimited: true,
                }
            }
        }

        const message = err.message || "Failed to generate suggestions"
        return { error: message, rateLimited: err.isRateLimit || false }
    }
}

export async function askLAifQuestion(question: string) {
    const data = await getUserProfile()
    if (!data) return { error: "Not authenticated" }
    if (!question.trim()) return { error: "Please enter a question" }

    try {
        const answer = await askLAif(question, {
            age: data.profile?.age,
            gender: data.profile?.gender,
            height: data.profile?.height,
            weight: data.profile?.weight,
            activityLevel: data.profile?.activityLevel,
            sleepGoal: data.profile?.sleepGoal,
            budget: data.profile?.budget,
        })

        return { answer }
    } catch (error) {
        const err = error as Error & { isRateLimit?: boolean }
        const message = err.message || "Failed to get response"
        return { error: message, rateLimited: err.isRateLimit || false }
    }
}

export async function getSavedSuggestions() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const suggestions = await prisma.suggestion.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    })

    return { suggestions }
}

export async function markSuggestionHelpful(id: string, helpful: boolean) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    await prisma.suggestion.updateMany({
        where: { id, userId: session.user.id },
        data: { helpful },
    })

    return { success: true }
}
