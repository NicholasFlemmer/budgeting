/*
  # Budget Management Schema

  1. New Tables
    - `budget_items`
      - `id` (uuid, primary key)
      - `account_number` (text)
      - `subsidiary_name` (text)
      - `client` (text)
      - `product_line` (text)
      - `account_level` (text)
      - `classification` (text)
      - `problem_description` (text)
      - `month_values` (jsonb) - Stores monthly budget values
      - `total_amount` (numeric)
      - `gp_percentage` (numeric)
      - `user_id` (uuid) - References auth.users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `budget_items` table
    - Add policies for authenticated users to:
      - Read their own budget items
      - Create new budget items
      - Update their own budget items
      - Delete their own budget items
*/

CREATE TABLE budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number text,
  subsidiary_name text,
  client text,
  product_line text,
  account_level text,
  classification text,
  problem_description text,
  month_values jsonb NOT NULL DEFAULT '{}',
  total_amount numeric DEFAULT 0,
  gp_percentage numeric DEFAULT 0,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own budget items
CREATE POLICY "Users can read own budget items"
  ON budget_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own budget items
CREATE POLICY "Users can create budget items"
  ON budget_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own budget items
CREATE POLICY "Users can update own budget items"
  ON budget_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own budget items
CREATE POLICY "Users can delete own budget items"
  ON budget_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);