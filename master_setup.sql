-- ==========================================
-- MASTER SETUP SCRIPT
-- ==========================================

-- RESET ENTIRE PUBLIC SCHEMA (Ensures clean slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Restore Default Supabase Permissions (CRITICAL for PostgREST API)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ==========================================
-- Migration 01: Core Schema & Views
-- ==========================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- AI capabilities

-- 2. ENUM Types
CREATE TYPE node_type_enum AS ENUM ('course', 'month', 'week', 'day', 'lesson', 'project', 'quiz');
CREATE TYPE difficulty_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- 3. Profiles & Organizations
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}'::jsonb,
  is_premium BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- 4. Learning Paths & Versions
CREATE TABLE learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE curriculum_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name TEXT NOT NULL, -- e.g., 'v1.0'
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_path_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL, -- Referenced in curriculum_nodes
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Curriculum Nodes (Flexible Hierarchy)
-- Replaces rigid courses -> months -> weeks -> days tables with a single flexible tree.
CREATE TABLE curriculum_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID REFERENCES curriculum_versions(id),
  parent_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  node_type node_type_enum NOT NULL,
  
  -- Core Metadata
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  
  -- Frontend Specific Fields (Stored in JSONB or explicit for performance)
  subtitle TEXT,
  thumbnail TEXT,
  icon TEXT,
  focus_area TEXT,
  objectives TEXT,
  
  -- Attributes
  difficulty difficulty_enum,
  estimated_hours NUMERIC(5,2),
  total_days INTEGER,
  xp_reward INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Publish Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete to preserve progress
);

-- Add foreign key reference retroactively to learning_path_courses
ALTER TABLE learning_path_courses 
  ADD CONSTRAINT fk_lpc_course FOREIGN KEY (course_id) REFERENCES curriculum_nodes(id) ON DELETE CASCADE;

-- 6. Trigger for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Legacy Views for Frontend Compatibility
-- Exposes curriculum_nodes as the old tables so existing React queries do not break.

CREATE OR REPLACE VIEW courses AS
  SELECT 
    id, title, subtitle, description, thumbnail, total_days, created_at, updated_at
  FROM curriculum_nodes 
  WHERE node_type = 'course' AND deleted_at IS NULL;

CREATE OR REPLACE VIEW months AS
  SELECT 
    id, parent_id as course_id, order_index as month_number, title, description, icon, created_at
  FROM curriculum_nodes 
  WHERE node_type = 'month' AND deleted_at IS NULL;

CREATE OR REPLACE VIEW weeks AS
  SELECT 
    id, parent_id as month_id, order_index as week_number, title, description, focus_area, created_at
  FROM curriculum_nodes 
  WHERE node_type = 'week' AND deleted_at IS NULL;

CREATE OR REPLACE VIEW days AS
  SELECT 
    id, parent_id as week_id, order_index as day_number, title, description, estimated_hours, difficulty, created_at
  FROM curriculum_nodes 
  WHERE node_type = 'day' AND deleted_at IS NULL;

CREATE OR REPLACE VIEW lessons AS
  SELECT 
    id, parent_id as day_id, title, description as content, order_index, created_at
  FROM curriculum_nodes 
  WHERE node_type = 'lesson' AND deleted_at IS NULL;


-- ==========================================
-- Migration 02: Content Schema (Lessons, Quizzes, Projects)
-- ==========================================

-- 1. Lesson Sections
CREATE TYPE section_type_enum AS ENUM ('Introduction', 'Theory', 'Diagram', 'Example', 'Code', 'Exercise', 'Assignment', 'Summary', 'Interview Notes');

CREATE TABLE lesson_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  section_type section_type_enum NOT NULL,
  title TEXT,
  content TEXT, -- Markdown
  embedding vector(1536), -- For future AI vector search
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Code Examples (Multi-file support)
CREATE TABLE code_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE code_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  example_id UUID REFERENCES code_examples(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- 3. Coding Challenges
CREATE TABLE coding_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  starter_code TEXT,
  solution_code TEXT,
  visible_test_cases JSONB,
  hidden_test_cases JSONB,
  execution_language TEXT DEFAULT 'python',
  memory_limit_mb INTEGER DEFAULT 128,
  time_limit_sec INTEGER DEFAULT 2,
  hints JSONB DEFAULT '[]'::jsonb,
  difficulty difficulty_enum DEFAULT 'Intermediate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Resources
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'YouTube', 'Documentation', 'GitHub', 'PDF', 'Article'
  author TEXT,
  estimated_time INTEGER, -- minutes
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(lesson_id, resource_id)
);

-- 5. Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty difficulty_enum DEFAULT 'Intermediate',
  duration_hours INTEGER,
  github_repo_template TEXT,
  live_demo_url TEXT,
  architecture_details TEXT,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE project_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0
);

-- 6. Interview Sets
CREATE TABLE interview_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, -- e.g., 'Week 1 Interview', 'System Design'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES interview_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  difficulty difficulty_enum DEFAULT 'Intermediate',
  tags JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Flashcards
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quizzes
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_sec INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  marks INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0
);


-- ==========================================
-- Migration 03: User Data Schema (Progress, Notes, Bookmarks)
-- ==========================================

-- 1. Course Enrollments
CREATE TABLE course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- 2. Lesson Progress
CREATE TABLE lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  time_spent_seconds INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 3. Quiz Attempts & Answers
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  score INTEGER,
  total_marks INTEGER,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(user_id, quiz_id, attempt_number)
);

CREATE TABLE quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN,
  UNIQUE(attempt_id, question_id)
);

-- 4. Flashcard Progress (Spaced Repetition)
CREATE TABLE flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor NUMERIC(4,2) DEFAULT 2.50,
  interval_days INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  UNIQUE(user_id, flashcard_id)
);

-- 5. Project Submissions
CREATE TABLE project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_repo TEXT,
  live_demo TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'rejected')),
  feedback TEXT,
  xp_awarded INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, project_id)
);

-- 6. User Notes
CREATE TABLE user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bookmarks (Polymorphic)
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'lesson', 'project', 'resource', 'interview_question'
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);


-- ==========================================
-- Migration 04: Gamification, AI & Admin
-- ==========================================

-- 1. Badges & Gamification
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_reward INTEGER DEFAULT 0,
  unlock_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 2. Certificates
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  certificate_hash TEXT UNIQUE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  issued_by TEXT DEFAULT 'System',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 3. AI Chat Architecture
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  latency_ms INTEGER,
  cost_usd NUMERIC(10,6),
  retrieved_context_ids UUID[], -- Array of node/resource IDs used for RAG
  feedback_score INTEGER CHECK (feedback_score IN (-1, 0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partition for chat messages
CREATE TABLE chat_messages_y2026m07 PARTITION OF chat_messages
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- 4. AI Usage Logs
CREATE TABLE ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id TEXT,
  provider TEXT,
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd NUMERIC(10,6),
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Admin Audit Logs
CREATE TABLE admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Discussions
CREATE TABLE discussion_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_accepted_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT,
  action_url TEXT,
  icon TEXT,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- Migration 05: Analytics & Search
-- ==========================================

-- 1. Telemetry / Event Sourcing
CREATE TABLE user_events (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'lesson_viewed', 'video_paused', 'code_run'
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE user_events_y2026m07 PARTITION OF user_events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- 2. Full-Text Search (FTS) Additions
ALTER TABLE curriculum_nodes ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

CREATE INDEX idx_curriculum_search ON curriculum_nodes USING GIN(search_vector);

ALTER TABLE discussion_threads ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX idx_discussions_search ON discussion_threads USING GIN(search_vector);

-- 3. Materialized Views for Analytics
CREATE MATERIALIZED VIEW mv_course_analytics AS
SELECT 
  c.id as course_id,
  c.title,
  COUNT(DISTINCT ce.user_id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.user_id END) as total_completions,
  AVG(lp.completion_percentage) as avg_completion_percentage
FROM curriculum_nodes c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
LEFT JOIN lesson_progress lp ON lp.lesson_id IN (
  SELECT id FROM curriculum_nodes WHERE parent_id = c.id OR parent_id IN (
    SELECT id FROM curriculum_nodes WHERE parent_id = c.id
  )
)
WHERE c.node_type = 'course'
GROUP BY c.id, c.title;

CREATE UNIQUE INDEX idx_mv_course_analytics_id ON mv_course_analytics(course_id);

CREATE MATERIALIZED VIEW mv_user_statistics AS
SELECT
  p.id as user_id,
  COUNT(DISTINCT lp.lesson_id) as lessons_completed,
  COALESCE(SUM(lp.time_spent_seconds), 0) as total_time_spent_sec,
  COUNT(DISTINCT ps.id) as projects_submitted,
  COALESCE(AVG(qa.score::numeric / NULLIF(qa.total_marks, 0)), 0) * 100 as avg_quiz_score
FROM profiles p
LEFT JOIN lesson_progress lp ON p.id = lp.user_id AND lp.completion_percentage = 100
LEFT JOIN project_submissions ps ON p.id = ps.user_id
LEFT JOIN quiz_attempts qa ON p.id = qa.user_id
GROUP BY p.id;

CREATE UNIQUE INDEX idx_mv_user_statistics_id ON mv_user_statistics(user_id);

-- 4. Utility Functions (Timestamp Triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_curriculum_modtime BEFORE UPDATE ON curriculum_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chat_session_modtime BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_discussion_modtime BEFORE UPDATE ON discussion_threads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- Migration 06: Row Level Security (RLS) Policies
-- ==========================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- 2. Public / Authenticated Read Policies for Curriculum
-- Anyone authenticated can read published curriculum
CREATE POLICY "Public read for published paths" ON learning_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for published nodes" ON curriculum_nodes FOR SELECT TO authenticated USING (status = 'published' AND deleted_at IS NULL);
CREATE POLICY "Public read for published sections" ON lesson_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for code examples" ON code_examples FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for code files" ON code_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for challenges" ON coding_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for resources" ON resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for lesson_resources" ON lesson_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for milestones" ON project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for tasks" ON project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for project_resources" ON project_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for interview sets" ON interview_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for interview questions" ON interview_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for flashcards" ON flashcards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for quizzes" ON quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for quiz questions" ON quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for badges" ON badges FOR SELECT TO authenticated USING (true);

-- 3. User Specific Policies (CRUD on own data)
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Progress & Tracking (Select, Insert, Update on own rows)
CREATE POLICY "Users can manage own enrollments" ON course_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcard progress" ON flashcard_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own project submissions" ON project_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON user_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat System
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
);

-- Discussions
CREATE POLICY "Anyone can read discussions" ON discussion_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read replies" ON discussion_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create discussions" ON discussion_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create replies" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions" ON discussion_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON discussion_replies FOR UPDATE USING (auth.uid() = user_id);

-- 4. Service Role restricted (AI logs, certificates, audits)
CREATE POLICY "Service Role full access for AI Logs" ON ai_usage_logs FOR ALL USING (true);
CREATE POLICY "Users can read own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service Role full access for certificates" ON certificates FOR ALL USING (true);

-- 5. Admin Full Access across all tables
-- Rather than write 40 policies, we rely on Supabase Postgres bypassrls for superusers,
-- but for standard app admins we can create a generic policy structure if needed.
-- For production, it's common to let the backend (Service Role) handle admin actions, 
-- or explicitly define ALL USING (is_admin()) on curriculum tables.

CREATE POLICY "Admins can manage nodes" ON curriculum_nodes FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage lessons" ON lesson_sections FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (is_admin());
CREATE POLICY "Admins can read audits" ON admin_audit_logs FOR SELECT USING (is_admin());


-- ==========================================
-- SEED DATA
-- ==========================================

INSERT INTO curriculum_versions (id, version_name, is_active) VALUES ('00000000-0000-0000-0000-000000000001', 'v1.0 (90-Day Bootcamp)', true) ON CONFLICT DO NOTHING;
INSERT INTO learning_paths (id, title, slug, description) VALUES ('00000000-0000-0000-0000-000000000002', 'Generative AI Engineer', 'generative-ai-engineer', 'The complete 90-Day track') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_nodes (id, version_id, parent_id, node_type, title, status, difficulty, total_days) VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', NULL, 'course', '90-Day LLMOps & Generative AI Bootcamp', 'published', 'Intermediate', 90) ON CONFLICT DO NOTHING;
INSERT INTO learning_path_courses (id, path_id, course_id, order_index) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 1) ON CONFLICT DO NOTHING;

INSERT INTO curriculum_nodes (id, version_id, parent_id, node_type, title, order_index, status)
VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'month', 'Month 1', 1, 'published'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'week', 'Week 1', 1, 'published'),
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 1', 1, 'published'),
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'lesson', 'Lesson for Day 1', 1, 'published'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 2', 2, 'published'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'lesson', 'Lesson for Day 2', 1, 'published'),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 3', 3, 'published'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'lesson', 'Lesson for Day 3', 1, 'published'),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 4', 4, 'published'),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'lesson', 'Lesson for Day 4', 1, 'published'),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 5', 5, 'published'),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'lesson', 'Lesson for Day 5', 1, 'published'),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 6', 6, 'published'),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'lesson', 'Lesson for Day 6', 1, 'published'),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'day', 'Day 7', 7, 'published'),
('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 'lesson', 'Lesson for Day 7', 1, 'published'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'week', 'Week 2', 2, 'published'),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 8', 8, 'published'),
('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008', 'lesson', 'Lesson for Day 8', 1, 'published'),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 9', 9, 'published'),
('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000009', 'lesson', 'Lesson for Day 9', 1, 'published'),
('30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 10', 10, 'published'),
('40000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000a', 'lesson', 'Lesson for Day 10', 1, 'published'),
('30000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 11', 11, 'published'),
('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000b', 'lesson', 'Lesson for Day 11', 1, 'published'),
('30000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 12', 12, 'published'),
('40000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000c', 'lesson', 'Lesson for Day 12', 1, 'published'),
('30000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 13', 13, 'published'),
('40000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000d', 'lesson', 'Lesson for Day 13', 1, 'published'),
('30000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'day', 'Day 14', 14, 'published'),
('40000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000e', 'lesson', 'Lesson for Day 14', 1, 'published'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'week', 'Week 3', 3, 'published'),
('30000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 15', 15, 'published'),
('40000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000f', 'lesson', 'Lesson for Day 15', 1, 'published'),
('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 16', 16, 'published'),
('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010', 'lesson', 'Lesson for Day 16', 1, 'published'),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 17', 17, 'published'),
('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 'lesson', 'Lesson for Day 17', 1, 'published'),
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 18', 18, 'published'),
('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000012', 'lesson', 'Lesson for Day 18', 1, 'published'),
('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 19', 19, 'published'),
('40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000013', 'lesson', 'Lesson for Day 19', 1, 'published'),
('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 20', 20, 'published'),
('40000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000014', 'lesson', 'Lesson for Day 20', 1, 'published'),
('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'day', 'Day 21', 21, 'published'),
('40000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000015', 'lesson', 'Lesson for Day 21', 1, 'published'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'week', 'Week 4', 4, 'published'),
('30000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 22', 22, 'published'),
('40000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000016', 'lesson', 'Lesson for Day 22', 1, 'published'),
('30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 23', 23, 'published'),
('40000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000017', 'lesson', 'Lesson for Day 23', 1, 'published'),
('30000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 24', 24, 'published'),
('40000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000018', 'lesson', 'Lesson for Day 24', 1, 'published'),
('30000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 25', 25, 'published'),
('40000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000019', 'lesson', 'Lesson for Day 25', 1, 'published'),
('30000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 26', 26, 'published'),
('40000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001a', 'lesson', 'Lesson for Day 26', 1, 'published'),
('30000000-0000-0000-0000-00000000001b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 27', 27, 'published'),
('40000000-0000-0000-0000-00000000001b', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001b', 'lesson', 'Lesson for Day 27', 1, 'published'),
('30000000-0000-0000-0000-00000000001c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'day', 'Day 28', 28, 'published'),
('40000000-0000-0000-0000-00000000001c', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001c', 'lesson', 'Lesson for Day 28', 1, 'published'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'month', 'Month 2', 2, 'published'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'week', 'Week 5', 5, 'published'),
('30000000-0000-0000-0000-00000000001d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 29', 29, 'published'),
('40000000-0000-0000-0000-00000000001d', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001d', 'lesson', 'Lesson for Day 29', 1, 'published'),
('30000000-0000-0000-0000-00000000001e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 30', 30, 'published'),
('40000000-0000-0000-0000-00000000001e', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001e', 'lesson', 'Lesson for Day 30', 1, 'published'),
('30000000-0000-0000-0000-00000000001f', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 31', 31, 'published'),
('40000000-0000-0000-0000-00000000001f', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000001f', 'lesson', 'Lesson for Day 31', 1, 'published'),
('30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 32', 32, 'published'),
('40000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000020', 'lesson', 'Lesson for Day 32', 1, 'published'),
('30000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 33', 33, 'published'),
('40000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000021', 'lesson', 'Lesson for Day 33', 1, 'published'),
('30000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 34', 34, 'published'),
('40000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000022', 'lesson', 'Lesson for Day 34', 1, 'published'),
('30000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'day', 'Day 35', 35, 'published'),
('40000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000023', 'lesson', 'Lesson for Day 35', 1, 'published'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'week', 'Week 6', 6, 'published'),
('30000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 36', 36, 'published'),
('40000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000024', 'lesson', 'Lesson for Day 36', 1, 'published'),
('30000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 37', 37, 'published'),
('40000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000025', 'lesson', 'Lesson for Day 37', 1, 'published'),
('30000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 38', 38, 'published'),
('40000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000026', 'lesson', 'Lesson for Day 38', 1, 'published'),
('30000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 39', 39, 'published'),
('40000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000027', 'lesson', 'Lesson for Day 39', 1, 'published'),
('30000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 40', 40, 'published'),
('40000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000028', 'lesson', 'Lesson for Day 40', 1, 'published'),
('30000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 41', 41, 'published'),
('40000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000029', 'lesson', 'Lesson for Day 41', 1, 'published'),
('30000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'day', 'Day 42', 42, 'published'),
('40000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002a', 'lesson', 'Lesson for Day 42', 1, 'published'),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'week', 'Week 7', 7, 'published'),
('30000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 43', 43, 'published'),
('40000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002b', 'lesson', 'Lesson for Day 43', 1, 'published'),
('30000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 44', 44, 'published'),
('40000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002c', 'lesson', 'Lesson for Day 44', 1, 'published'),
('30000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 45', 45, 'published'),
('40000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002d', 'lesson', 'Lesson for Day 45', 1, 'published'),
('30000000-0000-0000-0000-00000000002e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 46', 46, 'published'),
('40000000-0000-0000-0000-00000000002e', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002e', 'lesson', 'Lesson for Day 46', 1, 'published'),
('30000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 47', 47, 'published'),
('40000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000002f', 'lesson', 'Lesson for Day 47', 1, 'published'),
('30000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 48', 48, 'published'),
('40000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000030', 'lesson', 'Lesson for Day 48', 1, 'published'),
('30000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'day', 'Day 49', 49, 'published'),
('40000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000031', 'lesson', 'Lesson for Day 49', 1, 'published'),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'week', 'Week 8', 8, 'published'),
('30000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 50', 50, 'published'),
('40000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000032', 'lesson', 'Lesson for Day 50', 1, 'published'),
('30000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 51', 51, 'published'),
('40000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000033', 'lesson', 'Lesson for Day 51', 1, 'published'),
('30000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 52', 52, 'published'),
('40000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000034', 'lesson', 'Lesson for Day 52', 1, 'published'),
('30000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 53', 53, 'published'),
('40000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000035', 'lesson', 'Lesson for Day 53', 1, 'published'),
('30000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 54', 54, 'published'),
('40000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000036', 'lesson', 'Lesson for Day 54', 1, 'published'),
('30000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 55', 55, 'published'),
('40000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000037', 'lesson', 'Lesson for Day 55', 1, 'published'),
('30000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'day', 'Day 56', 56, 'published'),
('40000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000038', 'lesson', 'Lesson for Day 56', 1, 'published'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'month', 'Month 3', 3, 'published'),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'week', 'Week 9', 9, 'published'),
('30000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 57', 57, 'published'),
('40000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000039', 'lesson', 'Lesson for Day 57', 1, 'published'),
('30000000-0000-0000-0000-00000000003a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 58', 58, 'published'),
('40000000-0000-0000-0000-00000000003a', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003a', 'lesson', 'Lesson for Day 58', 1, 'published'),
('30000000-0000-0000-0000-00000000003b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 59', 59, 'published'),
('40000000-0000-0000-0000-00000000003b', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003b', 'lesson', 'Lesson for Day 59', 1, 'published'),
('30000000-0000-0000-0000-00000000003c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 60', 60, 'published'),
('40000000-0000-0000-0000-00000000003c', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003c', 'lesson', 'Lesson for Day 60', 1, 'published'),
('30000000-0000-0000-0000-00000000003d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 61', 61, 'published'),
('40000000-0000-0000-0000-00000000003d', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003d', 'lesson', 'Lesson for Day 61', 1, 'published'),
('30000000-0000-0000-0000-00000000003e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 62', 62, 'published'),
('40000000-0000-0000-0000-00000000003e', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003e', 'lesson', 'Lesson for Day 62', 1, 'published'),
('30000000-0000-0000-0000-00000000003f', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000009', 'day', 'Day 63', 63, 'published'),
('40000000-0000-0000-0000-00000000003f', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000003f', 'lesson', 'Lesson for Day 63', 1, 'published'),
('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'week', 'Week 10', 10, 'published'),
('30000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 64', 64, 'published'),
('40000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000040', 'lesson', 'Lesson for Day 64', 1, 'published'),
('30000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 65', 65, 'published'),
('40000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000041', 'lesson', 'Lesson for Day 65', 1, 'published'),
('30000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 66', 66, 'published'),
('40000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000042', 'lesson', 'Lesson for Day 66', 1, 'published'),
('30000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 67', 67, 'published'),
('40000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000043', 'lesson', 'Lesson for Day 67', 1, 'published'),
('30000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 68', 68, 'published'),
('40000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000044', 'lesson', 'Lesson for Day 68', 1, 'published'),
('30000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 69', 69, 'published'),
('40000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000045', 'lesson', 'Lesson for Day 69', 1, 'published'),
('30000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'day', 'Day 70', 70, 'published'),
('40000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000046', 'lesson', 'Lesson for Day 70', 1, 'published'),
('20000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'week', 'Week 11', 11, 'published'),
('30000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 71', 71, 'published'),
('40000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000047', 'lesson', 'Lesson for Day 71', 1, 'published'),
('30000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 72', 72, 'published'),
('40000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000048', 'lesson', 'Lesson for Day 72', 1, 'published'),
('30000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 73', 73, 'published'),
('40000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000049', 'lesson', 'Lesson for Day 73', 1, 'published'),
('30000000-0000-0000-0000-00000000004a', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 74', 74, 'published'),
('40000000-0000-0000-0000-00000000004a', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004a', 'lesson', 'Lesson for Day 74', 1, 'published'),
('30000000-0000-0000-0000-00000000004b', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 75', 75, 'published'),
('40000000-0000-0000-0000-00000000004b', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004b', 'lesson', 'Lesson for Day 75', 1, 'published'),
('30000000-0000-0000-0000-00000000004c', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 76', 76, 'published'),
('40000000-0000-0000-0000-00000000004c', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004c', 'lesson', 'Lesson for Day 76', 1, 'published'),
('30000000-0000-0000-0000-00000000004d', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000b', 'day', 'Day 77', 77, 'published'),
('40000000-0000-0000-0000-00000000004d', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004d', 'lesson', 'Lesson for Day 77', 1, 'published'),
('20000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'week', 'Week 12', 12, 'published'),
('30000000-0000-0000-0000-00000000004e', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 78', 78, 'published'),
('40000000-0000-0000-0000-00000000004e', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004e', 'lesson', 'Lesson for Day 78', 1, 'published'),
('30000000-0000-0000-0000-00000000004f', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 79', 79, 'published'),
('40000000-0000-0000-0000-00000000004f', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000004f', 'lesson', 'Lesson for Day 79', 1, 'published'),
('30000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 80', 80, 'published'),
('40000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000050', 'lesson', 'Lesson for Day 80', 1, 'published'),
('30000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 81', 81, 'published'),
('40000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000051', 'lesson', 'Lesson for Day 81', 1, 'published'),
('30000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 82', 82, 'published'),
('40000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000052', 'lesson', 'Lesson for Day 82', 1, 'published'),
('30000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000c', 'day', 'Day 83', 83, 'published'),
('40000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000053', 'lesson', 'Lesson for Day 83', 1, 'published') ON CONFLICT DO NOTHING;

INSERT INTO lesson_sections (id, lesson_id, section_type, title, content, order_index)
VALUES
(gen_random_uuid(), '40000000-0000-0000-0000-000000000001', 'Theory', 'Understanding Core Concepts for Day 1', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000001', 'Code', 'Implementation Details', 'print("Day 1")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000002', 'Theory', 'Understanding Core Concepts for Day 2', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000002', 'Code', 'Implementation Details', 'print("Day 2")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000003', 'Theory', 'Understanding Core Concepts for Day 3', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000003', 'Code', 'Implementation Details', 'print("Day 3")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000004', 'Theory', 'Understanding Core Concepts for Day 4', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000004', 'Code', 'Implementation Details', 'print("Day 4")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000005', 'Theory', 'Understanding Core Concepts for Day 5', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000005', 'Code', 'Implementation Details', 'print("Day 5")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000006', 'Theory', 'Understanding Core Concepts for Day 6', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000006', 'Code', 'Implementation Details', 'print("Day 6")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000007', 'Theory', 'Understanding Core Concepts for Day 7', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000007', 'Code', 'Implementation Details', 'print("Day 7")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000008', 'Theory', 'Understanding Core Concepts for Day 8', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000008', 'Code', 'Implementation Details', 'print("Day 8")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000009', 'Theory', 'Understanding Core Concepts for Day 9', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000009', 'Code', 'Implementation Details', 'print("Day 9")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000a', 'Theory', 'Understanding Core Concepts for Day 10', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000a', 'Code', 'Implementation Details', 'print("Day 10")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000b', 'Theory', 'Understanding Core Concepts for Day 11', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000b', 'Code', 'Implementation Details', 'print("Day 11")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000c', 'Theory', 'Understanding Core Concepts for Day 12', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000c', 'Code', 'Implementation Details', 'print("Day 12")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000d', 'Theory', 'Understanding Core Concepts for Day 13', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000d', 'Code', 'Implementation Details', 'print("Day 13")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000e', 'Theory', 'Understanding Core Concepts for Day 14', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000e', 'Code', 'Implementation Details', 'print("Day 14")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000f', 'Theory', 'Understanding Core Concepts for Day 15', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000f', 'Code', 'Implementation Details', 'print("Day 15")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000010', 'Theory', 'Understanding Core Concepts for Day 16', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000010', 'Code', 'Implementation Details', 'print("Day 16")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000011', 'Theory', 'Understanding Core Concepts for Day 17', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000011', 'Code', 'Implementation Details', 'print("Day 17")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000012', 'Theory', 'Understanding Core Concepts for Day 18', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000012', 'Code', 'Implementation Details', 'print("Day 18")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000013', 'Theory', 'Understanding Core Concepts for Day 19', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000013', 'Code', 'Implementation Details', 'print("Day 19")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000014', 'Theory', 'Understanding Core Concepts for Day 20', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000014', 'Code', 'Implementation Details', 'print("Day 20")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000015', 'Theory', 'Understanding Core Concepts for Day 21', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000015', 'Code', 'Implementation Details', 'print("Day 21")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000016', 'Theory', 'Understanding Core Concepts for Day 22', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000016', 'Code', 'Implementation Details', 'print("Day 22")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000017', 'Theory', 'Understanding Core Concepts for Day 23', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000017', 'Code', 'Implementation Details', 'print("Day 23")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000018', 'Theory', 'Understanding Core Concepts for Day 24', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000018', 'Code', 'Implementation Details', 'print("Day 24")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000019', 'Theory', 'Understanding Core Concepts for Day 25', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000019', 'Code', 'Implementation Details', 'print("Day 25")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001a', 'Theory', 'Understanding Core Concepts for Day 26', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001a', 'Code', 'Implementation Details', 'print("Day 26")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001b', 'Theory', 'Understanding Core Concepts for Day 27', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001b', 'Code', 'Implementation Details', 'print("Day 27")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001c', 'Theory', 'Understanding Core Concepts for Day 28', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001c', 'Code', 'Implementation Details', 'print("Day 28")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001d', 'Theory', 'Understanding Core Concepts for Day 29', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001d', 'Code', 'Implementation Details', 'print("Day 29")', 4),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001e', 'Theory', 'Understanding Core Concepts for Day 30', 'Theory content.', 1),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001e', 'Code', 'Implementation Details', 'print("Day 30")', 4) ON CONFLICT DO NOTHING;

INSERT INTO projects (id, title, difficulty) VALUES ('00000000-0000-0000-0000-000000000004', 'AI Chatbot', 'Advanced') ON CONFLICT DO NOTHING;
INSERT INTO project_milestones (id, project_id, title, order_index) VALUES ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Backend', 1), ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'RAG', 2) ON CONFLICT DO NOTHING;
INSERT INTO project_tasks (id, milestone_id, title) VALUES (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'Task 1'), (gen_random_uuid(), '50000000-0000-0000-0000-000000000002', 'Task 2') ON CONFLICT DO NOTHING;

INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, execution_language)
VALUES
(gen_random_uuid(), '40000000-0000-0000-0000-000000000001', 'Day 1 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000002', 'Day 2 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000003', 'Day 3 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000004', 'Day 4 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000005', 'Day 5 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000006', 'Day 6 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000007', 'Day 7 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000008', 'Day 8 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000009', 'Day 9 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000a', 'Day 10 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000b', 'Day 11 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000c', 'Day 12 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000d', 'Day 13 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000e', 'Day 14 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000f', 'Day 15 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000010', 'Day 16 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000011', 'Day 17 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000012', 'Day 18 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000013', 'Day 19 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000014', 'Day 20 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000015', 'Day 21 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000016', 'Day 22 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000017', 'Day 23 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000018', 'Day 24 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000019', 'Day 25 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001a', 'Day 26 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001b', 'Day 27 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001c', 'Day 28 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001d', 'Day 29 Challenge', 'Solve this.', 'pass', 'python'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001e', 'Day 30 Challenge', 'Solve this.', 'pass', 'python') ON CONFLICT DO NOTHING;

INSERT INTO interview_sets (id, title) VALUES ('00000000-0000-0000-0000-000000000006', 'Month 1 Interviews') ON CONFLICT DO NOTHING;
INSERT INTO interview_questions (id, set_id, question, answer, category)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q1', 'A1', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q2', 'A2', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q3', 'A3', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q4', 'A4', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q5', 'A5', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q6', 'A6', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q7', 'A7', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q8', 'A8', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q9', 'A9', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q10', 'A10', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q11', 'A11', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q12', 'A12', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q13', 'A13', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q14', 'A14', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q15', 'A15', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q16', 'A16', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q17', 'A17', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q18', 'A18', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q19', 'A19', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q20', 'A20', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q21', 'A21', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q22', 'A22', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q23', 'A23', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q24', 'A24', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q25', 'A25', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q26', 'A26', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q27', 'A27', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q28', 'A28', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q29', 'A29', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q30', 'A30', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q31', 'A31', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q32', 'A32', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q33', 'A33', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q34', 'A34', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q35', 'A35', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q36', 'A36', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q37', 'A37', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q38', 'A38', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q39', 'A39', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q40', 'A40', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q41', 'A41', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q42', 'A42', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q43', 'A43', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q44', 'A44', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q45', 'A45', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q46', 'A46', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q47', 'A47', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q48', 'A48', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q49', 'A49', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q50', 'A50', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q51', 'A51', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q52', 'A52', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q53', 'A53', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q54', 'A54', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q55', 'A55', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q56', 'A56', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q57', 'A57', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q58', 'A58', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q59', 'A59', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q60', 'A60', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q61', 'A61', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q62', 'A62', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q63', 'A63', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q64', 'A64', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q65', 'A65', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q66', 'A66', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q67', 'A67', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q68', 'A68', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q69', 'A69', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q70', 'A70', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q71', 'A71', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q72', 'A72', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q73', 'A73', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q74', 'A74', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q75', 'A75', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q76', 'A76', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q77', 'A77', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q78', 'A78', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q79', 'A79', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q80', 'A80', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q81', 'A81', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q82', 'A82', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q83', 'A83', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q84', 'A84', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q85', 'A85', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q86', 'A86', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q87', 'A87', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q88', 'A88', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q89', 'A89', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q90', 'A90', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q91', 'A91', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q92', 'A92', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q93', 'A93', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q94', 'A94', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q95', 'A95', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q96', 'A96', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q97', 'A97', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q98', 'A98', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q99', 'A99', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q100', 'A100', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q101', 'A101', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q102', 'A102', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q103', 'A103', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q104', 'A104', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q105', 'A105', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q106', 'A106', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q107', 'A107', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q108', 'A108', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q109', 'A109', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q110', 'A110', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q111', 'A111', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q112', 'A112', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q113', 'A113', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q114', 'A114', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q115', 'A115', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q116', 'A116', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q117', 'A117', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q118', 'A118', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q119', 'A119', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q120', 'A120', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q121', 'A121', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q122', 'A122', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q123', 'A123', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q124', 'A124', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q125', 'A125', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q126', 'A126', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q127', 'A127', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q128', 'A128', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q129', 'A129', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q130', 'A130', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q131', 'A131', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q132', 'A132', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q133', 'A133', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q134', 'A134', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q135', 'A135', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q136', 'A136', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q137', 'A137', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q138', 'A138', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q139', 'A139', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q140', 'A140', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q141', 'A141', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q142', 'A142', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q143', 'A143', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q144', 'A144', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q145', 'A145', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q146', 'A146', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q147', 'A147', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q148', 'A148', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q149', 'A149', 'Python'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', 'Q150', 'A150', 'Python') ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, title) VALUES ('00000000-0000-0000-0000-000000000005', 'Month 1 Quiz') ON CONFLICT DO NOTHING;
INSERT INTO quiz_questions (id, quiz_id, question, options, correct_index)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q1', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q2', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q3', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q4', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q5', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q6', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q7', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q8', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q9', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q10', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q11', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q12', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q13', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q14', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q15', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q16', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q17', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q18', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q19', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q20', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q21', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q22', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q23', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q24', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q25', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q26', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q27', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q28', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q29', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q30', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q31', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q32', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q33', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q34', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q35', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q36', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q37', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q38', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q39', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q40', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q41', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q42', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q43', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q44', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q45', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q46', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q47', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q48', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q49', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q50', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q51', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q52', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q53', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q54', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q55', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q56', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q57', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q58', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q59', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q60', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q61', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q62', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q63', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q64', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q65', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q66', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q67', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q68', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q69', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q70', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q71', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q72', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q73', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q74', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q75', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q76', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q77', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q78', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q79', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q80', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q81', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q82', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q83', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q84', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q85', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q86', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q87', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q88', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q89', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q90', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q91', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q92', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q93', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q94', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q95', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q96', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q97', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q98', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q99', '["A", "B"]'::jsonb, 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Q100', '["A", "B"]'::jsonb, 1) ON CONFLICT DO NOTHING;

INSERT INTO flashcards (id, question, answer, category)
VALUES
(gen_random_uuid(), 'Flashcard 1', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 2', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 3', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 4', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 5', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 6', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 7', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 8', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 9', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 10', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 11', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 12', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 13', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 14', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 15', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 16', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 17', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 18', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 19', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 20', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 21', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 22', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 23', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 24', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 25', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 26', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 27', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 28', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 29', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 30', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 31', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 32', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 33', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 34', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 35', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 36', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 37', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 38', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 39', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 40', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 41', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 42', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 43', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 44', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 45', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 46', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 47', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 48', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 49', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 50', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 51', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 52', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 53', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 54', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 55', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 56', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 57', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 58', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 59', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 60', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 61', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 62', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 63', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 64', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 65', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 66', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 67', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 68', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 69', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 70', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 71', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 72', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 73', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 74', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 75', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 76', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 77', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 78', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 79', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 80', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 81', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 82', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 83', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 84', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 85', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 86', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 87', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 88', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 89', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 90', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 91', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 92', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 93', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 94', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 95', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 96', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 97', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 98', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 99', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 100', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 101', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 102', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 103', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 104', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 105', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 106', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 107', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 108', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 109', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 110', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 111', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 112', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 113', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 114', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 115', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 116', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 117', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 118', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 119', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 120', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 121', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 122', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 123', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 124', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 125', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 126', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 127', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 128', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 129', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 130', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 131', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 132', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 133', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 134', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 135', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 136', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 137', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 138', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 139', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 140', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 141', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 142', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 143', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 144', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 145', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 146', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 147', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 148', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 149', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 150', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 151', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 152', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 153', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 154', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 155', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 156', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 157', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 158', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 159', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 160', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 161', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 162', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 163', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 164', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 165', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 166', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 167', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 168', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 169', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 170', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 171', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 172', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 173', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 174', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 175', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 176', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 177', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 178', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 179', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 180', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 181', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 182', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 183', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 184', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 185', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 186', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 187', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 188', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 189', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 190', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 191', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 192', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 193', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 194', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 195', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 196', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 197', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 198', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 199', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 200', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 201', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 202', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 203', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 204', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 205', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 206', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 207', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 208', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 209', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 210', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 211', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 212', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 213', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 214', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 215', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 216', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 217', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 218', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 219', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 220', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 221', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 222', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 223', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 224', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 225', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 226', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 227', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 228', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 229', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 230', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 231', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 232', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 233', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 234', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 235', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 236', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 237', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 238', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 239', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 240', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 241', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 242', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 243', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 244', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 245', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 246', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 247', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 248', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 249', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 250', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 251', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 252', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 253', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 254', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 255', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 256', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 257', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 258', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 259', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 260', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 261', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 262', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 263', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 264', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 265', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 266', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 267', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 268', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 269', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 270', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 271', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 272', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 273', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 274', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 275', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 276', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 277', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 278', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 279', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 280', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 281', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 282', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 283', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 284', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 285', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 286', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 287', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 288', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 289', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 290', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 291', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 292', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 293', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 294', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 295', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 296', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 297', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 298', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 299', 'Answer', 'CS'),
(gen_random_uuid(), 'Flashcard 300', 'Answer', 'CS') ON CONFLICT DO NOTHING;

INSERT INTO resources (id, title, url, type, author)
VALUES
('60000000-0000-0000-0000-000000000001', 'Res 1', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000002', 'Res 2', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000003', 'Res 3', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000004', 'Res 4', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000005', 'Res 5', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000006', 'Res 6', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000007', 'Res 7', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000008', 'Res 8', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000009', 'Res 9', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000a', 'Res 10', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000b', 'Res 11', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000c', 'Res 12', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000d', 'Res 13', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000e', 'Res 14', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000000f', 'Res 15', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000010', 'Res 16', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000011', 'Res 17', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000012', 'Res 18', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000013', 'Res 19', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000014', 'Res 20', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000015', 'Res 21', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000016', 'Res 22', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000017', 'Res 23', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000018', 'Res 24', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-000000000019', 'Res 25', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000001a', 'Res 26', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000001b', 'Res 27', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000001c', 'Res 28', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000001d', 'Res 29', 'url', 'YouTube', 'Author'),
('60000000-0000-0000-0000-00000000001e', 'Res 30', 'url', 'YouTube', 'Author') ON CONFLICT DO NOTHING;

INSERT INTO lesson_resources (id, lesson_id, resource_id)
VALUES
(gen_random_uuid(), '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000007'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000008'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000009'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-00000000000a'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000b', '60000000-0000-0000-0000-00000000000b'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000c', '60000000-0000-0000-0000-00000000000c'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000d', '60000000-0000-0000-0000-00000000000d'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000e', '60000000-0000-0000-0000-00000000000e'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000000f', '60000000-0000-0000-0000-00000000000f'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000010'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000011'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000012'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000013'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000014'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000015'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000016', '60000000-0000-0000-0000-000000000016'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000017', '60000000-0000-0000-0000-000000000017'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000018', '60000000-0000-0000-0000-000000000018'),
(gen_random_uuid(), '40000000-0000-0000-0000-000000000019', '60000000-0000-0000-0000-000000000019'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001a', '60000000-0000-0000-0000-00000000001a'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001b', '60000000-0000-0000-0000-00000000001b'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001c', '60000000-0000-0000-0000-00000000001c'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001d', '60000000-0000-0000-0000-00000000001d'),
(gen_random_uuid(), '40000000-0000-0000-0000-00000000001e', '60000000-0000-0000-0000-00000000001e') ON CONFLICT DO NOTHING;

-- ==========================================
-- Migration 07: Finance & Budgeting
-- ==========================================

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  source TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(10,2) NOT NULL,
  month_year TEXT NOT NULL, -- e.g. '2026-08'
  UNIQUE(user_id, category, month_year)
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own income" ON income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- Migration 08: Health & Workout
-- ==========================================

CREATE TABLE workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  weight_lbs NUMERIC(5,2)
);

CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER
);

CREATE TABLE health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(4,2),
  water_glasses INTEGER DEFAULT 0,
  steps INTEGER DEFAULT 0,
  weight NUMERIC(5,2),
  UNIQUE(user_id, date)
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout_plans" ON workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own exercises" ON exercises FOR ALL USING (
  workout_plan_id IN (SELECT id FROM workout_plans WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own workout_logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health_metrics" ON health_metrics FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- Migration 09: Tasks & Planner
-- ==========================================

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL
);

CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, habit_id, date)
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own time_blocks" ON time_blocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit_logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- Migration 10: Career & Skills
-- ==========================================

CREATE TABLE career_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_job_title TEXT,
  target_job_title TEXT,
  years_experience NUMERIC(3,1) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT
);

CREATE TABLE user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
  target_level INTEGER DEFAULT 5 CHECK (target_level BETWEEN 1 AND 5),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career_profiles" ON career_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read skills" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage skills" ON skills FOR ALL USING (is_admin());
CREATE POLICY "Users can manage own user_skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_career_profiles_modtime BEFORE UPDATE ON career_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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

CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own income" ON income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring_bills" ON recurring_bills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shifts" ON shifts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shift_patterns" ON shift_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own home_visits" ON home_visits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 4. Updated At Triggers
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
