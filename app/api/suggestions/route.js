import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
    try {
        const { preferences } = await request.json()

        console.log('[Suggestions API] Préférences reçues:', preferences)

        if (!process.env.GEMINI_API_KEY) {
            console.error('[Suggestions API] ERREUR: GEMINI_API_KEY manquante!')
            return NextResponse.json({
                error: 'Configuration API manquante'
            }, { status: 500 })
        }

        console.log('[Suggestions API] Initialisation Gemini...')
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        })

        const preferencesText = preferences ?
            `Tiens compte des préférences suivantes: ${JSON.stringify(preferences)}` :
            'Varie les styles de voyage'

        const prompt = `Tu es un expert en voyage et planification de roadtrips.

${preferencesText}

Génère 8 suggestions de roadtrip inspirantes et variées.

Réponds UNIQUEMENT avec ce format JSON (sans markdown, sans balises):
{
  "suggestions": [
    {
      "title": "Titre accrocheur",
      "destinations": ["Ville1, Pays1", "Ville2, Pays2", "Ville3, Pays3"],
      "duration": "X jours",
      "description": "Description courte et enthousiasmante (2-3 phrases)",
      "bestPeriod": "Mois-Mois"
    }
  ]
}

Règles:
- 8 roadtrips différents et variés
- 3-4 destinations par roadtrip
- Varie les continents (Europe, Asie, Amérique, Afrique, Océanie)
- Durées entre 5-14 jours
- Descriptions inspirantes mais concises
- Périodes réalistes selon climat
- Inclus des roadtrips pour tous les budgets

Réponds uniquement en JSON valide, rien d'autre.`

        console.log('[Suggestions API] Envoi à Gemini...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        let text = response.text()

        console.log('[Suggestions API] Réponse brute (100 premiers chars):', text.substring(0, 100))

        text = text
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '')
            .trim()

        let suggestionsData
        try {
            suggestionsData = JSON.parse(text)
            console.log('[Suggestions API] JSON parsé avec succès, nombre de suggestions:', suggestionsData.suggestions?.length)
        } catch (parseError) {
            console.error('[Suggestions API] Erreur parsing:', parseError)

            const allSuggestions = [
                {
                    title: "Roadtrip Italien Classique",
                    destinations: ["Rome, Italie", "Florence, Italie", "Venise, Italie"],
                    duration: "7 jours",
                    description: "Plongez dans l'histoire et l'art italien. De la Rome antique à Venise romantique, en passant par la Renaissance florentine.",
                    bestPeriod: "Avril-Juin ou Septembre-Octobre"
                },
                {
                    title: "Tour du Japon Moderne et Traditionnel",
                    destinations: ["Tokyo, Japon", "Kyoto, Japon", "Osaka, Japon"],
                    duration: "10 jours",
                    description: "Découvrez le contraste fascinant entre modernité et tradition. Des temples zen aux néons de Tokyo, une expérience inoubliable.",
                    bestPeriod: "Mars-Mai ou Octobre-Novembre"
                },
                {
                    title: "Californie Côtière en Liberté",
                    destinations: ["San Francisco, USA", "Los Angeles, USA", "San Diego, USA"],
                    duration: "8 jours",
                    description: "Longez la célèbre Highway 1 entre plages dorées, villes iconiques et paysages à couper le souffle.",
                    bestPeriod: "Mai-Septembre"
                },
                {
                    title: "Merveilles d'Espagne",
                    destinations: ["Madrid, Espagne", "Barcelone, Espagne", "Séville, Espagne"],
                    duration: "9 jours",
                    description: "Culture, gastronomie et architecture exceptionnelle. Du flamenco andalou au modernisme catalan.",
                    bestPeriod: "Avril-Juin ou Septembre-Octobre"
                },
                {
                    title: "Épices et Couleurs du Maroc",
                    destinations: ["Marrakech, Maroc", "Fès, Maroc", "Chefchaouen, Maroc"],
                    duration: "6 jours",
                    description: "Souks colorés, architecture majestueuse et saveurs envoûtantes dans le royaume des mille et une nuits.",
                    bestPeriod: "Mars-Mai ou Septembre-Novembre"
                },
                {
                    title: "Îles Grecques Paradisiaques",
                    destinations: ["Athènes, Grèce", "Santorin, Grèce", "Mykonos, Grèce"],
                    duration: "8 jours",
                    description: "Villages blancs perchés, mer azur et couchers de soleil légendaires dans les Cyclades.",
                    bestPeriod: "Mai-Juin ou Septembre-Octobre"
                },
                {
                    title: "Safari et Plages d'Afrique du Sud",
                    destinations: ["Le Cap, Afrique du Sud", "Parc Kruger, Afrique du Sud", "Durban, Afrique du Sud"],
                    duration: "12 jours",
                    description: "Safaris inoubliables, vignobles réputés et plages de l'océan Indien dans la nation arc-en-ciel.",
                    bestPeriod: "Mai-Septembre"
                },
                {
                    title: "Temples et Plages de Thaïlande",
                    destinations: ["Bangkok, Thaïlande", "Chiang Mai, Thaïlande", "Phuket, Thaïlande"],
                    duration: "10 jours",
                    description: "Temples dorés, cuisine de rue exceptionnelle et plages paradisiaques du pays du sourire.",
                    bestPeriod: "Novembre-Mars"
                }
            ]

            const shuffled = allSuggestions.sort(() => Math.random() - 0.5)
            suggestionsData = { suggestions: shuffled }
        }

        if (!suggestionsData.suggestions || suggestionsData.suggestions.length === 0) {
            console.warn('[Suggestions API] Pas de suggestions, utilisation du fallback')
            suggestionsData = {
                suggestions: [
                    {
                        title: "Roadtrip Italien",
                        destinations: ["Rome, Italie", "Florence, Italie", "Venise, Italie"],
                        duration: "7 jours",
                        description: "Histoire et art italien.",
                        bestPeriod: "Avril-Juin"
                    }
                ]
            }
        }

        return NextResponse.json(suggestionsData)

    } catch (error) {
        console.error('[Suggestions API] Erreur globale:', error)

        // Fallback quand Gemini échoue (quota, etc.)
        const allSuggestions = [
            {
                title: "Roadtrip Italien Classique",
                destinations: ["Rome, Italie", "Florence, Italie", "Venise, Italie"],
                duration: "7 jours",
                description: "Plongez dans l'histoire et l'art italien. De la Rome antique à Venise romantique.",
                bestPeriod: "Avril-Juin ou Septembre-Octobre"
            },
            {
                title: "Tour du Japon",
                destinations: ["Tokyo, Japon", "Kyoto, Japon", "Osaka, Japon"],
                duration: "10 jours",
                description: "Découvrez le contraste fascinant entre modernité et tradition japonaise.",
                bestPeriod: "Mars-Mai ou Octobre-Novembre"
            },
            {
                title: "Californie Côtière",
                destinations: ["San Francisco, USA", "Los Angeles, USA", "San Diego, USA"],
                duration: "8 jours",
                description: "Longez la célèbre Highway 1 entre plages dorées et villes iconiques.",
                bestPeriod: "Mai-Septembre"
            },
            {
                title: "Merveilles d'Espagne",
                destinations: ["Madrid, Espagne", "Barcelone, Espagne", "Séville, Espagne"],
                duration: "9 jours",
                description: "Culture, gastronomie et architecture exceptionnelle.",
                bestPeriod: "Avril-Juin ou Septembre-Octobre"
            },
            {
                title: "Épices et Couleurs du Maroc",
                destinations: ["Marrakech, Maroc", "Fès, Maroc", "Chefchaouen, Maroc"],
                duration: "6 jours",
                description: "Souks colorés, palais somptueux et saveurs envoûtantes.",
                bestPeriod: "Mars-Mai ou Septembre-Novembre"
            },
            {
                title: "Îles Grecques Paradisiaques",
                destinations: ["Athènes, Grèce", "Santorin, Grèce", "Mykonos, Grèce"],
                duration: "8 jours",
                description: "Villages blancs, mer azur et couchers de soleil légendaires.",
                bestPeriod: "Mai-Juin ou Septembre-Octobre"
            },
            {
                title: "Safari Africain",
                destinations: ["Nairobi, Kenya", "Masai Mara, Kenya", "Zanzibar, Tanzanie"],
                duration: "12 jours",
                description: "Safari inoubliable et plages paradisiaques de l'océan Indien.",
                bestPeriod: "Juin-Octobre"
            },
            {
                title: "Temples et Plages de Thaïlande",
                destinations: ["Bangkok, Thaïlande", "Chiang Mai, Thaïlande", "Phuket, Thaïlande"],
                duration: "10 jours",
                description: "Temples dorés, cuisine de rue et plages paradisiaques.",
                bestPeriod: "Novembre-Mars"
            }
        ]

        const shuffled = allSuggestions.sort(() => Math.random() - 0.5)
        return NextResponse.json({ suggestions: shuffled })
    }
}