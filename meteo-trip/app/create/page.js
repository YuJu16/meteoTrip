'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MapPin, Calendar, Save, Plane, Loader2 } from 'lucide-react'
import RoadtripSuggestions from '../components/RoadtripSuggestions'

export default function CreateItinerary() {
    const supabase = createClient()
    const router = useRouter()

    // -- ÉTATS (States) --
    const [name, setName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [steps, setSteps] = useState([{
        location_name: '',
        arrival_date: '',
        departure_date: '',
        is_one_day: false
    }])
    const [loading, setLoading] = useState(false)
    const [citySuggestions, setCitySuggestions] = useState({}) // { stepIndex: [cities] }
    const [activeStepIndex, setActiveStepIndex] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Vérifier l'authentification au chargement
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
        }
        checkAuth()
    }, [])

    // -- FONCTION UTILISER SUGGESTION IA --
    const useSuggestion = (suggestion) => {
        // Pré-remplir le nom du voyage
        setName(suggestion.title)

        // Créer les étapes à partir des destinations
        const newSteps = suggestion.destinations.map(dest => ({
            location_name: dest,
            arrival_date: '',
            departure_date: '',
            is_one_day: false
        }))
        setSteps(newSteps)
    }

    // -- LOGIQUE DES ÉTAPES --
    const addStep = () => {
        // Limiter à 1 destination pour les utilisateurs non connectés
        if (!isAuthenticated && steps.length >= 1) {
            alert("Connectez-vous pour ajouter plusieurs destinations !")
            return
        }

        setSteps([...steps, {
            location_name: '',
            arrival_date: '',
            departure_date: '',
            is_one_day: false
        }])
    }

    const removeStep = (index) => {
        const newSteps = steps.filter((_, i) => i !== index)
        setSteps(newSteps)
    }

    const updateStep = (index, field, value) => {
        const newSteps = [...steps]
        newSteps[index][field] = value
        setSteps(newSteps)
    }

    // -- FONCTION RECHERCHE VILLE (Autocomplete) --
    const searchCities = async (query, stepIndex) => {
        if (!query || query.length < 2) {
            setCitySuggestions(prev => ({ ...prev, [stepIndex]: [] }))
            return
        }

        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
        if (!apiKey) return

        try {
            const res = await fetch(
                `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`
            )
            const cities = await res.json()
            setCitySuggestions(prev => ({ ...prev, [stepIndex]: cities }))
        } catch (err) {
            console.error('Erreur recherche ville:', err)
        }
    }

    const selectCity = (stepIndex, city) => {
        const cityName = `${city.name}, ${city.country}`
        updateStep(stepIndex, 'location_name', cityName)
        setCitySuggestions(prev => ({ ...prev, [stepIndex]: [] }))
        setActiveStepIndex(null)
    }

    // -- FONCTION MÉTÉO (Appel à Weather API) --
    const fetchWeatherForStep = async (city, date) => {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
        if (!apiKey) {
            return "Clé API météo manquante"
        }

        try {
            const res = await fetch(
                `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&dt=${date}&lang=fr`
            )
            const data = await res.json()

            if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
                return data.forecast.forecastday[0].day.condition.text
            }
            return "Météo non disponible"
        } catch (err) {
            console.error('Erreur météo:', err)
            return "Erreur météo"
        }
    }

    // -- FONCTION MÉTÉO MULTI-JOURS (Plage de dates) --
    const fetchWeatherForDateRange = async (city, startDate, endDate) => {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
        if (!apiKey || !city || !startDate) return []

        // Si pas de date de fin, utiliser la date de début
        const effectiveEndDate = endDate || startDate

        const dailyWeather = []
        const start = new Date(startDate)
        const end = new Date(effectiveEndDate)

        // Limiter à 3 jours max (limite API gratuite pour prévisions)
        const maxApiDays = 3
        let dayCount = 0

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), dayCount++) {
            const dateStr = d.toISOString().split('T')[0]

            // Si au-delà de 3 jours, ajouter "À prévoir" sans appeler l'API
            if (dayCount >= maxApiDays) {
                dailyWeather.push({
                    date: dateStr,
                    weather: 'À prévoir'
                })
                continue
            }

            // Pour les 3 premiers jours, appeler l'API
            try {
                const res = await fetch(
                    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&dt=${dateStr}&lang=fr`
                )
                const data = await res.json()

                if (data.forecast?.forecastday?.[0]) {
                    dailyWeather.push({
                        date: dateStr,
                        weather: data.forecast.forecastday[0].day.condition.text
                    })
                } else {
                    dailyWeather.push({ date: dateStr, weather: 'Non disponible' })
                }
            } catch (err) {
                console.error(`Erreur météo pour ${dateStr}:`, err)
                dailyWeather.push({ date: dateStr, weather: 'Non disponible' })
            }
        }

        return dailyWeather
    }

    // -- SAUVEGARDE FINALE --
    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Récupérer la météo pour toutes les étapes (multi-jours)
            const stepsWithWeather = await Promise.all(
                steps.map(async (step) => {
                    const departureDate = step.is_one_day ? step.arrival_date : (step.departure_date || step.arrival_date)
                    const dailyWeather = await fetchWeatherForDateRange(step.location_name, step.arrival_date, departureDate)

                    // Pour compatibilité, garder weather_desc (premier jour)
                    const weather_desc = dailyWeather[0]?.weather || 'Non disponible'

                    return {
                        ...step,
                        departure_date: departureDate,
                        weather_desc,  // Pour affichage simple
                        daily_weather: dailyWeather  // Pour affichage détaillé
                    }
                })
            )

            // MODE INVITÉ : sauvegarder dans localStorage
            if (!user) {
                const hasTrip = localStorage.getItem('guest_trip')
                if (hasTrip) {
                    alert("Limite atteinte ! Connectez-vous pour un accès illimité.")
                    setLoading(false)
                    return
                }

                const guestItinerary = {
                    id: 'guest-' + Date.now(),
                    name: name,
                    first_name: firstName,
                    last_name: lastName,
                    steps: stepsWithWeather,
                    created_at: new Date().toISOString()
                }

                localStorage.setItem('guest_trip', JSON.stringify(guestItinerary))
                alert("Itinéraire créé avec succès !")
                router.push('/dashboard')
                return
            }

            const { data: itinData, error: itinError } = await supabase
                .from('itineraries')
                .insert([{
                    name: name,
                    first_name: firstName,
                    last_name: lastName,
                    user_id: user?.id
                }])
                .select()

            if (itinError) {
                alert("Erreur itinéraire : " + itinError.message)
                setLoading(false)
                return
            }

            const itineraryId = itinData[0].id
            const finalSteps = stepsWithWeather.map((s, index) => ({
                itinerary_id: itineraryId,
                location_name: s.location_name,
                arrival_date: s.arrival_date,
                departure_date: s.departure_date,
                step_order: index,
                weather_desc: s.weather_desc,
                daily_weather: s.daily_weather
            }))

            const { error: stepError } = await supabase.from('steps').insert(finalSteps)

            if (stepError) {
                alert("Erreur étapes : " + stepError.message)
                setLoading(false)
            } else {
                alert("Itinéraire créé avec succès !")
                router.push('/dashboard')
            }
        } catch (error) {
            alert("Erreur : " + error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] p-6 flex justify-center items-start pt-12">
            <div className="max-w-3xl w-full glass rounded-2xl shadow-xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 text-blue-600">
                        <Plane className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Nouveau Voyage
                    </h1>
                    <p className="text-gray-500 mt-2">Configurez votre itinéraire et découvrez la météo</p>
                </div>

                {/* Suggestions IA */}
                <RoadtripSuggestions onUseSuggestion={useSuggestion} />

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Informations personnelles */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-700">👤 Vos informations</label>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                placeholder="Prénom"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <input
                                placeholder="Nom"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Nom de l'itinéraire */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            Nom du voyage
                        </label>
                        <input
                            placeholder="Ex: Roadtrip en Italie"
                            className="w-full p-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Étapes */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                            <span>Étapes du voyage</span>
                            <span className="text-xs font-normal text-gray-500">{steps.length} étape(s)</span>
                        </label>

                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={index} className="group relative flex gap-3 p-4 bg-white/60 rounded-xl border border-gray-200 hover:border-blue-300 transition shadow-sm">
                                    <div className="flex-1 grid md:grid-cols-2 gap-3">
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                placeholder="Ville (ex: Rome, Italy)"
                                                className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                value={step.location_name}
                                                onChange={(e) => {
                                                    updateStep(index, 'location_name', e.target.value)
                                                    searchCities(e.target.value, index)
                                                    setActiveStepIndex(index)
                                                }}
                                                required
                                            />
                                            {/* Autocomplete dropdown */}
                                            {activeStepIndex === index && citySuggestions[index]?.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                                                    {citySuggestions[index].map((city, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm"
                                                            onClick={() => selectCity(index, city)}
                                                        >
                                                            <div className="font-medium">{city.name}</div>
                                                            <div className="text-xs text-gray-500">{city.region}, {city.country}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    placeholder="Date d'arrivée"
                                                    className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                    value={step.arrival_date}
                                                    onChange={(e) => {
                                                        updateStep(index, 'arrival_date', e.target.value)
                                                        if (step.is_one_day) {
                                                            updateStep(index, 'departure_date', e.target.value)
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    checked={step.is_one_day}
                                                    onChange={(e) => {
                                                        updateStep(index, 'is_one_day', e.target.checked)
                                                        if (e.target.checked) {
                                                            updateStep(index, 'departure_date', step.arrival_date)
                                                        }
                                                    }}
                                                />
                                                Séjour d'un jour uniquement
                                            </label>

                                            {!step.is_one_day && (
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        placeholder="Date de départ"
                                                        className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                        value={step.departure_date}
                                                        min={step.arrival_date}
                                                        onChange={(e) => updateStep(index, 'departure_date', e.target.value)}
                                                        required={!step.is_one_day}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {steps.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeStep(index)}
                                            className="text-gray-400 hover:text-red-500 p-2 transition opacity-0 group-hover:opacity-100"
                                            title="Supprimer l'étape"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={addStep}
                            disabled={!isAuthenticated && steps.length >= 1}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                            title={!isAuthenticated && steps.length >= 1 ? "Connectez-vous pour ajouter plusieurs destinations" : ""}
                        >
                            <Plus className="w-5 h-5" />
                            {!isAuthenticated && steps.length >= 1 ? "Connectez-vous pour plus" : "Ajouter une étape"}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Enregistrer l'itinéraire
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
