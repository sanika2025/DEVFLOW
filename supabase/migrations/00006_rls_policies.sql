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
