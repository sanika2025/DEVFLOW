-- ==============================================================================
-- Day 6: Embeddings
-- Note: Replace ffa702ca-07f0-476d-8de4-5adc84c7fa6f with the actual UUID of the Day 6 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'The Vector Space', 'MARKDOWN', 'An embedding is a list of floating-point numbers. An embedding model is trained to place words or sentences that have similar meanings close to each other in this high-dimensional space.', 1),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Cosine Similarity', 'MARKDOWN', 'Cosine similarity measures the angle between two vectors, regardless of magnitude. 1.0 = perfect similarity (0 degrees). 0.0 = orthogonal (90 degrees). -1.0 = exact opposite.', 2),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Semantic Search vs Keyword Search', 'MARKDOWN', 'Keyword Search (BM25) requires exact string overlap. Semantic Search uses embeddings to match on meaning, powering RAG (Retrieval-Augmented Generation).', 3),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Semantic Search Flow', 'MERMAID', 'flowchart TD\n    subgraph Query Pipeline\n        User[User Question] --> EmbedModel[Embedding Model]\n        EmbedModel --> QueryVec[Query Vector]\n        QueryVec -->|Cosine Similarity| VecDB[(Vector DB)]\n        VecDB -->|Top-K Chunks| Prompt[Construct Prompt]\n        Prompt --> LLM\n    end', 4),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Code Example: Cosine Similarity', 'CODE', 'import numpy as np\n\ndef cosine_similarity(v1, v2):\n    dot_product = np.dot(v1, v2)\n    norm_v1 = np.linalg.norm(v1)\n    norm_v2 = np.linalg.norm(v2)\n    if norm_v1 == 0 or norm_v2 == 0:\n        return 0.0\n    return dot_product / (norm_v1 * norm_v2)', 5);

-- 2. Quizzes
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Day 6 Quiz: Embeddings', 'Test your knowledge on vector spaces, cosine similarity, and semantic search.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'What is an Embedding?', 'A SQL table.', 'A list of floating-point numbers representing semantic meaning.', 'A type of neural network layer.', 'A token used for padding.', 'B', 'Embeddings map text to continuous mathematical vectors.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'Why is Cosine Similarity preferred over Euclidean Distance for embeddings?', 'Faster to compute.', 'Focuses on the angle/direction, robust to variations in document length.', 'Only works on GPUs.', 'Euclidean distance is limited to 3D.', 'B', 'A short query and long document might have high Euclidean distance but point in the exact same semantic direction.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'What is the cosine similarity of two orthogonal vectors?', '1.0', '-1.0', '0.0', '100.0', 'C', 'The cosine of 90 degrees is 0.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'Which search method successfully matches "terminate account" with "cancel subscription"?', 'TF-IDF', 'BM25', 'Regex Search', 'Semantic Search', 'D', 'Semantic search matches on meaning (vector proximity).'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'What does RAG stand for?', 'Random Access Generation', 'Retrieval-Augmented Generation', 'Real-time Artificial Generation', 'Recurrent Attention Gate', 'B', 'Retrieving documents via semantic search and augmenting the prompt.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'In a RAG pipeline, when is the Vector Database queried?', 'Offline phase.', 'Model pre-training.', 'Real-time, after the user asks a question.', 'After LLM generation.', 'C', 'The query is vectorized on the fly to search the DB.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'What happens if you embed the Query with model A but Documents with model B?', 'Works perfectly.', 'DB automatically translates.', 'Total garbage results.', 'LLM hallucinates.', 'C', 'Different models create entirely different vector spaces.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'If dot product of two normalized vectors is 1.0, what does it mean?', 'Unrelated.', 'Identical direction (perfect similarity).', 'Opposite direction.', 'Crash.', 'B', 'For normalized vectors, dot product equals cosine similarity.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'Which is a popular Vector Database?', 'MongoDB', 'Redis', 'Pinecone', 'SQLite', 'C', 'Pinecone, Milvus, and pgvector are built for fast NN search.'),
('d74f785d-8036-466c-b0df-bb39479f2b4d', 'Why must documents be "chunked" before embedding?', 'To save money.', 'Embedding models have token limits, and massive documents lose granular detail if averaged into one vector.', 'DBs only store integers.', 'Prevent prompt injection.', 'B', 'Chunking preserves specific facts for accurate retrieval.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('302aba82-21e9-4a2c-9b49-e16f7f63b3c8', 'ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Top-K Semantic Retriever', 'Given a query vector, a list of document vectors, and k, return the indices of the top k most similar documents using Cosine Similarity. Preserve order on ties.', '`query` (list), `documents` (list of lists), `k` (int)', 'list of ints', 'Pure Python.', 'def retrieve_top_k(query: list[float], documents: list[list[float]], k: int) -> list[int]:\n    pass', 'import math\ndef sim(v1, v2):\n    d = sum(a*b for a,b in zip(v1,v2))\n    n1 = math.sqrt(sum(a*a for a in v1))\n    n2 = math.sqrt(sum(b*b for b in v2))\n    return 0.0 if n1==0 or n2==0 else d/(n1*n2)\n\ndef retrieve_top_k(q, docs, k):\n    s = [(sim(q, d), i) for i, d in enumerate(docs)]\n    s.sort(key=lambda x: x[0], reverse=True)\n    return [i for _, i in s[:k]]');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'What is an Embedding?', 'A numerical representation (vector) of text where distance represents semantic similarity.', 'EASY'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'What is Cosine Similarity?', 'A metric measuring the angle between vectors (1 for identical, 0 for orthogonal, -1 for opposite).', 'EASY'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Keyword vs Semantic Search?', 'Keyword looks for exact strings. Semantic looks for meaning using vectors.', 'MEDIUM'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'What is RAG?', 'Retrieval-Augmented Generation. Supplying an LLM with relevant facts retrieved from a DB.', 'MEDIUM'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Primary purpose of a Vector DB?', 'To store high-dimensional embeddings and perform ultra-fast Nearest-Neighbor searches.', 'MEDIUM'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Why chunk documents before embedding?', 'To fit context windows and preserve granular semantic meaning.', 'HARD'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Can you compare embeddings from two different models?', 'No. They map to entirely different vector spaces.', 'MEDIUM'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Cosine similarity of vectors pointing in opposite directions?', '-1.0', 'EASY'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Name one Vector DB.', 'Pinecone, Milvus, Qdrant, or Postgres (pgvector).', 'EASY'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Why Cosine over Euclidean for NLP?', 'It is magnitude-invariant, focusing on direction (meaning) rather than text length.', 'HARD');

-- 6. Interview Sets
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('28d7072e-e6e9-4fbd-9bd9-2d05067c8ed1', 'ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Day 6 Interview Prep', 'MIXED');

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Understanding Embeddings (OpenAI)', 'https://platform.openai.com/docs/guides/embeddings', 'DOCS'),
('ffa702ca-07f0-476d-8de4-5adc84c7fa6f', 'Vector Databases Explained', 'https://www.youtube.com/watch?v=klTvEwg3oJ4', 'VIDEO');
