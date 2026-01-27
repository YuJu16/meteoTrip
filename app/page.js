'use client'
import { Map, Sun, Cloud, ArrowRight, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import TravelChatbot from './components/TravelChatbot'

export default function Home() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-5xl w-full text-center space-y-12">

                {/* Hero Section */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                        <Cloud className="w-4 h-4" />
                        <span>Météo en temps réel pour vos voyages</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Planifiez vos voyages <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            avec précision
                        </span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Créez des itinéraires détaillés et obtenez automatiquement les prévisions météo pour chaque étape. Ne laissez plus la pluie gâcher vos vacances.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link
                            href="/create"
                            className="group flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200"
                        >
                            Créer un Itinéraire
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Mes Itinéraires
                        </Link>
                    </div>
                </div>

                {/* AI Chatbot Section */}
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <TravelChatbot />
                </div>

                {/* Features Cards */}
                <div className="grid md:grid-cols-3 gap-8 mt-16 px-4">
                    <div className="glass p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 hover:-translate-y-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 mx-auto">
                            <Map className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-gray-900">Itinéraires Flexibles</h3>
                        <p className="text-gray-600 leading-relaxed">Ajoutez autant d'étapes que vous le souhaitez. Modifiez votre parcours en un clin d'œil.</p>
                    </div>

                    <div className="glass p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 hover:-translate-y-1">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 mx-auto">
                            <Sun className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-gray-900">Météo Intelligente</h3>
                        <p className="text-gray-600 leading-relaxed">Prévisions automatiques basées sur vos dates de passage. Anticipez le beau temps !</p>
                    </div>

                    <div className="glass p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300 hover:-translate-y-1">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-gray-900">Sauvegarde Cloud</h3>
                        <p className="text-gray-600 leading-relaxed">Retrouvez vos voyages sur tous vos appareils grâce à la synchronisation sécurisée.</p>
                    </div>
                </div>

                {/* Credits Info */}
                <div className="pt-8 pb-4">
                    <p className="text-sm text-gray-500 bg-white/50 inline-block px-4 py-2 rounded-full border border-gray-100">
                        🎁 <span className="font-semibold text-gray-700">Sans compte :</span> 1 itinéraire • <span className="font-semibold text-blue-600">Membre :</span> Itinéraires illimités
                    </p>
                </div>
            </div>
        </div>
    )
}
