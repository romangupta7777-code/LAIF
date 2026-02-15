export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
            {/* Minimal header with just the logo */}
            <header className="pt-8 pb-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    <span className="text-blue-600">LAif</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Your AI lifestyle companion</p>
            </header>
            {children}
        </div>
    )
}
