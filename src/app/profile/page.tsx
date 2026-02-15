import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/auth/signin")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
    })

    if (!user) {
        redirect("/auth/signin")
    }

    const profile = user.profile

    const getInitials = (name: string | null) => {
        if (!name) return "?"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const formatLabel = (value: string | null | undefined, fallback = "Not set") => {
        if (!value) return fallback
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                            <span className="text-blue-600">LAif</span>
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8">
                    <div className="flex items-center gap-6">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt="Profile"
                                className="w-20 h-20 rounded-full ring-4 ring-blue-100"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-100">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {user.name || "User"}
                            </h1>
                            <p className="text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </p>
                        </div>
                        <Link
                            href="/profile/edit"
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Edit Profile
                        </Link>
                    </div>
                </div>

                {/* Profile Details */}
                {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Personal Info
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Age</span>
                                    <span className="font-semibold text-gray-900">{profile.age ?? "—"}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Gender</span>
                                    <span className="font-semibold text-gray-900">{formatLabel(profile.gender)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Body Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Height</span>
                                    <span className="font-semibold text-gray-900">
                                        {profile.height ? `${profile.height} cm` : "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Weight</span>
                                    <span className="font-semibold text-gray-900">
                                        {profile.weight ? `${profile.weight} kg` : "—"}
                                    </span>
                                </div>
                                {profile.height && profile.weight && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">BMI</span>
                                        <span className="font-semibold text-blue-600">
                                            {(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Activity & Sleep
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Activity Level</span>
                                    <span className="font-semibold text-gray-900">{formatLabel(profile.activityLevel)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600">Sleep Goal</span>
                                    <span className="font-semibold text-gray-900">
                                        {profile.sleepGoal ? `${profile.sleepGoal} hours` : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Budget
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600">Health Budget</span>
                                    <span className="font-semibold text-gray-900">{formatLabel(profile.budget)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Profile Yet</h3>
                        <p className="text-gray-500 mb-6">Complete your profile to get personalized AI suggestions.</p>
                        <Link
                            href="/onboarding"
                            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Complete Setup
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
