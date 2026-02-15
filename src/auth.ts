import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                })

                if (!user || !user.password) {
                    return null
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!passwordMatch) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.name = token.name
                session.user.email = token.email as string
                session.user.image = token.picture
                session.user.hasProfile = token.hasProfile as boolean
            }
            return session
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                // Check if user has a profile on first sign-in
                const profile = await prisma.userProfile.findUnique({
                    where: { userId: user.id as string },
                    select: { id: true },
                })
                token.hasProfile = !!profile
            }
            // Refresh hasProfile on session update
            if (trigger === "update" && token.id) {
                const profile = await prisma.userProfile.findUnique({
                    where: { userId: token.id as string },
                    select: { id: true },
                })
                token.hasProfile = !!profile
            }
            return token
        },
    },
})
