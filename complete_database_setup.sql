-- ==================================================
-- SCRIPT COMPLET - METEO TRIP DATABASE SETUP
-- ==================================================
-- Exécute ce script dans Supabase SQL Editor
-- pour créer toutes les tables et configurations nécessaires
-- ==================================================

-- 1. Ajouter colonnes first_name et last_name à itineraries
-- --------------------------------------------------
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Créer table messages pour le chat en temps réel
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer index pour optimiser les requêtes
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- 4. Activer Row Level Security sur messages
-- --------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer anciennes policies (si elles existent)
-- --------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- 6. Créer policies pour messages
-- --------------------------------------------------

-- Tout le monde peut lire les messages (même non connecté)
CREATE POLICY "Anyone can read messages"
ON messages FOR SELECT
TO authenticated, anon
USING (true);

-- Seuls les utilisateurs authentifiés peuvent créer des messages
CREATE POLICY "Authenticated users can create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Activer Realtime pour la table messages (IMPORTANT pour le chat)
-- --------------------------------------------------
-- Cette commande active les updates en temps réel dans le chat
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ==================================================
-- FIN DU SCRIPT
-- ==================================================
-- Si tu vois "Success. No rows returned", c'est bon ! ✅
-- Maintenant, redémarre ton serveur : npm run dev
-- ==================================================
