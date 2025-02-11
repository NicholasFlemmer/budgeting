ALTER TABLE budget_items 
  DROP COLUMN IF EXISTS account_number,
  DROP COLUMN IF EXISTS subsidiary_name;

-- Update existing records to ensure clean data
UPDATE budget_items 
SET updated_at = NOW();