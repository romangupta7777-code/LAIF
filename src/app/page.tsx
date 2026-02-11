export default function HomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">
                    Welcome to <span className="text-blue-600">LAif</span>
                </h1>
                <p className="text-xl text-gray-700 mb-8">
                    Your AI-Powered Lifestyle Improvement Companion
                </p>
                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Get Started
                    </button>
                    <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
}
