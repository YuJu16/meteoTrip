-- Add first_name and last_name columns to itineraries table
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Note: The username is stored in auth.users metadata, no table change needed
-- You can access it via user.user_metadata.username in your code
