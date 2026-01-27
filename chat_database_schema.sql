-- Table pour stocker les messages du chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- Activer Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy : tout le monde peut lire les messages
CREATE POLICY "Anyone can read messages"
ON messages FOR SELECT
TO authenticated, anon
USING (true);

-- Policy : seuls les utilisateurs authentifiés peuvent créer des messages
CREATE POLICY "Authenticated users can create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy : les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Activer Realtime pour la table messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
