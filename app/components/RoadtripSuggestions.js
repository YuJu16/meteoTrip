'use client'
import { useState } from 'react'
import { Sparkles, MapPin, Calendar, Clock, Loader2, X } from 'lucide-react'

export default function RoadtripSuggestions({ onUseSuggestion }) {
    const [isOpen, setIsOpen] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)

    const generateSuggestions = async () => {
        setLoading(true)
        setIsOpen(true)
        try {
            console.log('Appel API roadtrip-suggestions...')
            const res = await fetch('/api/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })

            console.log('Réponse reçue, status:', res.status)
            const data = await res.json()
            console.log('Données reçues:', data)

            setSuggestions(data.suggestions || [])
        } catch (error) {
            console.error('Erreur complète:', error)
            alert('Erreur lors de la génération des suggestions: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUseSuggestion = (suggestion) => {
        onUseSuggestion(suggestion)
        setIsOpen(false)
    }

    return (
        <>
            {/* Bouton pour ouvrir */}
            <button
                type="button"
                onClick={generateSuggestions}
                disabled={loading}
                className="w-full mb-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-semibold transition disabled:opacity-50 group"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Génération en cours...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        ✨ Besoin d'inspiration ?
                    </>
                )}
            </button>

            {/* Modal avec suggestions */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-12 duration-500 border border-white/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-8 py-6 flex justify-between items-center z-50">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                    <Sparkles className="w-8 h-8 text-indigo-500" />
                                    Inspirations de Roadtrip
                                </h2>
                                <p className="text-gray-500 mt-2 text-base">Nos suggestions personnalisées générées par l'IA pour votre prochaine aventure</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            >
                                <X className="w-6 h-6 text-gray-500 hover:text-gray-800" />
                            </button>
                        </div>

                        {/* Suggestions */}
                        <div className="p-8">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                                    </div>
                                    <p className="text-gray-600 mt-6 text-lg font-medium">L'IA prépare vos itinéraires...</p>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-500 text-lg">Aucune suggestion disponible pour le moment.</p>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-2 gap-8">
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="group relative bg-white rounded-2xl p-8 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 flex flex-col overflow-hidden"
                                        >
                                            {/* Décoration d'arrière-plan subtile */}
                                            <div className="absolute -top-6 -right-6 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:rotate-12">
                                                <Sparkles className="w-32 h-32 text-indigo-50" />
                                            </div>

                                            <div className="relative z-10 flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-700 transition-colors duration-300">
                                                    {suggestion.title}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm font-medium text-gray-600">
                                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                        {suggestion.duration}
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                        {suggestion.bestPeriod}
                                                    </div>
                                                </div>

                                                <p className="text-gray-600 leading-relaxed mb-8 text-base group-hover:text-gray-700">
                                                    {suggestion.description}
                                                </p>

                                                <div className="space-y-3 mb-8">
                                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                                                        Étapes principales
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestion.destinations.map((dest, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 group-hover:border-indigo-200 group-hover:text-indigo-700 group-hover:bg-indigo-50/30 transition-all duration-300"
                                                            >
                                                                <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                                                                {dest}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleUseSuggestion(suggestion)}
                                                className="relative z-10 w-full bg-white text-indigo-600 border-2 border-indigo-100 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white py-4 rounded-xl font-bold transition-all duration-300 transform"
                                            >
                                                Utiliser cet itinéraire
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
