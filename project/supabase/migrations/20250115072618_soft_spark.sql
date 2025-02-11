/*
  # Fix clients table and relationships

  1. Changes
    - Drop existing clients table if it exists
    - Create new clients table with proper constraints
    - Add client_id relationship to budget_items
    - Add indexes for performance

  2. Security
    - Enable RLS on clients table
    - Add policy for authenticated users to read clients data
*/

-- Drop existing table and relationships
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table
CREATE TABLE clients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Authenticated users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Add client_id to budget_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budget_items' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN client_id INTEGER REFERENCES clients(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_client_id ON budget_items(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);