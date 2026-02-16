import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

// Edge-compatible auth config (no Prisma, no bcrypt)
// Used by middleware — full auth logic is in auth.ts
export default {
    pages: {
        signIn: "/auth/signin",
    },
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        // Credentials provider stub for middleware — actual authorize logic is in auth.ts
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: () => null,
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.pathname.startsWith("/auth")
            const isProtectedRoute =
                nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/goals") ||
                nextUrl.pathname.startsWith("/suggestions") ||
                nextUrl.pathname.startsWith("/profile") ||
                nextUrl.pathname.startsWith("/onboarding") ||
                nextUrl.pathname.startsWith("/schedule") ||
                nextUrl.pathname.startsWith("/wellness") ||
                nextUrl.pathname.startsWith("/analytics") ||
                nextUrl.pathname.startsWith("/automations") ||
                nextUrl.pathname.startsWith("/products")

            if (isProtectedRoute && !isLoggedIn) {
                return false // redirects to signIn page
            }

            if (isAuthPage && isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }

            return true
        },
    },
} satisfies NextAuthConfig
