import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

// Try primary model, fall back to alternatives if unavailable
const MODEL_OPTIONS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]

export function getModel(modelIndex = 0) {
    const modelName = MODEL_OPTIONS[modelIndex] || MODEL_OPTIONS[0]
    return { model: genAI.getGenerativeModel({ model: modelName }), modelName }
}

// ---------- Server-side in-memory cache ----------
// Caches AI responses by prompt key for 5 minutes to avoid redundant API calls
const responseCache = new Map<string, { text: string; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached(key: string): string | null {
    const entry = responseCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        responseCache.delete(key)
        return null
    }
    return entry.text
}

function setCache(key: string, text: string) {
    responseCache.set(key, { text, timestamp: Date.now() })
    // Evict old entries (keep cache bounded)
    if (responseCache.size > 50) {
        const oldest = Array.from(responseCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
        if (oldest) responseCache.delete(oldest[0])
    }
}

// ---------- Request throttle ----------
// Prevents requests from firing faster than once per 4 seconds (server-wide)
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL_MS = 4000

async function throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - lastRequestTime
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
        const waitMs = MIN_REQUEST_INTERVAL_MS - elapsed
        await new Promise((r) => setTimeout(r, waitMs))
    }
    lastRequestTime = Date.now()
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

    // If no profile data, provide a default context
    if (parts.length === 0) {
        return "No profile data available — give general advice for a healthy adult"
    }
    return parts.join(", ")
}

const SYSTEM_INSTRUCTION = `You are LAif, an AI lifestyle coach. You give concise, actionable, personalized health and wellness advice. 
Keep responses friendly, motivating, and evidence-based. 
Always consider the user's profile data when giving advice.
Format responses in clear, short paragraphs. Use emojis sparingly for warmth.
Never diagnose medical conditions. Recommend consulting professionals for medical concerns.`

function parseApiError(error: unknown): { message: string; isRateLimit: boolean } {
    const err = error as { status?: number; statusText?: string; message?: string; errorDetails?: unknown[] }

    if (err?.status === 429) {
        return { message: "AI is busy right now — please wait about 30 seconds and try again.", isRateLimit: true }
    }
    if (err?.status === 403 || err?.status === 401) {
        return { message: "AI service is not configured. Please contact the administrator.", isRateLimit: false }
    }
    if (err?.status === 400) {
        return { message: "Request was too complex — try a shorter or simpler question.", isRateLimit: false }
    }
    if (err?.status === 404) {
        return { message: "AI model not available — retrying with alternative model...", isRateLimit: false }
    }

    // Check for common Gemini error messages
    const msg = err?.message || ""
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
        return { message: "AI service is not configured properly. Please check the GEMINI_API_KEY.", isRateLimit: false }
    }
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        return { message: "AI is busy right now — please wait about 30 seconds and try again.", isRateLimit: true }
    }
    if (msg) return { message: msg, isRateLimit: false }
    return { message: "An unexpected error occurred with the AI service.", isRateLimit: false }
}

// Retry with model fallback only (no long waits that exceed Vercel timeout)
async function callWithRetry(
    fn: (modelIndex: number) => Promise<string>,
    maxRetries = 1
): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await throttle()
            return await fn(0) // Try primary model
        } catch (error) {
            const err = error as { status?: number; message?: string }
            const isRateLimit = err?.status === 429 ||
                String(err?.message || "").includes("RESOURCE_EXHAUSTED") ||
                String(err?.message || "").includes("quota")
            const isModelNotFound = err?.status === 404

            // If model not found, try the next model
            if (isModelNotFound && attempt < MODEL_OPTIONS.length - 1) {
                console.log(`Model not found, trying ${MODEL_OPTIONS[attempt + 1]}...`)
                try {
                    return await fn(attempt + 1)
                } catch {
                    // Fall through to retry logic
                }
            }

            // If rate limited, do ONE quick retry after 1 second (safe for Vercel timeout)
            if (isRateLimit && attempt < maxRetries) {
                console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in 1s...`)
                await new Promise((r) => setTimeout(r, 1000))
                continue
            }

            // No more retries — throw
            throw error
        }
    }
    throw new Error("Failed after all retry attempts")
}

export async function generateSuggestions(
    profile: UserContext,
    type: "general" | "diet" | "exercise" | "product" | "all"
): Promise<string> {
    // Check API key before making any call
    if (!apiKey) {
        throw new Error("AI service is not configured. GEMINI_API_KEY is missing.")
    }

    // Check cache first
    const cacheKey = `suggestions:${type}:${JSON.stringify(profile)}`
    const cached = getCached(cacheKey)
    if (cached) {
        console.log(`Cache hit for ${type} suggestions`)
        return cached
    }

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
        const result = await callWithRetry(async (modelIndex: number) => {
            const { model } = getModel(modelIndex)
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompts[type] || prompts.general }] }],
                systemInstruction: SYSTEM_INSTRUCTION,
            })
            return response.response.text()
        })
        setCache(cacheKey, result)
        return result
    } catch (error) {
        console.error("Gemini API error:", error)
        const parsed = parseApiError(error)
        if (parsed.isRateLimit) {
            // Throw a special error so the action layer can return cached DB suggestions instead
            const rateLimitError = new Error(parsed.message)
                ; (rateLimitError as Error & { isRateLimit: boolean }).isRateLimit = true
            throw rateLimitError
        }
        throw new Error(parsed.message)
    }
}

export async function askLAif(
    question: string,
    profile: UserContext
): Promise<string> {
    // Check API key before making any call
    if (!apiKey) {
        throw new Error("AI service is not configured. GEMINI_API_KEY is missing.")
    }

    // Check cache for this exact question
    const cacheKey = `ask:${question.toLowerCase().trim()}`
    const cached = getCached(cacheKey)
    if (cached) {
        console.log("Cache hit for question")
        return cached
    }

    const context = buildProfileContext(profile)

    try {
        const result = await callWithRetry(async (modelIndex: number) => {
            const { model } = getModel(modelIndex)
            const response = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: `User profile: ${context}\n\nUser question: ${question}` }],
                }],
                systemInstruction: SYSTEM_INSTRUCTION,
            })
            return response.response.text()
        })
        setCache(cacheKey, result)
        return result
    } catch (error) {
        console.error("Gemini API error:", error)
        const parsed = parseApiError(error)
        if (parsed.isRateLimit) {
            const rateLimitError = new Error(parsed.message)
                ; (rateLimitError as Error & { isRateLimit: boolean }).isRateLimit = true
            throw rateLimitError
        }
        throw new Error(parsed.message)
    }
}
