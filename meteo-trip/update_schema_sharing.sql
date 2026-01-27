-- ==================================================
-- SCRIPT MISE A JOUR - PARTAGE ITINERAIRES
-- ==================================================
-- Exécute ce script dans Supabase SQL Editor
-- ==================================================

-- 1. Ajouter la colonne is_public à la table itineraries
-- --------------------------------------------------
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Ajouter la colonne itinerary_id à la table messages
-- --------------------------------------------------
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL;

-- 3. Mettre à jour les politiques (RLS) pour itineraries
-- --------------------------------------------------
-- Permettre à tout le monde de lire les itinéraires publics
CREATE POLICY "Public itineraries are viewable by everyone"
ON itineraries FOR SELECT
TO authenticated, anon
USING (is_public = true);

-- Note: Les politiques existantes pour les utilisateurs (CRUD own rows) devraient toujours fonctionner.
-- Si besoin, vérifie que les politiques ne sont pas restrictives (AND) mais permissives (OR) ou bien définies.

-- 4. Index pour les performances
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS messages_itinerary_id_idx ON messages(itinerary_id);
CREATE INDEX IF NOT EXISTS itineraries_is_public_idx ON itineraries(is_public);

-- ==================================================
-- FIN DU SCRIPT
-- ==================================================
