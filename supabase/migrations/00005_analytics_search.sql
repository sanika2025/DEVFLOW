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
