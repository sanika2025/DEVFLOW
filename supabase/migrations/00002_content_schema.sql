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
