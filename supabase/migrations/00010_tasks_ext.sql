-- ==========================================
-- Migration 10: Simple Life Tasks Extension
-- ==========================================

-- Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed'));

-- (Optional) If we need to view completed tasks more efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
