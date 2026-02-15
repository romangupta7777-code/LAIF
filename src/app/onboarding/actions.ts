"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

interface OnboardingData {
    age: number
    gender: string
    height: number
    weight: number
    activityLevel: string
    sleepGoal: number
    budget: string
}

export async function saveOnboardingProfile(data: OnboardingData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "You must be signed in to complete onboarding." }
    }

    try {
        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            update: {
                age: data.age,
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                activityLevel: data.activityLevel,
                sleepGoal: data.sleepGoal,
                budget: data.budget,
            },
            create: {
                userId: session.user.id,
                age: data.age,
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                activityLevel: data.activityLevel,
                sleepGoal: data.sleepGoal,
                budget: data.budget,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to save onboarding profile:", error)
        return { error: "Failed to save your profile. Please try again." }
    }
}

export async function checkOnboardingStatus() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    const profile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
    })

    return { hasProfile: !!profile }
}
