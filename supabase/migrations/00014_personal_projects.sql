-- ==========================================
-- Migration 14: Personal Projects Tracking
-- ==========================================

-- 1. Personal Projects Table
CREATE TABLE IF NOT EXISTS personal_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Development',
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Archived')),
  health TEXT DEFAULT 'On Track' CHECK (health IN ('On Track', 'At Risk', 'Blocked', 'Completed')),
  deadline TIMESTAMPTZ,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  repo_url TEXT,
  doc_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project Milestones
CREATE TABLE IF NOT EXISTS personal_project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES personal_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Activities
CREATE TABLE IF NOT EXISTS personal_project_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES personal_projects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security Policies
ALTER TABLE personal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_project_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own personal_projects" ON personal_projects;
CREATE POLICY "Users can manage own personal_projects" ON personal_projects FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own personal_project_milestones" ON personal_project_milestones;
-- We need to join with personal_projects to check ownership
CREATE POLICY "Users can manage own personal_project_milestones" ON personal_project_milestones FOR ALL USING (
  project_id IN (SELECT id FROM personal_projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own personal_project_activities" ON personal_project_activities;
CREATE POLICY "Users can manage own personal_project_activities" ON personal_project_activities FOR ALL USING (
  project_id IN (SELECT id FROM personal_projects WHERE user_id = auth.uid())
);

-- 5. Updated At Triggers
CREATE TRIGGER update_personal_projects_modtime BEFORE UPDATE ON personal_projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personal_project_milestones_modtime BEFORE UPDATE ON personal_project_milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
