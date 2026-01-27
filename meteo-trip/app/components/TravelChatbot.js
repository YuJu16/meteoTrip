'use client'
import { useState } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

export default function TravelChatbot() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')

        // Ajouter le message utilisateur
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            })

            const data = await res.json()

            // Ajouter la réponse du bot
            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.response,
                destinations: data.destinations || []
            }])
        } catch (error) {
            console.error('Erreur chat:', error)
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "Désolé, une erreur s'est produite. Pouvez-vous reformuler ?"
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass rounded-2xl shadow-xl max-w-2xl w-full mx-auto p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Assistant Voyage IA</h3>
                    <p className="text-sm text-gray-500">Dites-moi vos envies !</p>
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">Commencez la conversation !</p>
                        <p className="text-xs mt-1">Ex: "j'ai envie de sushi" ou "je veux voir des aurores boréales"</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'bot' && (
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                </div>
                            )}

                            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                                <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                    : 'bg-white border border-gray-200'
                                    }`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>

                                {/* Destinations suggérées */}
                                {msg.destinations && msg.destinations.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {msg.destinations.map((dest, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                                            >
                                                <p className="text-sm font-semibold text-blue-900">{dest.city}</p>
                                                <p className="text-xs text-blue-700 mt-0.5">{dest.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex: j'ai envie de sushi..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    )
}
