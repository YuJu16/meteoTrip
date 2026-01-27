'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Check, AlertCircle } from 'lucide-react'

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [user, setUser] = useState(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
            }
        }
        fetchUser()
    }, [])

    const handleUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (newPassword !== confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas")
            setLoading(false)
            return
        }

        if (newPassword.length < 6) {
            setError("Le nouveau mot de passe doit contenir au moins 6 caractères")
            setLoading(false)
            return
        }

        // Vérifier le mot de passe actuel en essayant de se connecter
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        })

        if (signInError) {
            setError("Le mot de passe actuel est incorrect")
            setLoading(false)
            return
        }

        // Mettre à jour le mot de passe
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
        } else {
            alert('✅ Mot de passe modifié avec succès !')
            router.push('/dashboard')
        }
    }

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="text-gray-500">Chargement...</div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
            <div className="max-w-md w-full glass rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 text-blue-600">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Changer mon mot de passe
                    </h1>
                    <p className="text-gray-500 mt-2">Mettez à jour votre mot de passe</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    {/* Mot de passe actuel */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Mot de passe actuel</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Nouveau mot de passe */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Nouveau mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Confirmer nouveau mot de passe */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Confirmer le nouveau mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl font-bold hover:shadow-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? (
                            'Modification en cours...'
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Modifier le mot de passe
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
