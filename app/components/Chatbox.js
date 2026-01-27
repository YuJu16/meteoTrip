'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Users, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function Chatbox() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [user, setUser] = useState(null)
    const [userTrips, setUserTrips] = useState([])
    const [showShareMenu, setShowShareMenu] = useState(false)
    const messagesEndRef = useRef(null)
    const supabase = createClient()

    // Récupérer l'utilisateur et les messages au chargement
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                fetchUserTrips(user.id)
            }
        }
        fetchUser()
        fetchMessages()
    }, [])

    const fetchUserTrips = async (userId) => {
        const { data } = await supabase
            .from('itineraries')
            .select('id, name, created_at, steps(location_name, step_order, arrival_date, departure_date)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (data) setUserTrips(data)
    }

    // Écouter les nouveaux messages en temps réel
    useEffect(() => {
        const channel = supabase
            .channel('public-messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    // Si le message contient un itinéraire, on veut peut-être charger ses détails
                    // Pour l'instant on suppose que le payload contient tout ou qu'on le fetchera
                    // Idéalement, on fetcherait les détails de l'itinéraire ici si besoin
                    // Mais pour simplifier, on va juste ajouter le message et laisser le composant gérer l'affichage de base
                    // Si on veut afficher le nom du voyage, il faudrait peut-être faire un join ou fetcher séparément.

                    // Option simple: Fetcher le message complet avec les relations si possible, 
                    // mais realtime renvoie juste la row.
                    // On va tricher un peu et fetcher l'info manquante si c'est un itinéraire partagé
                    let newMessage = payload.new

                    if (newMessage.itinerary_id) {
                        const { data: tripData } = await supabase
                            .from('itineraries')
                            .select('name, steps(location_name, step_order, arrival_date, departure_date)')
                            .eq('id', newMessage.itinerary_id)
                            .single()

                        if (tripData) {
                            newMessage.trip_data = tripData // On attache manuellement pour l'affichage immédiat
                        }
                    }

                    setMessages(prev => [...prev, newMessage])
                    scrollToBottom()
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages' },
                (payload) => {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchMessages = async () => {
        // On récupère les messages ET les infos d'itinéraires liés
        // Supabase join syntax: itinerary:itineraries(...)
        const { data } = await supabase
            .from('messages')
            .select('*, itinerary:itineraries(name, steps(location_name, step_order, arrival_date, departure_date))')
            .order('created_at', { ascending: true })
            .limit(50)

        if (data) {
            // Aplatir un peu la structure pour faciliter l'usage
            const formattedData = data.map(msg => ({
                ...msg,
                trip_data: msg.itinerary // Rename for consistency
            }))
            setMessages(formattedData)
            setTimeout(scrollToBottom, 100)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = async () => {
        if (!message.trim() || !user) return

        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Anonyme'

        const { error } = await supabase
            .from('messages')
            .insert([{
                user_id: user.id,
                username: username,
                content: message.trim()
            }])

        if (!error) {
            setMessage('')
        } else {
            alert('Erreur lors de l\'envoi du message. Êtes-vous connecté ?')
        }
    }

    const handleShareTrip = async (trip) => {
        if (!user) return

        // 1. Rendre l'itinéraire public
        const { error: updateError } = await supabase
            .from('itineraries')
            .update({ is_public: true })
            .eq('id', trip.id)

        if (updateError) {
            console.error('Erreur update public:', updateError)
            alert('Erreur lors du partage.')
            return
        }

        // 2. Envoyer le message
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Anonyme'

        const { error: sendError } = await supabase
            .from('messages')
            .insert([{
                user_id: user.id,
                username: username,
                content: `Regardez mon itinéraire : ${trip.name} ! 🌍`,
                itinerary_id: trip.id
            }])

        if (!sendError) {
            setShowShareMenu(false)
        }
    }

    const handleDelete = async (messageId, messageUserId) => {
        if (user?.id !== messageUserId) return

        await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)
    }

    const getTripDetails = (trip) => {
        if (!trip?.steps || trip.steps.length === 0) return { location: 'Destination inconnue', dates: '' }

        const sortedSteps = [...trip.steps].sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
        const firstStep = sortedSteps[0]
        const lastStep = sortedSteps[sortedSteps.length - 1]

        const location = sortedSteps.length > 1
            ? `${firstStep.location_name} → ${lastStep.location_name}`
            : firstStep.location_name

        const startDate = new Date(firstStep.arrival_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        const endDate = new Date(lastStep.departure_date || lastStep.arrival_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        const dates = `${startDate} - ${endDate}`

        return { location, dates }
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <>
            {/* Bouton flottant */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen ? (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition flex items-center gap-2 relative"
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-semibold">Chat Voyageurs</span>
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                            {messages.length > 99 ? '99+' : messages.length}
                        </span>
                    </button>
                ) : (
                    <div className="glass rounded-2xl shadow-2xl w-96 h-[550px] flex flex-col overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <div>
                                    <h3 className="font-bold">Chat Voyageurs</h3>
                                    <p className="text-xs opacity-90">Discutez en temps réel</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white/30 to-white/50">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Aucun message pour le moment</p>
                                    <p className="text-xs mt-1">Soyez le premier à parler !</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMyMessage = user?.id === msg.user_id
                                    return (
                                        <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                {!isMyMessage && (
                                                    <span className="text-xs font-semibold text-gray-600 px-2">
                                                        {msg.username}
                                                    </span>
                                                )}
                                                <div className="relative group">
                                                    <div className={`p-3 rounded-xl ${isMyMessage
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                                                        }`}>
                                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                                                        {/* Carte Itinéraire Partagé */}
                                                        {msg.itinerary_id && (
                                                            <div className={`mt-2 p-3 rounded-lg ${isMyMessage ? 'bg-blue-500 border border-blue-400' : 'bg-blue-50 border border-blue-100'} transition-all hover:opacity-90 cursor-pointer`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`p-1.5 rounded-full ${isMyMessage ? 'bg-blue-400' : 'bg-blue-100'}`}>
                                                                        <Send className={`w-3 h-3 ${isMyMessage ? 'text-white' : 'text-blue-600'}`} />
                                                                    </div>
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isMyMessage ? 'text-blue-100' : 'text-blue-800'}`}>
                                                                        Trip Partagé
                                                                    </span>
                                                                </div>
                                                                <div className={`font-bold text-sm mb-1 ${isMyMessage ? 'text-white' : 'text-gray-900'}`}>
                                                                    {msg.trip_data?.name || "Itinéraire"}
                                                                </div>

                                                                {msg.trip_data?.steps && (
                                                                    <div className={`text-xs space-y-1 ${isMyMessage ? 'text-blue-50' : 'text-gray-600'}`}>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <MapPin className="w-3 h-3 opacity-70" />
                                                                            <span className="truncate max-w-[200px]">{getTripDetails(msg.trip_data).location}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 opacity-80">
                                                                            <span className="w-3 text-center">📅</span>
                                                                            <span>{getTripDetails(msg.trip_data).dates}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <span className={`text-xs mt-1 block ${isMyMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                    {isMyMessage && (
                                                        <button
                                                            onClick={() => handleDelete(msg.id, msg.user_id)}
                                                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 text-xs"
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200 relative">
                            {/* Menu de partage */}
                            {showShareMenu && (
                                <div className="absolute bottom-full left-0 w-full bg-white border-t border-gray-200 shadow-xl rounded-t-2xl p-2 animate-in slide-in-from-bottom-5 z-10 max-h-60 overflow-y-auto">
                                    <div className="flex justify-between items-center px-2 mb-2">
                                        <h4 className="font-bold text-sm text-gray-700">Partager un itinéraire</h4>
                                        <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {userTrips.length === 0 ? (
                                        <p className="text-xs text-center text-gray-500 py-4">Aucun itinéraire à partager.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {userTrips.map(trip => (
                                                <button
                                                    key={trip.id}
                                                    onClick={() => handleShareTrip(trip)}
                                                    className="w-full text-left p-2 rounded-lg hover:bg-blue-50 transition flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 block">{trip.name}</span>
                                                        <span className="text-xs text-gray-500">{new Date(trip.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <Send className="w-3 h-3 text-blue-300 group-hover:text-blue-600" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {user ? (
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className={`p-3 rounded-xl transition ${showShareMenu ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        title="Partager un itinéraire"
                                    >
                                        <MapPin className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Votre message..."
                                        className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!message.trim()}
                                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-600 py-2">
                                    <a href="/login" className="text-blue-600 hover:underline font-semibold">
                                        Connectez-vous
                                    </a> pour participer au chat
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
