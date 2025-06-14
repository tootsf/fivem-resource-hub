-- Migration script to populate resources table with existing data
-- This will migrate data from your current entries.json format

INSERT INTO resources (
  github_repo_url,
  name,
  description,
  language,
  stars,
  fivem_category,
  tags,
  created_at
) VALUES
-- This will be populated by the migration script
-- Data will come from your existing entries.json file

-- Example of how the data will look:
-- ('https://github.com/user/repo', 'resource-name', 'Description', 'Lua', 10, 'scripts', ARRAY['hud', 'ui'], CURRENT_TIMESTAMP)
;
