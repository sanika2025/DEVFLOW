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
