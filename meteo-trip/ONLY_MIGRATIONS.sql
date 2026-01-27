-- ==================================================
-- AJOUTS UNIQUEMENT (les tables itineraries et steps existent déjà)
-- ==================================================

-- 1. Ajouter colonnes first_name et last_name à itineraries
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Ajouter colonne weather_desc à steps (si elle manque)
ALTER TABLE steps
ADD COLUMN IF NOT EXISTS weather_desc TEXT;

-- 3. Créer table messages pour le chat en temps réel
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- 5. Activer Row Level Security sur messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- 7. Créer policies pour messages
CREATE POLICY "Anyone can read messages"
ON messages FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 8. Activer Realtime pour la table messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ==================================================
-- FIN - Si "Success. No rows returned" = tout est bon ! ✅
-- ==================================================
