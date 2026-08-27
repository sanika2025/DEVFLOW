-- ==========================================
-- Migration 08: Simple Life Home Visits Extension
-- ==========================================

-- 1. Extend home_visits table
ALTER TABLE home_visits RENAME COLUMN travel_cost TO estimated_cost;
ALTER TABLE home_visits ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(10, 2);
ALTER TABLE home_visits ADD COLUMN IF NOT EXISTS travel_mode TEXT DEFAULT 'Train';
ALTER TABLE home_visits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled'));

-- 2. Add relationships to existing tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS home_visit_id UUID REFERENCES home_visits(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS home_visit_id UUID REFERENCES home_visits(id) ON DELETE CASCADE;

-- (Optional) If we need to view linked expenses or tasks more efficiently, we can add indexes
CREATE INDEX IF NOT EXISTS idx_expenses_home_visit ON expenses(home_visit_id);
CREATE INDEX IF NOT EXISTS idx_tasks_home_visit ON tasks(home_visit_id);
