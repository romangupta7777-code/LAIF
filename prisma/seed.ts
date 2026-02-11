import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting seed...")

    // Check if demo user already exists — skip cleanup if not
    const existing = await prisma.user.findUnique({ where: { email: "demo@laif.app" } })
    if (existing) {
        // Delete related data first (manual cascade to avoid transactions)
        await prisma.moodEntry.deleteMany({ where: { userId: existing.id } })
        await prisma.activity.deleteMany({ where: { userId: existing.id } })
        await prisma.suggestion.deleteMany({ where: { userId: existing.id } })
        await prisma.habit.deleteMany({ where: { userId: existing.id } })
        await prisma.goal.deleteMany({ where: { userId: existing.id } })
        await prisma.userProfile.deleteMany({ where: { userId: existing.id } })
        await prisma.session.deleteMany({ where: { userId: existing.id } })
        await prisma.account.deleteMany({ where: { userId: existing.id } })
        await prisma.user.delete({ where: { id: existing.id } })
        console.log("🧹 Removed existing demo user and related data")
    }

    // Clean products separately (no user relation)
    await prisma.product.deleteMany()
    console.log("🧹 Cleaned existing product data")

    // ─── 1. Demo User ───────────────────────────────────────────
    const hashedPassword = await bcrypt.hash("demo1234", 10)
    const demoUser = await prisma.user.create({
        data: {
            name: "Alex Demo",
            email: "demo@laif.app",
            password: hashedPassword,
            emailVerified: new Date(),
        },
    })
    console.log(`👤 Created demo user: ${demoUser.email}`)

    // ─── 2. User Profile ────────────────────────────────────────
    await prisma.userProfile.create({
        data: {
            userId: demoUser.id,
            age: 25,
            gender: "non-binary",
            height: 170,
            weight: 68,
            activityLevel: "moderate",
            sleepGoal: 8,
            budget: "medium",
        },
    })
    console.log("📋 Created user profile")

    // ─── 3. Goals ────────────────────────────────────────────────
    const goalData = [
        {
            userId: demoUser.id,
            title: "Run 5K",
            description: "Build up to running a full 5K without stopping",
            category: "fitness",
            target: 5,
            current: 2.3,
            unit: "km",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "active",
        },
        {
            userId: demoUser.id,
            title: "Meditate Daily",
            description: "Practice 10 minutes of mindfulness meditation every day",
            category: "mental-health",
            target: 30,
            current: 12,
            unit: "days",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "active",
        },
        {
            userId: demoUser.id,
            title: "Read 4 Books",
            description: "Read four self-improvement or wellness books this month",
            category: "personal-growth",
            target: 4,
            current: 1,
            unit: "books",
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: "active",
        },
        {
            userId: demoUser.id,
            title: "Drink 2L Water Daily",
            description: "Stay hydrated by drinking at least 2 liters of water each day",
            category: "nutrition",
            target: 14,
            current: 9,
            unit: "days",
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "active",
        },
        {
            userId: demoUser.id,
            title: "Lose 3 kg",
            description: "Healthy weight loss through diet and exercise",
            category: "fitness",
            target: 3,
            current: 3,
            unit: "kg",
            status: "completed",
        },
    ]
    for (const goal of goalData) {
        await prisma.goal.create({ data: goal })
    }
    console.log(`🎯 Created ${goalData.length} goals`)

    // ─── 4. Habits ───────────────────────────────────────────────
    const habitData = [
        { userId: demoUser.id, name: "Morning Meditation", frequency: "daily", streak: 12, bestStreak: 21, lastDone: new Date() },
        { userId: demoUser.id, name: "Evening Walk", frequency: "daily", streak: 5, bestStreak: 14, lastDone: new Date() },
        { userId: demoUser.id, name: "Journaling", frequency: "daily", streak: 3, bestStreak: 10, lastDone: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, name: "Yoga Session", frequency: "3x-week", streak: 2, bestStreak: 8, lastDone: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, name: "No Screen Before Bed", frequency: "daily", streak: 0, bestStreak: 7, lastDone: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, name: "Weekly Meal Prep", frequency: "weekly", streak: 4, bestStreak: 6, lastDone: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ]
    for (const habit of habitData) {
        await prisma.habit.create({ data: habit })
    }
    console.log(`✅ Created ${habitData.length} habits`)

    // ─── 5. Activities (last 7 days) ─────────────────────────────
    const activityData = [
        { userId: demoUser.id, type: "exercise", title: "Morning Jog", description: "Easy jog around the park", duration: 30, calories: 280, timestamp: new Date() },
        { userId: demoUser.id, type: "exercise", title: "Yoga Flow", description: "Vinyasa yoga session at home", duration: 45, calories: 200, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, type: "meditation", title: "Guided Meditation", description: "Headspace basics session", duration: 10, calories: 0, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, type: "exercise", title: "Strength Training", description: "Upper body workout with dumbbells", duration: 40, calories: 320, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, type: "nutrition", title: "Healthy Meal Prep", description: "Prepared meals for the week — grilled chicken, quinoa, veggies", duration: 60, calories: 0, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, type: "exercise", title: "HIIT Workout", description: "20-minute high intensity interval training", duration: 20, calories: 250, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, type: "reading", title: "Atomic Habits — Chapter 5", description: "Read about the 3rd law of behavior change", duration: 25, calories: 0, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ]
    for (const activity of activityData) {
        await prisma.activity.create({ data: activity })
    }
    console.log(`🏃 Created ${activityData.length} activities`)

    // ─── 6. Mood Entries (last 7 days) ───────────────────────────
    const moodData = [
        { userId: demoUser.id, mood: 8, energy: 7, stress: 3, notes: "Feeling great after a good jog this morning!", createdAt: new Date() },
        { userId: demoUser.id, mood: 7, energy: 6, stress: 4, notes: "Decent day, yoga helped me relax", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, mood: 5, energy: 4, stress: 7, notes: "Stressful work day. Skipped my evening walk.", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, mood: 6, energy: 5, stress: 5, notes: "Average day, managed to meal prep though", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, mood: 9, energy: 8, stress: 2, notes: "Awesome day! Crushed my HIIT workout and slept well", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, mood: 7, energy: 6, stress: 4, notes: "Good reading session. Feeling inspired.", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { userId: demoUser.id, mood: 6, energy: 5, stress: 6, notes: "Lazy Sunday but got some rest", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    ]
    for (const mood of moodData) {
        await prisma.moodEntry.create({ data: mood })
    }
    console.log(`😊 Created ${moodData.length} mood entries`)

    // ─── 7. AI Suggestions ──────────────────────────────────────
    const suggestionData = [
        { userId: demoUser.id, type: "fitness", title: "Try Interval Running", content: "Based on your goal to run 5K, try alternating between 2 minutes of jogging and 1 minute of walking. This builds endurance faster than steady-state cardio and reduces injury risk. Aim for 3 sessions per week.", priority: "high", implemented: true, helpful: true },
        { userId: demoUser.id, type: "mental-health", title: "Add Body Scan to Your Routine", content: "Your meditation streak is strong! Consider adding a 5-minute body scan before bed. Research shows it reduces cortisol levels by 23% and improves sleep quality. Try the Headspace body scan series.", priority: "medium", implemented: false },
        { userId: demoUser.id, type: "nutrition", title: "Post-Workout Protein Window", content: "You're burning 250-320 calories per workout but not tracking protein intake. Aim for 20-30g of protein within 30 minutes of exercise. Try a whey protein shake or Greek yogurt with nuts for optimal recovery.", priority: "high", implemented: false },
        { userId: demoUser.id, type: "sleep", title: "Optimize Your Sleep Schedule", content: "Your stress levels spike on days you skip evening walks. A consistent 10pm bedtime with a 30-minute wind-down routine (no screens, light stretching, herbal tea) could improve your sleep score by 15-20%.", priority: "medium", implemented: false },
        { userId: demoUser.id, type: "personal-growth", title: "Apply the 2-Minute Rule", content: "From your reading of Atomic Habits: start any new habit with a 2-minute version. Instead of 'meditate for 10 minutes', start with 'sit on the meditation cushion for 2 minutes'. This builds consistency before intensity.", priority: "low", implemented: true, helpful: true },
    ]
    for (const suggestion of suggestionData) {
        await prisma.suggestion.create({ data: suggestion })
    }
    console.log(`💡 Created ${suggestionData.length} AI suggestions`)

    // ─── 8. Products (global, not user-specific) ────────────────
    const productData = [
        { name: "Whoop 4.0 Fitness Band", description: "Advanced wearable that tracks strain, recovery, and sleep with personalized insights.", category: "fitness-tracker", priceRange: "$$$", link: "https://www.whoop.com", image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400" },
        { name: "Headspace Annual Subscription", description: "Guided meditation app with hundreds of sessions for stress, sleep, focus, and movement.", category: "mental-health", priceRange: "$$", link: "https://www.headspace.com", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400" },
        { name: "Hydro Flask 32oz Water Bottle", description: "Insulated stainless steel bottle that keeps water cold for 24 hours.", category: "hydration", priceRange: "$", link: "https://www.hydroflask.com", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400" },
        { name: "Atomic Habits by James Clear", description: "The #1 bestselling book on building good habits and breaking bad ones.", category: "books", priceRange: "$", link: "https://jamesclear.com/atomic-habits", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" },
        { name: "Theragun Mini Massage Gun", description: "Portable percussion therapy device for muscle recovery after workouts.", category: "recovery", priceRange: "$$", link: "https://www.therabody.com", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400" },
        { name: "Yoga Mat — Liforme", description: "Premium alignment yoga mat with unique grip and eco-friendly materials.", category: "fitness-equipment", priceRange: "$$", link: "https://www.liforme.com", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400" },
        { name: "Oura Ring Gen 3", description: "Smart ring that tracks sleep, activity, and readiness with medical-grade sensors.", category: "fitness-tracker", priceRange: "$$$", link: "https://ouraring.com", image: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=400" },
        { name: "Calm Premium Subscription", description: "Meditation, sleep stories, and relaxation app with masterclasses by experts.", category: "mental-health", priceRange: "$$", link: "https://www.calm.com", image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400" },
    ]
    for (const product of productData) {
        await prisma.product.create({ data: product })
    }
    console.log(`🛍️  Created ${productData.length} products`)

    // ─── Summary ─────────────────────────────────────────────────
    console.log("\n✅ Seed completed successfully!")
    console.log("────────────────────────────────")
    console.log(`  👤 1 demo user (demo@laif.app / demo1234)`)
    console.log(`  📋 1 user profile`)
    console.log(`  🎯 ${goalData.length} goals`)
    console.log(`  ✅ ${habitData.length} habits`)
    console.log(`  🏃 ${activityData.length} activities`)
    console.log(`  😊 ${moodData.length} mood entries`)
    console.log(`  💡 ${suggestionData.length} AI suggestions`)
    console.log(`  🛍️  ${productData.length} products`)
    console.log("────────────────────────────────")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error("❌ Seed failed:", e)
        await prisma.$disconnect()
        process.exit(1)
    })
