-- ==========================================
-- Seed 001: Learning Paths & Curriculum Version
-- ==========================================

-- 1. Insert Curriculum Version
INSERT INTO curriculum_versions (id, version_name, is_active)
VALUES 
('v1_00000000-0000-0000-0000-000000000000', 'v1.0 (90-Day Bootcamp)', true)
ON CONFLICT DO NOTHING;

-- 2. Insert Learning Path (Only ONE record)
INSERT INTO learning_paths (id, title, slug, description)
VALUES 
('path_0000000-0000-0000-0000-000000000000', 'Generative AI Engineer', 'generative-ai-engineer', 'The complete 90-Day track to become an LLMOps & Generative AI Engineer.')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

-- 3. Insert Core Course Node (Level 0)
INSERT INTO curriculum_nodes (id, version_id, parent_id, node_type, title, status, difficulty, total_days)
VALUES 
('course_00000-0000-0000-0000-000000000000', 'v1_00000000-0000-0000-0000-000000000000', NULL, 'course', '90-Day LLMOps & Generative AI Bootcamp', 'published', 'Intermediate', 90)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 4. Map Path to Course
INSERT INTO learning_path_courses (id, path_id, course_id, order_index)
VALUES 
('map_00000000-0000-0000-0000-000000000000', 'path_0000000-0000-0000-0000-000000000000', 'course_00000-0000-0000-0000-000000000000', 1)
ON CONFLICT DO NOTHING;
