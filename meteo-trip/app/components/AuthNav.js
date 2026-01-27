'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthNav() {
    const [user, setUser] = useState(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        fetchUser()

        // Écouter les changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.push('/')
        router.refresh()
    }

    if (!user) {
        return (
            <div className="flex gap-4 items-center">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                    Connexion
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5">
                    Inscription
                </Link>
            </div>
        )
    }

    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Utilisateur'

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full transition border border-gray-200"
            >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {username[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700">{username}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-gray-200 bg-white/50">
                        <p className="text-xs text-gray-500">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => setShowDropdown(false)}
                        >
                            <User className="w-4 h-4" />
                            Mes itinéraires
                        </Link>
                        <Link
                            href="/change-password"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => setShowDropdown(false)}
                        >
                            🔑 Changer mot de passe
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
