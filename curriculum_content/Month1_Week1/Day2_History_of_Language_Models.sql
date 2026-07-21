-- ==============================================================================
-- Day 2: History of Language Models
-- Note: Replace da3a859d-e60d-49c8-9937-5d751952d5a2 with the actual UUID of the Day 2 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'The Dark Ages of NLP: Bag of Words (BoW) & TF-IDF', 'MARKDOWN', 'Before neural networks dominated NLP, statistical methods were the standard. Bag of Words (BoW): Treats text as an unordered collection. Problem: "The dog bit the man" and "The man bit the dog" have the exact same representation. TF-IDF: Penalizes frequent words, rewards rare words. Problem: Still ignores word order.', 1),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'The Embedding Revolution & Sequential Era', 'MARKDOWN', 'Word2Vec (2013): Represented words as dense mathematical vectors in a continuous vector space. Captures semantic relationships. Limitation: static embeddings. RNNs (Recurrent Neural Networks): Process tokens sequentially. Advantage: respects word order. Limitation: Vanishing gradients. LSTMs solved short term memory with gates.', 2),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'The NLP Evolution Timeline', 'MERMAID', 'timeline\n    title The Evolution of Language Models\n    pre-2010 : Bag of Words & TF-IDF\n             : Hidden Markov Models\n    2013     : Word2Vec (Static Embeddings)\n    2014     : Seq2Seq Models\n    2015     : LSTMs dominate NLP\n    2017     : The Transformer (Attention Is All You Need)\n    2018     : BERT (Google) & GPT-1 (OpenAI)\n    2020     : GPT-3 (Massive Scale Emergence)\n    2022     : ChatGPT (RLHF alignment)\n    2023     : GPT-4 & Open Source explosion (Llama)', 3),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Code Example: BoW vs Word2Vec', 'CODE', 'from sklearn.feature_extraction.text import CountVectorizer\nimport numpy as np\n\nvectorizer = CountVectorizer()\nX = vectorizer.fit_transform(["The dog bit the man.", "The man bit the dog."])\n# Vectors are identical, losing semantic meaning.\n\n# Word2Vec math: King - Man + Woman = Queen', 4);

-- 2. Quizzes
-- Replace 1f6eaa79-d7fd-4e4a-b736-5f93e6560f16 with a fresh UUID.
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'da3a859d-e60d-49c8-9937-5d751952d5a2', 'Day 2 Quiz: History of Language Models', 'Test your knowledge on BoW, Word2Vec, RNNs, LSTMs, and the rise of Transformers.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'What is the primary limitation of the Bag of Words (BoW) model?', 'It cannot handle large datasets.', 'It is too computationally expensive.', 'It completely ignores word order and semantics.', 'It only works on English text.', 'C', 'BoW just counts occurrences, losing all structural meaning.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'How did Word2Vec represent words?', 'As a single integer ID.', 'As a sparse array of 1s and 0s.', 'As dense, continuous mathematical vectors.', 'As SQL tables.', 'C', 'Word2Vec mapped words into a dense vector space where distance relates to semantic similarity.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'What is the "Vanishing Gradient" problem in RNNs?', 'The GPUs run out of memory.', 'The error signals become too small to update weights for earlier tokens during backpropagation.', 'The model forgets how to output text.', 'The learning rate is too high.', 'B', 'Gradient < 1 shrinks exponentially, preventing learning of long-term dependencies.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'Which architecture introduced gates to solve short-term memory issues?', 'CNN', 'LSTM', 'BERT', 'TF-IDF', 'B', 'Long Short-Term Memory networks combat vanishing gradients in standard RNNs using gates.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'Why are LSTMs difficult to scale on modern hardware compared to Transformers?', 'They use too much RAM.', 'They are strictly sequential, meaning they cannot be processed in parallel.', 'They only work on CPUs.', 'They do not support multiple languages.', 'B', 'LSTMs require sequential processing (step N requires step N-1), making GPU parallelization inefficient.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'What problem does a static embedding (Word2Vec) have that Transformers solve?', 'Takes up too much disk space.', 'Assigns the exact same vector to a word regardless of context.', 'Cannot be used in Python.', 'Only supports 100 words.', 'B', 'Word2Vec has one fixed vector for "bank". Transformers generate contextual embeddings dynamically.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'The original Transformer model was introduced in which paper?', 'Language Models are Few-Shot Learners', 'Attention Is All You Need', 'Word2Vec Explained', 'Deep Residual Learning', 'B', 'Published in 2017 by Google researchers.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'Which scaling paradigm did GPT-3 prove to the world?', 'Smaller models are always better.', 'Rule-based logic outperforms neural networks.', 'Massive scale leads to emergent few-shot capabilities.', 'LSTMs are superior to Transformers.', 'C', 'GPT-3 demonstrated that massive scale allows for zero-shot and few-shot problem solving.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'TF-IDF stands for:', 'Term Frequency - Inverse Document Frequency', 'Text Format - Internal Document File', 'Token Frequency - Index Data Format', 'Text Frequency - Inverse Data Format', 'A', 'It is a statistical measure used to evaluate word importance in a document.'),
('1f6eaa79-d7fd-4e4a-b736-5f93e6560f16', 'Which GPT version popularized the use of RLHF for chat alignment?', 'GPT-1', 'GPT-2', 'InstructGPT / ChatGPT', 'Word2Vec', 'C', 'InstructGPT and ChatGPT introduced RLHF to align responses with human preferences.');

-- 4. Coding Challenges
-- Replace 0fb71f25-12c1-4eea-8cbd-2cbc3ea7bff5 with a fresh UUID.
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('0fb71f25-12c1-4eea-8cbd-2cbc3ea7bff5', 'da3a859d-e60d-49c8-9937-5d751952d5a2', 'Implement Term Frequency', 'Implement a naive TF (Term Frequency) calculator. Return the term frequency: raw count of the term divided by total number of words. Ignore punctuation and case.', '`document` (str), `term` (str)', 'float', 'Length of document <= 10^4. Alphanumeric and spaces only.', 'def calculate_tf(document: str, term: str) -> float:\n    pass', 'def calculate_tf(document: str, term: str) -> float:\n    if not document:\n        return 0.0\n    words = document.lower().split()\n    return words.count(term.lower()) / len(words)');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'What is Bag of Words (BoW)?', 'Text representation that counts word occurrences but ignores word order and semantics.', 'EASY'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'What problem did Word2Vec solve over BoW?', 'It captured semantic meaning using dense continuous vectors.', 'MEDIUM'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'What is the fundamental flaw of RNNs?', 'The vanishing gradient problem, preventing long-term memory.', 'MEDIUM'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'What does LSTM stand for?', 'Long Short-Term Memory.', 'EASY'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Why did Transformers replace LSTMs in production?', 'Transformers process tokens in parallel via self-attention, highly optimized for GPUs.', 'HARD'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Define Contextual Embeddings.', 'Embeddings where a word vector changes depending on surrounding words.', 'MEDIUM'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Transformer paper title?', 'Attention Is All You Need.', 'EASY'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Static vs Contextual embedding?', 'Static (Word2Vec) maps one word to one vector forever. Contextual (Transformer) calculates it dynamically.', 'MEDIUM'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'What does GPT stand for?', 'Generative Pre-trained Transformer.', 'EASY'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Explain TF-IDF conceptually.', 'Scores words highly if frequent in one document, but penalizes if frequent across all documents.', 'MEDIUM');

-- 6. Interview Sets
-- Replace db17a633-d39f-4b19-901f-13d64f6e27f3 with a fresh UUID.
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('db17a633-d39f-4b19-901f-13d64f6e27f3', 'da3a859d-e60d-49c8-9937-5d751952d5a2', 'Day 2 Interview Prep', 'MIXED');

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'Efficient Estimation of Word Representations in Vector Space', 'https://arxiv.org/abs/1301.3781', 'PAPER'),
('da3a859d-e60d-49c8-9937-5d751952d5a2', 'The Illustrated Word2Vec by Jay Alammar', 'http://jalammar.github.io/illustrated-word2vec/', 'BLOG');
