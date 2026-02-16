"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { generateSuggestions, askLAif } from "@/lib/ai"

// Pre-built fallback content when Gemini API is completely unavailable
const FALLBACK_SUGGESTIONS: Record<string, string> = {
    all: `## 🥗 Nutrition Tips
**Balanced Plate Method** — Fill half your plate with vegetables, a quarter with lean protein, and a quarter with whole grains. This simple approach ensures balanced nutrition without calorie counting.

**Stay Hydrated** — Aim for 8 glasses of water daily. Start each morning with a glass of water before anything else.

## 🏋️ Exercise Recommendations
**30-Minute Daily Movement** — Even a brisk walk counts! Consistency matters more than intensity. Try to move for at least 30 minutes each day.

**Strength Training 2x/Week** — Include bodyweight exercises like push-ups, squats, and planks. These build muscle and boost metabolism.

## 🌿 Wellness Tips
**Sleep Hygiene** — Aim for 7-9 hours of sleep. Keep your room cool, dark, and avoid screens 30 minutes before bed.

**Stress Management** — Try the 4-7-8 breathing technique: inhale 4 seconds, hold 7, exhale 8. Repeat 3 times when feeling stressed.

## 🛒 Product Suggestions
**Water Bottle with Time Markers** — Helps track daily water intake (~$15-25).

**Resistance Bands Set** — Versatile for home workouts and stretching (~$10-20).`,
    diet: `## 🥗 Personalized Diet Tips
**Start with Protein** — Include protein in every meal. It keeps you full longer and supports muscle recovery. Good sources: eggs, chicken, fish, lentils, Greek yogurt.

**Meal Prep Sundays** — Prepare 3-4 days of meals in advance. This saves time and reduces unhealthy snacking decisions.

**Mindful Eating** — Eat slowly, chew thoroughly, and avoid distractions during meals. This improves digestion and helps you recognize fullness cues.

**Colorful Plates** — Aim for 3+ colors on your plate. Different colored vegetables provide different nutrients your body needs.`,
    exercise: `## 🏋️ Exercise Recommendations
**Morning Movement** — Start your day with 10 minutes of stretching or yoga. It boosts energy and sets a positive tone for the day.

**Progressive Overload** — Gradually increase weight, reps, or duration each week. This ensures continuous improvement.

**Active Recovery** — On rest days, do light activities like walking, swimming, or gentle yoga. Complete rest can actually slow your progress.

**Consistency Over Intensity** — Working out 4x/week at moderate intensity beats going hard twice a week and burning out.`,
    product: `## 🛒 Health & Wellness Products
**Foam Roller** — Great for muscle recovery and reducing soreness after workouts (~$15-30).

**Fitness Tracker** — Monitor your steps, heart rate, and sleep patterns. Many affordable options available (~$30-50).

**Yoga Mat** — Essential for home workouts, stretching, and meditation (~$15-25).

**Meal Prep Containers** — Glass containers for healthy meal prepping. BPA-free and microwave safe (~$20-30).`,
    general: `## ✨ Lifestyle Tips
**Morning Routine** — Wake up at a consistent time. Start with water, light exercise, then a nutritious breakfast. A good morning sets the tone for the day.

**Digital Detox** — Take 1 hour before bed without screens. Read, journal, or practice relaxation techniques instead.

**Social Wellness** — Stay connected with friends and family. Strong social connections are linked to better mental and physical health.`,
}

const FALLBACK_CHAT_RESPONSES = [
    "Great question! While I'm temporarily offline, here's a quick tip: Try drinking a glass of water right now — most people are mildly dehydrated without knowing it! 💧 I'll be back online soon to give you a more personalized answer.",
    "I'm recharging my AI brain right now! 🧠 In the meantime, here's a wellness tip: Take 3 deep breaths — in for 4 seconds, hold for 4, out for 4. It instantly reduces stress. I'll be ready to chat again shortly!",
    "I'm taking a quick break! Here's something useful: Stand up and stretch for 30 seconds if you've been sitting. Your body will thank you! 🧘 Try me again in a minute for personalized advice.",
    "Briefly offline, but here's a tip: Try the 20-20-20 rule — every 20 minutes, look at something 20 feet away for 20 seconds. Great for eye health! 👁️ I'll be back soon!",
    "Quick pause on my end! Meanwhile: Add one extra serving of vegetables to your next meal. Small changes add up to big results! 🥦 Ask me again shortly for tailored advice.",
]

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

        // If rate limited, try DB cache first, then fallback content
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
            // No DB cache — return pre-built fallback
            return {
                content: FALLBACK_SUGGESTIONS[type] || FALLBACK_SUGGESTIONS.all,
                fromCache: true,
                rateLimited: true,
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
        if (err.isRateLimit) {
            // Return a helpful fallback response instead of just an error
            const fallback = FALLBACK_CHAT_RESPONSES[Math.floor(Math.random() * FALLBACK_CHAT_RESPONSES.length)]
            return { answer: fallback, rateLimited: true }
        }
        const message = err.message || "Failed to get response"
        return { error: message, rateLimited: false }
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
