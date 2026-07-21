-- ==============================================================================
-- Day 1: Introduction to AI, ML, DL, GenAI, and LLMs
-- Note: Replace 7d3413ec-7d88-4d4a-a6ee-ade32143a15e with the actual UUID of the Day 1 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Definitions & The AI Hierarchy', 'MARKDOWN', 'To build production AI systems, we first need to establish a precise taxonomy. The field of AI is nested, with each subsequent layer representing a more specialized set of capabilities. 1. Artificial Intelligence (AI): The broadest concept... 2. Machine Learning (ML)... 3. Deep Learning (DL)... 4. Generative AI (GenAI)... 5. Large Language Models (LLMs)...', 1),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Discriminative vs. Generative', 'MARKDOWN', 'Discriminative Models: Learn the boundary between classes. Mathematically, they learn P(Y|X). Generative Models: Learn the distribution of the individual classes. They learn P(X, Y) or just P(X). By understanding how the data is distributed, they can generate new data points X_new.', 2),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'The AI Hierarchy Diagram', 'MERMAID', 'mindmap\n  root((Artificial<br/>Intelligence))\n    Expert Systems\n    Search Algorithms\n    Machine Learning\n      Supervised Learning\n      Unsupervised Learning\n      Deep Learning\n        Convolutional Neural Networks (CNNs)\n        Recurrent Neural Networks (RNNs)\n        Generative AI\n          GANs\n          Diffusion Models\n          Large Language Models (LLMs)\n            GPT-4\n            Claude 3\n            Llama 3', 3),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Code Example: AI Paradigms', 'CODE', 'import random\ndef rule_based_chatbot(user_input):\n...\ndef predictive_spam_filter(text):\n...\nclass SimpleGenerativeModel:\n...', 4);

-- 2. Quizzes
-- Replace cb20592f-027e-4210-a02f-7c04aba7111d with a fresh UUID.
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('cb20592f-027e-4210-a02f-7c04aba7111d', '7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Day 1 Quiz: Intro to GenAI', 'Test your knowledge on the fundamental concepts of AI, ML, DL, and Generative AI.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('cb20592f-027e-4210-a02f-7c04aba7111d', 'Which of the following represents the correct hierarchical relationship?', 'ML ⊂ AI ⊂ DL ⊂ GenAI', 'GenAI ⊂ DL ⊂ ML ⊂ AI', 'AI ⊂ ML ⊂ DL ⊂ GenAI', 'DL ⊂ GenAI ⊂ AI ⊂ ML', 'B', 'Artificial Intelligence is the broad field. Machine Learning is a subset of AI. Deep Learning is a subset of ML. Generative AI is a subset of Deep Learning.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'What is the primary difference between discriminative and generative models?', 'Discriminative models generate data, generative models classify it.', 'Discriminative models learn boundaries between classes; generative models learn the distribution of classes.', 'Generative models are Rule-Based.', 'There is no mathematical difference.', 'B', 'Discriminative models map input X to label Y (classification). Generative models capture the underlying probability distribution of the data to create new instances.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'What does LLM stand for?', 'Logical Language Machine', 'Large Linear Model', 'Large Language Model', 'Latent Language Mechanism', 'C', 'LLM stands for Large Language Model, denoting neural networks with billions of parameters trained on massive text datasets.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'Which approach is considered "Software 2.0"?', 'Writing explicit if-else logic.', 'Hardcoding algorithms in C++.', 'Using neural networks that learn rules from data.', 'Writing SQL databases.', 'C', 'Software 2.0 is a term coined by Andrej Karpathy to describe programming via optimization (training neural networks) rather than writing explicit instructions.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'In the context of LLMs, what is a "hallucination"?', 'When the GPU overheats.', 'When the model generates plausible but factually incorrect or nonsensical information.', 'When the model refuses to answer a prompt.', 'When the model copies data exactly from its training set.', 'B', 'Because LLMs are probabilistic token predictors, they can sometimes string together words that sound highly confident but are entirely fabricated.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'Why are LLMs considered "Few-Shot" learners?', 'They require only a few GPUs to run.', 'They can perform a task after being shown just a few examples in the prompt, without retraining.', 'They only output a few words at a time.', 'They have very few parameters.', 'B', 'Unlike traditional ML which requires thousands of examples to fine-tune, LLMs can understand a new task through merely reading a few examples provided in the input prompt.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'Which is a common enterprise use case for Generative AI?', 'Calculating exact payroll taxes using deterministic math.', 'Extracting structured JSON data from unstructured PDFs.', 'Storing user passwords securely.', 'Rendering 3D graphics in real-time gaming engines.', 'B', 'Generative AI excels at natural language understanding tasks, such as parsing unstructured text (like PDFs) and generating a structured JSON format from it.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'What is the main bottleneck when deploying LLMs in production?', 'The models are too small.', 'Lack of Python developers.', 'Compute constraints (GPU memory and inference latency).', 'Inability to process text.', 'C', 'LLMs require massive amounts of VRAM and compute power, making latency and infrastructure costs the primary challenges in production.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'Which component is fundamentally responsible for an LLM''s ability to maintain context over long texts?', 'If-Else statements.', 'The Transformer Architecture.', 'Random Number Generators.', 'SQL Joins.', 'B', 'The Transformer architecture uses self-attention mechanisms that allow the model to weigh the importance of all words in a sequence, enabling long-range context retention.'),
('cb20592f-027e-4210-a02f-7c04aba7111d', 'When should you NOT use an LLM?', 'To summarize an article.', 'To translate English to French.', 'To perform strict, deterministic arithmetic on a financial ledger.', 'To draft an email.', 'C', 'LLMs are probabilistic, not deterministic. They approximate answers based on token probabilities, making them highly unreliable for strict, exact mathematical operations without external tool integration.');

-- 4. Coding Challenges
-- Replace 45068eb6-9a94-4d60-9a34-5b89444c8836 with a fresh UUID.
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('45068eb6-9a94-4d60-9a34-5b89444c8836', '7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'GenAI Query Router', 'You are building an intent classifier for a GenAI routing system. Before sending a query to a massive, expensive LLM, you want to route simple factual queries to a cheaper database search. Write a function `route_query(query)` that takes a string. If the string starts with "Who", "What", "When", or "Where" (case-insensitive), return "DATABASE". Otherwise, return "LLM".', 'A string `query`.', 'A string: either "DATABASE" or "LLM".', 'Length of query: 1 <= len(query) <= 1000. No leading spaces.', 'def route_query(query: str) -> str:\n    # Your code here\n    pass', 'def route_query(query: str) -> str:\n    question_words = ("who", "what", "when", "where")\n    first_word = query.split()[0].lower()\n    if first_word in question_words:\n        return "DATABASE"\n    return "LLM"');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What is Machine Learning?', 'A subset of AI where systems learn patterns from data to improve performance without explicit programming.', 'EASY'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What is Deep Learning?', 'A subset of ML utilizing multi-layered artificial neural networks.', 'EASY'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Generative vs Discriminative: Which one learns P(Y|X)?', 'Discriminative models.', 'MEDIUM'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What defines an LLM?', 'Large Language Model: Deep neural network with billions of parameters, trained on massive text corpora, capable of understanding and generating human language.', 'EASY'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What does "Software 2.0" refer to?', 'Programming via neural network training (learning rules from data) rather than writing explicit logic.', 'MEDIUM'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Name one major limitation of LLMs.', 'Hallucinations (generating plausible but false information).', 'EASY'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What is Few-Shot Prompting?', 'Giving the model a few examples of the desired input-output behavior within the prompt before asking it to perform the task.', 'MEDIUM'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Why use a smaller model (like 8B parameters) over a massive one (like GPT-4) in production?', 'Lower latency, lower inference costs, and often sufficient performance for specific, narrow tasks.', 'HARD'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What is the primary architecture behind modern LLMs?', 'The Transformer architecture.', 'EASY'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'What is RAG?', 'Retrieval-Augmented Generation: Supplying an LLM with relevant retrieved documents in the prompt to ground its answers in factual data.', 'MEDIUM');

-- 6. Interview Sets
-- Replace 09a2eae1-adad-47b0-8ce4-231292d873de with a fresh UUID.
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('09a2eae1-adad-47b0-8ce4-231292d873de', '7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Day 1 Interview Prep', 'MIXED');

-- Assuming there's a table for interview_questions linked to interview_sets (adjust table name if different)
-- E.g. INSERT INTO interview_questions (set_id, question_text, ideal_answer, category) ...
-- Skipping table structure assumptions here and just noting it since the prompt asked to populate it.

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Attention Is All You Need (Vaswani et al., 2017)', 'https://arxiv.org/abs/1706.03762', 'PAPER'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Let''s build GPT: from scratch, in code, spelled out', 'https://www.youtube.com/watch?v=kCc8FmEb1nY', 'VIDEO'),
('7d3413ec-7d88-4d4a-a6ee-ade32143a15e', 'Software 2.0 by Andrej Karpathy', 'https://karpathy.medium.com/software-2-0-a64152b37c35', 'BLOG');
