-- Drop the functions that manage the snapshot system
DROP FUNCTION IF EXISTS publish_portfolio(p_org_id VARCHAR(50));
DROP FUNCTION IF EXISTS unpublish_portfolio(p_org_id VARCHAR(50));
DROP FUNCTION IF EXISTS get_published_portfolio(p_org_id VARCHAR(50));

-- Drop the portfolio_snapshots table, which is no longer needed
DROP TABLE IF EXISTS portfolio_snapshots;

-- Remove the redundant is_published columns from content tables
ALTER TABLE story_sections DROP COLUMN IF EXISTS is_published;
ALTER TABLE skill_categories DROP COLUMN IF EXISTS is_published;
ALTER TABLE tools DROP COLUMN IF EXISTS is_published;
ALTER TABLE journey_timelines DROP COLUMN IF EXISTS is_published;
ALTER TABLE cv_sections DROP COLUMN IF EXISTS is_published;
ALTER TABLE contact_sections DROP COLUMN IF EXISTS is_published;
-- Note: The table 'carousel_sections' mentioned in migration 008 does not exist. The correct table is 'carousels', which was not modified.
