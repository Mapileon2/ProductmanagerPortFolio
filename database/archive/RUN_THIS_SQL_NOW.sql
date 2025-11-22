-- ============================================
-- RUN THIS SQL IN SUPABASE DASHBOARD NOW
-- ============================================
-- This fixes the CV upload error by adding missing columns

-- Add metadata columns to cv_versions table
ALTER TABLE cv_versions 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ;

-- Add icon_url columns to Magic Toolbox tables (if not already added)
ALTER TABLE skill_categories 
ADD COLUMN IF NOT EXISTS icon_url TEXT;

ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Verify the columns were added
SELECT 'cv_versions columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cv_versions' 
  AND column_name IN ('file_name', 'file_size', 'upload_date');

SELECT 'skill_categories columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skill_categories' 
  AND column_name = 'icon_url';

SELECT 'tools columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tools' 
  AND column_name = 'icon_url';

-- Success message
SELECT '✅ All columns added successfully!' as result;
