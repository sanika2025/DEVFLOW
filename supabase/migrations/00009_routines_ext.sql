-- ==========================================
-- Migration 09: Simple Life Routines Extension
-- ==========================================

CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, date)
);

-- Enable RLS
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Policies for routine_completions
CREATE POLICY "Users can view their own routine completions"
  ON routine_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine completions"
  ON routine_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine completions"
  ON routine_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine completions"
  ON routine_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: index for faster timeline querying
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions(user_id, date);
