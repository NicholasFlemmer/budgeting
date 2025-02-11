/*
  # Add department column to budget_items table

  1. Changes
    - Add department column to budget_items table
    - Set default department to 'tt'
    - Update existing rows to have default department
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budget_items' AND column_name = 'department'
  ) THEN
    ALTER TABLE budget_items ADD COLUMN department text DEFAULT 'tt';
    
    -- Update existing rows to have default department
    UPDATE budget_items SET department = 'tt' WHERE department IS NULL;
  END IF;
END $$;