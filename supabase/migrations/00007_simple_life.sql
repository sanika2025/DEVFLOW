-- ==========================================
-- Migration 07: Simple Life Manager
-- ==========================================

-- 1. Update Profiles with user_mode
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_mode TEXT DEFAULT 'full' CHECK (user_mode IN ('full', 'simple_life'));

-- 2. Simple Life Tables
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  source TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  frequency TEXT DEFAULT 'monthly',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('Morning', 'Evening', 'Night', 'Off', 'Custom')),
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  shift_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  days TEXT[] DEFAULT '{}',
  category TEXT,
  shift_type TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  departure DATE NOT NULL,
  return DATE,
  destination TEXT DEFAULT 'Home',
  travel_cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT false,
  recurring TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own income" ON income;
CREATE POLICY "Users can manage own income" ON income FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own recurring_bills" ON recurring_bills;
CREATE POLICY "Users can manage own recurring_bills" ON recurring_bills FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own shifts" ON shifts;
CREATE POLICY "Users can manage own shifts" ON shifts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own shift_patterns" ON shift_patterns;
CREATE POLICY "Users can manage own shift_patterns" ON shift_patterns FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own routines" ON routines;
CREATE POLICY "Users can manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own home_visits" ON home_visits;
CREATE POLICY "Users can manage own home_visits" ON home_visits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 4. Updated At Triggers
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
