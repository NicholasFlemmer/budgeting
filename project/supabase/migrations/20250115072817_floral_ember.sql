/*
  # Client table setup and relationships

  1. Changes
    - Create clients table if it doesn't exist
    - Ensure proper indexes exist
    - Add missing foreign key constraint if needed

  2. Security
    - Enable RLS on clients table
    - Add policy for authenticated users to read clients data
*/

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- Enable RLS if not already enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add read policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'Authenticated users can read clients'
  ) THEN
    CREATE POLICY "Authenticated users can read clients"
      ON clients
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'budget_items'
    AND constraint_name = 'budget_items_client_id_fkey'
  ) THEN
    ALTER TABLE budget_items
    ADD CONSTRAINT budget_items_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id);
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_budget_items_client_id ON budget_items(client_id);