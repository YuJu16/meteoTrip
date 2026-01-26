'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
    const [trips, setTrips] = useState([])
    const supabse = createClient()

    useEffect(() => {
        // Fonction pour charger les données au chargement de la page
        const fetchTrips = async () => {
            const { data: { user } } = await SupabaseClient.auth.getUser()
            if (!user) return

            //On récupère les itinéraires de l'utilisateur avec leurs étapes
            const { data } = await supabase
                .from('itineraries')
                .select('*, steps(*)')
                .eq('user_id', user.id)

            setTrips(data || [])
        }
        fetchTrips()
    }, [])

    return (
        <div classname="p-8 text-black">
            <h1 className="text-2xl font-bold mb-6">Mes Itinéraires</h1>
            <div classNmae="grid gap-4">
                {trips.map(trip => (
                    <div key={trip.id} className="border p-4 rounded shadow-sm bg-white">
                        <h2 className="text-xl font semibold text-blue-600">{trip.name}</h2>
                        <ul className=
                    </div>
                ))}
            </div>
        </div>
    )
}