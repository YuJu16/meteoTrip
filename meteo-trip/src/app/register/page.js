'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function CreateItinerary() {
    const supabase = createClient()

    // -- ÉTATS (States) --
    const [name, setName] = useState('')
    const [steps, setSteps] = useState([{ location_name: '', arrival_date: '' }])

    // -- LOGIQUE DES ÉTAPES --
    const addStep = () => {
        setSteps([...steps, { location_name: '', arrival_date: '' }])
    }

    const updateStep = (index, field, value) => {
        const newSteps = [...steps]
        newSteps[index][field] = value
        setSteps(newSteps)
    }

    // -- FONCTION MÉTÉO (Appel à Weather API) --
    const fetchWeatherForStep = async (city, date) => {
        // On utilise ta clé API stockée dans le .env.local
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
        try {
            // L'endpoint 'forecast' permet de demander la météo pour une date précise
            const res = await fetch(
                `https://api.weatherapi.com/1/v1/forecast.json?key=${apiKey}&q=${city}&dt=${date}&lang=fr`
            )
            const data = await res.json()
            // On récupère le texte météo (ex: "Partiellement nuageux")
            return data.forecast ? data.forecast.forecastday[0].day.condition.text : "Météo non disponible"
        } catch (err) {
            return "Erreur météo"
        }
    }

    // -- SAUVEGARDE FINALE --
    const handleSave = async (e) => {
        e.preventDefault()

        // 1. Récupérer l'utilisateur
        const { data: { user } } = await supabase.auth.getUser()

        // 2. Gestion des crédits (Règle : 1 seul si non connecté)
        if (!user) {
            const hasTrip = localStorage.getItem('guest_trip')
            if (hasTrip) {
                alert("Limite atteinte ! Connectez-vous pour un accès illimité.")
                return
            }
            localStorage.setItem('guest_trip', 'true')
        }

        // 3. Récupérer la météo pour chaque étape AVANT de sauvegarder
        // On utilise Promise.all pour que tous les appels API se fassent en même temps
        const stepsWithWeather = await Promise.all(
            steps.map(async (step) => {
                const weather = await fetchWeatherForStep(step.location_name, step.arrival_date)
                return { ...step, weather_desc: weather }
            })
        )

        // 4. Sauvegarde de l'itinéraire dans Supabase
        const { data: itinData, error: itinError } = await supabase
            .from('itineraries')
            .insert([{ name: name, user_id: user?.id }])
            .select()

        if (itinError) return alert("Erreur itinéraire : " + itinError.message)

        // 5. Sauvegarde des étapes avec leur description météo
        const itineraryId = itinData[0].id
        const finalSteps = stepsWithWeather.map((s, index) => ({
            itinerary_id: itineraryId,
            location_name: s.location_name,
            arrival_date: s.arrival_date,
            step_order: index,
            // On peut imaginer une colonne 'weather' dans ta table steps
            weather_desc: s.weather_desc
        }))

        const { error: stepError } = await supabase.from('steps').insert(finalSteps)

        if (stepError) alert("Erreur étapes : " + stepError.message)
        else alert("Itinéraire créé avec succès !")
    }

    return (
        <div className="p-10 text-black bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Nouveau Voyage</h1>
            <form onSubmit={handleSave} className="space-y-4">
                <input
                    placeholder="Nom du voyage"
                    className="border p-2 w-full rounded"
                    value={name} onChange={(e) => setName(e.target.value)}
                    required
                />

                {steps.map((step, index) => (
                    <div key={index} className="flex gap-2 border p-4 rounded bg-gray-50">
                        <input
                            placeholder="Ville"
                            className="border p-2 flex-1 rounded"
                            value={step.location_name}
                            onChange={(e) => updateStep(index, 'location_name', e.target.value)}
                            required
                        />
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={step.arrival_date}
                            onChange={(e) => updateStep(index, 'arrival_date', e.target.value)}
                            required
                        />
                    </div>
                ))}

                <div className="flex gap-4">
                    <button type="button" onClick={addStep} className="bg-gray-200 p-2 rounded px-4">
                        + Ajouter une étape
                    </button>
                    <button type="submit" className="bg-blue-600 text-white p-2 flex-1 rounded font-bold">
                        Enregistrer l'itinéraire
                    </button>
                </div>
            </form>
        </div>
    )
}