/*
  # Add cost of sales column

  1. Changes
    - Add `cost_of_sales` column to budget_items table
    - Set default value to 0
    - Make column nullable to maintain compatibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budget_items' AND column_name = 'cost_of_sales'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN cost_of_sales numeric DEFAULT 0;
  END IF;
END $$;