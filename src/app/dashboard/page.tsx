import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session) {
        redirect("/auth/signin")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-gray-900">
                            <span className="text-blue-600">LAif</span> Dashboard
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Welcome, <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                            </span>
                            {session.user?.image && (
                                <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <form action={async () => {
                                "use server"
                                const { signOut } = await import("@/auth")
                                await signOut({ redirectTo: "/" })
                            }}>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Hello, {session.user?.name?.split(" ")[0] || "there"}! 👋
                    </h2>
                    <p className="text-gray-600">
                        Your AI-powered lifestyle improvement journey starts here.
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-3xl mb-2">🎯</div>
                        <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
                        <p className="text-sm text-gray-500">0 active goals</p>
                        <p className="text-xs text-blue-600 mt-2">Coming soon</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-3xl mb-2">💡</div>
                        <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
                        <p className="text-sm text-gray-500">0 suggestions</p>
                        <p className="text-xs text-blue-600 mt-2">Coming soon</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-3xl mb-2">🏃</div>
                        <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
                        <p className="text-sm text-gray-500">0 logged today</p>
                        <p className="text-xs text-blue-600 mt-2">Coming soon</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-3xl mb-2">😊</div>
                        <h3 className="text-lg font-semibold text-gray-900">Mood</h3>
                        <p className="text-sm text-gray-500">No entries yet</p>
                        <p className="text-xs text-blue-600 mt-2">Coming soon</p>
                    </div>
                </div>

                {/* Auth Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Authentication Working!</h3>
                    <p className="text-green-700">
                        You&apos;re successfully signed in. The dashboard features will be built in the next phase.
                    </p>
                    <div className="mt-4 text-sm text-green-600">
                        <p><strong>Signed in as:</strong> {session.user?.email}</p>
                        <p><strong>Provider:</strong> {session.user?.image ? "Google/GitHub OAuth" : "Credentials"}</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
