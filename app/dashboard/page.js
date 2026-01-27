'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { MapPin, Calendar, Cloud, Plane, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Composant Carrousel Météo
function WeatherCarousel({ dailyWeather }) {
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 3
    const totalPages = Math.ceil(dailyWeather.length / itemsPerPage)

    const currentWeather = dailyWeather.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1)
        }
    }

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1)
        }
    }

    return (
        <div className="mt-2">
            {/* Navigation et indicateur */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mb-1">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="p-1 rounded-md hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        aria-label="Page précédente"
                    >
                        <ChevronLeft className="w-4 h-4 text-indigo-600" />
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all ${i === currentPage
                                        ? 'w-4 bg-indigo-600'
                                        : 'w-1 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        className="p-1 rounded-md hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        aria-label="Page suivante"
                    >
                        <ChevronRight className="w-4 h-4 text-indigo-600" />
                    </button>
                </div>
            )}

            {/* Affichage des jours (3 max) */}
            <div className="space-y-1">
                {currentWeather.map((day, idx) => (
                    <div
                        key={currentPage * itemsPerPage + idx}
                        className="flex items-center justify-between text-xs bg-indigo-50 px-2 py-1.5 rounded-md transition-all animate-in fade-in slide-in-from-right duration-200"
                    >
                        <span className="text-gray-600 font-medium">
                            {new Date(day.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short'
                            })}
                        </span>
                        <span
                            className={`flex items-center gap-1 ${day.weather === "À prévoir"
                                    ? "text-gray-400 italic"
                                    : "text-indigo-600 font-medium"
                                }`}
                        >
                            <Cloud className="w-3 h-3" />
                            {day.weather}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}


export default function Dashboard() {
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const handleDelete = async (tripId) => {
        if (!confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) return

        // Si c'est un itinéraire invité (localStorage)
        if (tripId?.toString().startsWith('guest-')) {
            localStorage.removeItem('guest_trip')
            setTrips(trips.filter(t => t.id !== tripId))
            return
        }

        // Sinon, supprimer de Supabase
        const { error } = await supabase
            .from('itineraries')
            .delete()
            .eq('id', tripId)

        if (error) {
            alert('Erreur lors de la suppression : ' + error.message)
        } else {
            setTrips(trips.filter(t => t.id !== tripId))
        }
    }

    useEffect(() => {
        // Fonction pour charger les données au chargement de la page
        const fetchTrips = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // Charger l'itinéraire invité depuis localStorage
            const guestTripData = localStorage.getItem('guest_trip')
            let allTrips = []

            if (guestTripData) {
                try {
                    const guestTrip = JSON.parse(guestTripData)
                    // Valider que l'itinéraire a des données valides
                    if (guestTrip.name && guestTrip.id && guestTrip.created_at) {
                        allTrips.push(guestTrip)
                    } else {
                        // Nettoyer localStorage si données invalides
                        console.warn('Itinéraire localStorage invalide, nettoyage...')
                        localStorage.removeItem('guest_trip')
                    }
                } catch (e) {
                    console.error('Erreur parsing guest trip:', e)
                    localStorage.removeItem('guest_trip')
                }
            }

            if (user) {
                //On récupère les itinéraires de l'utilisateur avec leurs étapes
                const { data } = await supabase
                    .from('itineraries')
                    .select('*, steps(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                // Filtrer les itinéraires qui ont un nom et une date valide
                const validTrips = (data || []).filter(trip => trip.name && trip.created_at)
                allTrips = [...allTrips, ...validTrips]
            }

            setTrips(allTrips)
            setLoading(false)
        }
        fetchTrips()
    }, [])

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-64px)] p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mes Itinéraires</h1>
                        <p className="text-gray-500 mt-1">Retrouvez tous vos voyages planifiés</p>
                    </div>
                    <Link
                        href="/create"
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200 flex items-center gap-2"
                    >
                        <Plane className="w-5 h-5" />
                        Nouveau Voyage
                    </Link>
                </div>

                {trips.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <Plane className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun itinéraire pour le moment</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">Commencez dès maintenant à planifier votre prochaine aventure et découvrez la météo qui vous attend !</p>
                        <Link href="/create" className="text-blue-600 font-semibold hover:underline">
                            Créer mon premier voyage &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {trips.map((trip, tripIndex) => (
                            <div key={trip.id || `trip-${tripIndex}`} className="glass rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 hover:-translate-y-1 group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">{trip.name}</h2>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                                            {trip.steps?.length || 0} étapes
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {trip.steps?.sort((a, b) => (a.step_order || 0) - (b.step_order || 0)).map((step, index) => (
                                            <div key={step.id || `step-${tripIndex}-${index}`} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-white/60 border border-gray-100">
                                                <div className="mt-1 min-w-[20px] h-5 flex items-center justify-center bg-blue-50 rounded-full text-blue-600 font-bold text-xs">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 flex items-center gap-1.5 truncat">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        {step.location_name}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(step.arrival_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                            {step.departure_date && step.departure_date !== step.arrival_date && (
                                                                <> → {new Date(step.departure_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Météo jour par jour - Carrousel 3 par 3 */}
                                                    {step.daily_weather && step.daily_weather.length > 0 ? (
                                                        <WeatherCarousel dailyWeather={step.daily_weather} />
                                                    ) : (
                                                        <div className="mt-2 flex items-center gap-1.5 text-gray-400 bg-gray-50 px-2 py-1 rounded-md w-fit">
                                                            <Cloud className="w-3.5 h-3.5" />
                                                            <span className="font-medium text-xs italic">Météo indisponible</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                                    <span>Créé le {new Date(trip.created_at).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => handleDelete(trip.id)}
                                        className="text-red-500 hover:text-red-700 font-medium transition opacity-0 group-hover:opacity-100"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}