import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export function getModel() {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
}

interface UserContext {
    age?: number | null
    gender?: string | null
    height?: number | null
    weight?: number | null
    activityLevel?: string | null
    sleepGoal?: number | null
    budget?: string | null
}

function buildProfileContext(profile: UserContext): string {
    const parts: string[] = []
    if (profile.age) parts.push(`Age: ${profile.age}`)
    if (profile.gender) parts.push(`Gender: ${profile.gender}`)
    if (profile.height) parts.push(`Height: ${profile.height}cm`)
    if (profile.weight) parts.push(`Weight: ${profile.weight}kg`)
    if (profile.height && profile.weight) {
        const bmi = profile.weight / Math.pow(profile.height / 100, 2)
        parts.push(`BMI: ${bmi.toFixed(1)}`)
    }
    if (profile.activityLevel) parts.push(`Activity Level: ${profile.activityLevel}`)
    if (profile.sleepGoal) parts.push(`Sleep Goal: ${profile.sleepGoal} hours`)
    if (profile.budget) parts.push(`Health Budget: ${profile.budget}`)
    return parts.join(", ")
}

const SYSTEM_INSTRUCTION = `You are LAif, an AI lifestyle coach. You give concise, actionable, personalized health and wellness advice. 
Keep responses friendly, motivating, and evidence-based. 
Always consider the user's profile data when giving advice.
Format responses in clear, short paragraphs. Use emojis sparingly for warmth.
Never diagnose medical conditions. Recommend consulting professionals for medical concerns.`

function parseApiError(error: unknown): string {
    const err = error as { status?: number; statusText?: string; message?: string }
    if (err?.status === 429) {
        return "Rate limit reached — please wait 30 seconds and try again."
    }
    if (err?.status === 403 || err?.status === 401) {
        return "API key is invalid or not authorized. Please check your GEMINI_API_KEY."
    }
    if (err?.status === 400) {
        return "Bad request — the API rejected the request. Try a shorter question."
    }
    if (err?.message) return err.message
    return "An unexpected error occurred with the AI service."
}

async function callWithRetry(fn: () => Promise<string>, retries = 1): Promise<string> {
    try {
        return await fn()
    } catch (error) {
        const err = error as { status?: number }
        if (err?.status === 429 && retries > 0) {
            console.log("Rate limited, retrying in 2s...")
            await new Promise((r) => setTimeout(r, 2000))
            return callWithRetry(fn, retries - 1)
        }
        throw error
    }
}

export async function generateSuggestions(
    profile: UserContext,
    type: "general" | "diet" | "exercise" | "product" | "all"
): Promise<string> {
    const model = getModel()
    const context = buildProfileContext(profile)

    const prompts: Record<string, string> = {
        general: `Based on this user's profile (${context}), give 3 personalized lifestyle improvement suggestions. Each should be a short paragraph with a title. Focus on practical, daily actions.`,
        diet: `Based on this user's profile (${context}), provide 4 personalized diet and nutrition recommendations. Include specific meal ideas, portion guidance, and nutrition tips tailored to their body stats and activity level. Format each as a titled suggestion.`,
        exercise: `Based on this user's profile (${context}), suggest 4 personalized exercise and activity recommendations. Consider their activity level and body stats. Include specific workouts, duration, and frequency. Format each as a titled suggestion.`,
        product: `Based on this user's profile (${context}), recommend 4 health and wellness products that would benefit them. Consider their budget (${profile.budget || "moderate"}). Include supplements, fitness gear, apps, or wellness tools. Format each with product name, why it helps, and approximate price.`,
        all: `Based on this user's profile (${context}), provide a comprehensive lifestyle plan with:
1. 2 diet/nutrition tips
2. 2 exercise recommendations  
3. 2 wellness/lifestyle tips
4. 2 product suggestions (within their ${profile.budget || "moderate"} budget)
Keep each suggestion concise (2-3 sentences). Format with clear headings.`,
    }

    try {
        return await callWithRetry(async () => {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompts[type] || prompts.general }] }],
                systemInstruction: SYSTEM_INSTRUCTION,
            })
            return result.response.text()
        })
    } catch (error) {
        console.error("Gemini API error:", error)
        throw new Error(parseApiError(error))
    }
}

export async function askLAif(
    question: string,
    profile: UserContext
): Promise<string> {
    const model = getModel()
    const context = buildProfileContext(profile)

    try {
        return await callWithRetry(async () => {
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: `User profile: ${context}\n\nUser question: ${question}` }],
                }],
                systemInstruction: SYSTEM_INSTRUCTION,
            })
            return result.response.text()
        })
    } catch (error) {
        console.error("Gemini API error:", error)
        throw new Error(parseApiError(error))
    }
}

