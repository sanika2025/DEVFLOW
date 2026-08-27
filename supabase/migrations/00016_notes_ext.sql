-- ==========================================
-- Migration 16: User Notes Extensions
-- ==========================================

-- We need to add explicit columns to user_notes to support the Knowledge Hub features.
-- Since the table already exists, we will use ALTER TABLE.

ALTER TABLE user_notes 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Note',
ADD COLUMN IF NOT EXISTS folder_id TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revision_status TEXT DEFAULT 'Not Reviewed' CHECK (revision_status IN ('Not Reviewed', 'Reviewing', 'Mastered')),
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;

-- We can also add an index to speed up folder and revision queries
CREATE INDEX IF NOT EXISTS idx_user_notes_folder ON user_notes(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_revision ON user_notes(user_id, revision_status);
