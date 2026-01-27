import './globals.css'
import Link from 'next/link'
import Chatbox from './components/Chatbox'
import AuthNav from './components/AuthNav'

export const metadata = {
    title: 'Météo Trip',
    description: 'Planifiez vos itinéraires avec la météo',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen antialiased">
                {/* Navigation Bar */}
                {/* Navigation Bar */}
                <nav className="sticky top-0 z-50 glass shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="text-2xl">🌤️</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Météo Trip
                                </span>
                            </Link>

                            <div className="hidden md:flex gap-6 items-center">
                                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                                    Accueil
                                </Link>
                                <Link href="/create" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                                    Créer
                                </Link>
                                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                                    Mes Itinéraires
                                </Link>
                            </div>

                            {/* Auth Navigation Component */}
                            <AuthNav />
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main>{children}</main>

                {/* Chatbox flottante */}
                <Chatbox />
            </body>
        </html>
    )
}