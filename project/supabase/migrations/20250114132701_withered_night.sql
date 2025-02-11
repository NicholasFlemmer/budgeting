/*
  # Update RLS policies for shared access
  
  1. Changes
    - Remove user_id requirement from RLS policies
    - Allow authenticated users to access all rows
    - Keep authentication requirement for security
  
  2. Security
    - Only authenticated users can access data
    - All authenticated users can read/write all rows
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can create budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete own budget items" ON budget_items;

-- Create new shared access policies
CREATE POLICY "Authenticated users can read budget items"
  ON budget_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget items"
  ON budget_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget items"
  ON budget_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget items"
  ON budget_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Make user_id optional
ALTER TABLE budget_items ALTER COLUMN user_id DROP NOT NULL;