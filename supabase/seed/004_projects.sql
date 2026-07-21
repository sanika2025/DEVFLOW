-- ==========================================
-- Seed 004: Projects
-- ==========================================

-- 1. Insert Project
INSERT INTO projects (id, title, description, difficulty, duration_hours, github_repo_template)
VALUES 
('proj_00000000-0000-0000-0000-000000000000', 'Enterprise AI Customer Support Chatbot', 'Build a production-grade AI Chatbot using RAG, FastAPI, and Pinecone.', 'Advanced', 40, 'https://github.com/devflow/ai-chatbot-template')
ON CONFLICT DO NOTHING;

-- 2. Insert Milestones
INSERT INTO project_milestones (id, project_id, title, description, order_index)
VALUES 
('mile_10000000-0000-0000-0000-000000000000', 'proj_00000000-0000-0000-0000-000000000000', 'Milestone 1: Backend Setup', 'Setup FastAPI and initial routes.', 1),
('mile_20000000-0000-0000-0000-000000000000', 'proj_00000000-0000-0000-0000-000000000000', 'Milestone 2: RAG Integration', 'Connect to Pinecone and implement document retrieval.', 2),
('mile_30000000-0000-0000-0000-000000000000', 'proj_00000000-0000-0000-0000-000000000000', 'Milestone 3: Deployment', 'Dockerize the application and deploy to AWS.', 3)
ON CONFLICT DO NOTHING;

-- 3. Insert Tasks
INSERT INTO project_tasks (id, milestone_id, title, description, order_index)
VALUES 
(gen_random_uuid(), 'mile_10000000-0000-0000-0000-000000000000', 'Initialize FastAPI App', 'Create main.py with a health check endpoint.', 1),
(gen_random_uuid(), 'mile_10000000-0000-0000-0000-000000000000', 'Configure Database', 'Setup SQLAlchemy and connect to PostgreSQL.', 2),
(gen_random_uuid(), 'mile_20000000-0000-0000-0000-000000000000', 'Pinecone Setup', 'Create a vector index in Pinecone.', 1),
(gen_random_uuid(), 'mile_20000000-0000-0000-0000-000000000000', 'Embed Documents', 'Use OpenAI to generate embeddings for knowledge base.', 2),
(gen_random_uuid(), 'mile_30000000-0000-0000-0000-000000000000', 'Write Dockerfile', 'Create a multi-stage Dockerfile for the FastAPI app.', 1)
ON CONFLICT DO NOTHING;
