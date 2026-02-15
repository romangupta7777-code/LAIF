"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

interface ProfileData {
    name?: string
    age?: number
    gender?: string
    height?: number
    weight?: number
    activityLevel?: string
    sleepGoal?: number
    budget?: string
}

export async function getProfile() {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
    })

    if (!user) {
        return { error: "User not found" }
    }

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        },
        profile: user.profile,
    }
}

export async function updateProfile(data: ProfileData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "Not authenticated" }
    }

    try {
        // Update user name if provided
        if (data.name !== undefined) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { name: data.name },
            })
        }

        // Upsert profile data
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
        console.error("Failed to update profile:", error)
        return { error: "Failed to update profile. Please try again." }
    }
}
