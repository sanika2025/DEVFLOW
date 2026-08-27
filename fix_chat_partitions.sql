-- Fix for the chat_messages partition error
-- This creates a default partition so that any messages sent after August 2026 won't fail to insert.
CREATE TABLE chat_messages_default PARTITION OF chat_messages DEFAULT;
