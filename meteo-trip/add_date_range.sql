-- Migration : Ajouter les plages de dates et météo quotidienne
-- Exécuter dans Supabase SQL Editor

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE steps 
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS daily_weather JSONB;

-- 2. Migrer les données existantes
-- Pour chaque étape existante, mettre departure_date = arrival_date
UPDATE steps 
SET 
  departure_date = arrival_date,
  daily_weather = jsonb_build_array(
    jsonb_build_object(
      'date', arrival_date::text, 
      'weather', COALESCE(weather_desc, 'Non disponible')
    )
  )
WHERE departure_date IS NULL;

-- 3. Vérification
SELECT 
  id, 
  location_name, 
  arrival_date, 
  departure_date,
  daily_weather
FROM steps 
LIMIT 5;
