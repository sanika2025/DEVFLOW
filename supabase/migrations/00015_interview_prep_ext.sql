-- ==========================================
-- Migration 15: Interview Prep Extensions
-- ==========================================

-- 1. Interview Progress (Per Question)
CREATE TABLE IF NOT EXISTS interview_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Needs Review' CHECK (status IN ('Needs Review', 'Practicing', 'Strong')),
  attempts INTEGER DEFAULT 0,
  last_score INTEGER, -- Score from AI
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 2. Mock Interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  score_overall INTEGER,
  score_technical INTEGER,
  score_communication INTEGER,
  feedback_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Interview Stats
CREATE TABLE IF NOT EXISTS user_interview_stats (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  last_practiced_date DATE,
  overall_readiness INTEGER DEFAULT 0 CHECK (overall_readiness BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security Policies
ALTER TABLE interview_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interview_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own interview_progress" ON interview_progress;
CREATE POLICY "Users can manage own interview_progress" ON interview_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own mock_interviews" ON mock_interviews;
CREATE POLICY "Users can manage own mock_interviews" ON mock_interviews FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own user_interview_stats" ON user_interview_stats;
CREATE POLICY "Users can manage own user_interview_stats" ON user_interview_stats FOR ALL USING (auth.uid() = user_id);

-- 5. Updated At Trigger for stats
CREATE TRIGGER update_user_interview_stats_modtime BEFORE UPDATE ON user_interview_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
