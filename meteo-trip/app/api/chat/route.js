import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
    let message = ''

    try {
        const body = await request.json()
        message = body.message || ''

        if (!message) {
            return NextResponse.json({ error: 'Message requis' }, { status: 400 })
        }

        console.log('[Chat API] Message reçu:', message)

        if (!process.env.GEMINI_API_KEY) {
            console.error('[Chat API] ERREUR: GEMINI_API_KEY manquante!')
            return NextResponse.json({
                error: 'Configuration API manquante'
            }, { status: 500 })
        }

        console.log('[Chat API] Initialisation Gemini...')
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })

        const prompt = `Tu es un assistant de voyage expert. L'utilisateur exprime une envie: "${message}"

Analyse son envie et suggère LA destination idéale qui correspond le mieux.

Réponds UNIQUEMENT avec ce format JSON (sans markdown, sans balises):
{
  "response": "Explication enthousiaste pourquoi cette destination est parfaite pour son envie (3-4 phrases)",
  "destinations": [
    {"city": "Ville, Pays", "reason": "La raison principale qui en fait LE choix idéal"}
  ]
}

Exemples:
- "sushi" → Tokyo, Japon (capitale mondiale du sushi authentique)
- "plage paradisiaque" → Maldives (eaux cristallines, tranquillité absolue)
- "aurores boréales" → Tromsø, Norvège (meilleur spot d'observation)
- "budget serré" → Lisbonne, Portugal (excellent rapport qualité-prix)
- "épices et couleurs" → Marrakech, Maroc (souks, médina, saveurs)
- "histoire ancienne" → Rome, Italie (Colisée, Vatican, 3000 ans d'histoire)
- "nature sauvage" → Costa Rica (biodiversité exceptionnelle)
- "fête et nightlife" → Ibiza, Espagne (clubs légendaires)
- "romantique" → Paris, France (ville de l'amour)
- "aventure" → Queenstown, Nouvelle-Zélande (capitale mondiale de l'aventure)

Choisis UNE SEULE destination, la meilleure pour cette envie précise.
Réponds uniquement en JSON valide, rien d'autre.`

        console.log('[Chat API] Envoi à Gemini...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        let text = response.text()

        console.log('[Chat API] Réponse brute:', text.substring(0, 100))

        text = text
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '')
            .trim()

        let chatResponse
        try {
            chatResponse = JSON.parse(text)
            console.log('[Chat API] JSON parsé avec succès')
        } catch (parseError) {
            console.error('[Chat API] Erreur parsing:', parseError)
            chatResponse = getDestinationFromKeywords(message)
        }

        return NextResponse.json(chatResponse)

    } catch (error) {
        console.error('[Chat API] Erreur globale:', error)
        return NextResponse.json(getDestinationFromKeywords(message))
    }
}

// Fonction pour trouver la destination idéale selon les mots-clés
function getDestinationFromKeywords(message) {
    const lowerMessage = message.toLowerCase()

    const keywords = [
        { words: ['sushi', 'japon', 'ramen', 'manga', 'anime'], city: "Tokyo, Japon", reason: "Capitale mondiale de la culture japonaise, du sushi authentique et de la modernité", response: "Pour une expérience japonaise authentique, Tokyo est LA destination incontournable ! Entre traditions millénaires et ultra-modernité, vous y découvrirez le meilleur sushi au monde." },
        { words: ['plage', 'mer', 'soleil', 'bronzer', 'baignade'], city: "Maldives", reason: "Eaux cristallines, plages de sable blanc et tranquillité absolue", response: "Les Maldives sont le paradis terrestre pour les amoureux de plages ! Des lagons turquoise, des bungalows sur pilotis et une sérénité incomparable vous attendent." },
        { words: ['épice', 'couleur', 'souk', 'maroc', 'tajine'], city: "Marrakech, Maroc", reason: "Souks envoûtants, palais somptueux et cuisine aux mille saveurs", response: "Marrakech éveillera tous vos sens ! Entre les souks colorés de la médina, les jardins luxuriants et les tajines parfumés, c'est une immersion totale dans la magie orientale." },
        { words: ['montagne', 'neige', 'ski', 'alpes', 'randonnée'], city: "Chamonix, France", reason: "Au pied du Mont-Blanc, paradis des sports de montagne", response: "Chamonix est le temple de la montagne ! Avec le Mont-Blanc en toile de fond, c'est l'endroit rêvé pour le ski, l'alpinisme ou simplement admirer des panoramas à couper le souffle." },
        { words: ['romantique', 'amour', 'couple', 'lune de miel'], city: "Paris, France", reason: "La ville de l'amour par excellence", response: "Paris, ville lumière et capitale de l'amour ! Promenades sur les quais de Seine, dîner vue sur la Tour Eiffel, Montmartre au coucher du soleil... Le romantisme à l'état pur." },
        { words: ['fête', 'club', 'nightlife', 'soirée', 'danse'], city: "Ibiza, Espagne", reason: "Capitale mondiale de la fête et des clubs légendaires", response: "Ibiza est THE place to be pour faire la fête ! Des clubs mythiques, des DJ de renommée mondiale et une ambiance électrique du coucher au lever du soleil." },
        { words: ['histoire', 'antique', 'romain', 'musée', 'patrimoine'], city: "Rome, Italie", reason: "3000 ans d'histoire, du Colisée au Vatican", response: "Rome est un musée à ciel ouvert ! Le Colisée, le Forum, le Vatican... Chaque rue raconte une histoire millénaire. Une plongée fascinante dans l'Antiquité." },
        { words: ['safari', 'animaux', 'savane', 'lion', 'éléphant'], city: "Masai Mara, Kenya", reason: "Le plus grand spectacle de vie sauvage au monde", response: "Le Masai Mara vous offre le safari ultime ! Lions, éléphants, girafes dans leur habitat naturel, et la grande migration des gnous. Une expérience qui change une vie." },
        { words: ['nature', 'jungle', 'biodiversité', 'écologie'], city: "Costa Rica", reason: "Biodiversité exceptionnelle entre jungle et plages", response: "Le Costa Rica est un joyau de biodiversité ! Forêts tropicales, volcans actifs, plages des deux océans et une faune incroyable. Le paradis des amoureux de nature." },
        { words: ['aventure', 'extrême', 'adrénaline', 'sport'], city: "Queenstown, Nouvelle-Zélande", reason: "Capitale mondiale de l'aventure et des sports extrêmes", response: "Queenstown est la mecque de l'aventure ! Saut à l'élastique, parapente, jet boat, ski... Dans un décor de montagnes et lacs à couper le souffle." },
        { words: ['budget', 'pas cher', 'économique', 'backpack'], city: "Lisbonne, Portugal", reason: "Charme européen à prix doux, gastronomie et soleil", response: "Lisbonne offre le meilleur rapport qualité-prix d'Europe ! Ruelles colorées, pastéis de nata, fado et soleil, le tout sans se ruiner." },
        { words: ['temple', 'bouddhisme', 'spirituel', 'méditation'], city: "Bali, Indonésie", reason: "Île des dieux, temples et spiritualité", response: "Bali est l'île de la spiritualité ! Temples majestueux, rizières en terrasses, cérémonies hindoues et retraites yoga. Un voyage intérieur autant qu'extérieur." },
        { words: ['aurore', 'boréale', 'nord', 'polaire'], city: "Tromsø, Norvège", reason: "Meilleur spot au monde pour observer les aurores boréales", response: "Tromsø est LE spot pour les aurores boréales ! De septembre à mars, le ciel s'embrase de vert et violet. Un spectacle magique et inoubliable." },
        { words: ['vin', 'vignoble', 'dégustation', 'œnologie'], city: "Bordeaux, France", reason: "Capitale mondiale du vin, châteaux et grands crus", response: "Bordeaux est le paradis des amateurs de vin ! Visites de châteaux prestigieux, dégustations de grands crus et gastronomie raffinée dans la plus belle région viticole." },
        { words: ['carnaval', 'brésil', 'samba', 'rio'], city: "Rio de Janeiro, Brésil", reason: "Carnaval légendaire, plages mythiques et joie de vivre", response: "Rio c'est l'énergie pure ! Le Christ Rédempteur, Copacabana, le carnaval... La ville vibre au rythme de la samba et de la joie de vivre brésilienne." }
    ]

    for (const kw of keywords) {
        if (kw.words.some(word => lowerMessage.includes(word))) {
            return {
                response: kw.response,
                destinations: [{ city: kw.city, reason: kw.reason }]
            }
        }
    }

    // Destination par défaut
    return {
        response: "Voici une destination qui pourrait vous plaire ! Paris combine culture, gastronomie et romantisme pour une expérience inoubliable.",
        destinations: [{ city: "Paris, France", reason: "La ville lumière offre une expérience complète : culture, gastronomie et romantisme" }]
    }
}