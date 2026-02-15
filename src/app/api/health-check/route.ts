import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const userCount = await prisma.user.count()
        return NextResponse.json({
            db: "connected",
            userCount,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                hasAuthSecret: !!process.env.AUTH_SECRET,
                hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
                hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
                hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
                nextAuthUrl: process.env.NEXTAUTH_URL || "not set",
                authUrl: process.env.AUTH_URL || "not set",
                nodeEnv: process.env.NODE_ENV,
            },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
            db: "error",
            error: message,
        }, { status: 500 })
    }
}
