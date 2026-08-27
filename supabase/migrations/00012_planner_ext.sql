-- ==========================================
-- Migration 12: Planner & Central Hub Extension
-- ==========================================

-- 1. Extend tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_rule TEXT DEFAULT 'None';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder TEXT DEFAULT 'None';

-- Update the status check constraint to support kanban columns
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in-progress', 'done', 'pending', 'completed'));

-- 2. Create time_blocks table for scheduling
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  category TEXT DEFAULT 'Personal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security for time_blocks
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own time_blocks" ON time_blocks;
CREATE POLICY "Users can manage own time_blocks" ON time_blocks FOR ALL USING (auth.uid() = user_id);

-- 4. Triggers
CREATE TRIGGER update_time_blocks_modtime BEFORE UPDATE ON time_blocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
