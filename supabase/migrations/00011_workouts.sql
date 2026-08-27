-- ==========================================
-- Migration 11: Workout Tracker
-- ==========================================

-- 1. Workout Routines
CREATE TABLE IF NOT EXISTS workout_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  days_of_week INTEGER[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workout Exercises
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  weight_lbs NUMERIC(10, 2),
  rest_time INTEGER DEFAULT 60,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES workout_routines(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout Sets
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES workout_exercises(id) ON DELETE SET NULL,
  set_number INTEGER,
  reps_completed INTEGER,
  weight_used NUMERIC(10, 2),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Workout Goals
CREATE TABLE IF NOT EXISTS workout_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  weekly_target INTEGER DEFAULT 3,
  monthly_target INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Row Level Security Policies
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workout_routines" ON workout_routines;
CREATE POLICY "Users can manage own workout_routines" ON workout_routines FOR ALL USING (auth.uid() = user_id);

-- Exercises inherit routine's user access, but since RLS requires checking the joined table for simplicity we can do a subquery or join, 
-- or we can just let users manage exercises if they own the routine. 
-- For simplicity, since the client passes it, we can allow authenticated users to manage exercises where the routine belongs to them.
DROP POLICY IF EXISTS "Users can manage own workout_exercises" ON workout_exercises;
CREATE POLICY "Users can manage own workout_exercises" ON workout_exercises 
  FOR ALL 
  USING (
    routine_id IN (
      SELECT id FROM workout_routines WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own workout_sessions" ON workout_sessions;
CREATE POLICY "Users can manage own workout_sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own workout_sets" ON workout_sets;
CREATE POLICY "Users can manage own workout_sets" ON workout_sets 
  FOR ALL 
  USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own workout_goals" ON workout_goals;
CREATE POLICY "Users can manage own workout_goals" ON workout_goals FOR ALL USING (auth.uid() = user_id);

-- 7. Updated At Triggers
CREATE TRIGGER update_workout_routines_modtime BEFORE UPDATE ON workout_routines FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workout_goals_modtime BEFORE UPDATE ON workout_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
