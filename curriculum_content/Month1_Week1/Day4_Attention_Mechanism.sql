-- ==============================================================================
-- Day 4: Attention Mechanism
-- Note: Replace f15102fb-0c15-48de-bc2b-6c3c71e9f42b with the actual UUID of the Day 4 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'The Core Intuition: QKV', 'MARKDOWN', 'Think of a database. You submit a Query. The database compares it against Keys. If a Key matches, it returns the Value. In Self-Attention, every token acts as all three. A token generates a Query ("I need context"), compares it to the Keys of all other tokens, and aggregates their Values based on the match scores.', 1),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'The Math: Scaled Dot-Product Attention', 'MARKDOWN', 'Equation: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V\n1. Dot Product (QK^T): Measures similarity.\n2. Scale (sqrt(d_k)): Stabilizes variance to prevent vanishing gradients.\n3. Softmax: Converts to probabilities.\n4. Multiply by V: Routes the actual information.', 2),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Scaled Dot-Product Attention Flow', 'MERMAID', 'flowchart TD\n    Q[Query Matrix Q] --> MatMul1((MatMul))\n    K[Key Matrix K] --> TransposeK[Transpose K]\n    TransposeK --> MatMul1\n    MatMul1 --> Scale[Scale by 1/sqrt(dk)]\n    Scale --> Mask[Mask Optional]\n    Mask --> Softm[Softmax]\n    Softm -->|Attention Weights| MatMul2((MatMul))\n    V[Value Matrix V] --> MatMul2\n    MatMul2 --> Out[Contextualized Output]', 3),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Code Example: Attention in PyTorch', 'CODE', 'import torch\nimport torch.nn.functional as F\nimport math\n\ndef scaled_dot_product_attention(q, k, v, mask=None):\n    d_k = q.size(-1)\n    scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    attention_weights = F.softmax(scores, dim=-1)\n    output = torch.matmul(attention_weights, v)\n    return output, attention_weights', 4);

-- 2. Quizzes
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Day 4 Quiz: Attention Mechanism', 'Test your knowledge on QKV matrices, scaling factors, and masking.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'In Self-Attention, what do Q, K, and V stand for?', 'Quality, Knowledge, Vector', 'Query, Key, Value', 'Quantity, K-means, Variance', 'Queue, Kernel, Variable', 'B', 'Drawn from database concepts: Query (search), Key (metadata), Value (payload).'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'Why do we scale the dot product by dividing by sqrt(d_k)?', 'To compress the model size.', 'To dynamically increase learning rate.', 'To prevent vanishing gradients in the softmax function.', 'To translate output to probabilities.', 'C', 'Large dot products push softmax into regions with near-zero gradients. Scaling stabilizes variance.'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'Where do the Query, Key, and Value matrices come from in Self-Attention?', 'Query from user, Key/Value from DB.', 'All linearly projected from the exact same input embedding.', 'Hardcoded parameters.', 'Query from Decoder, Key/Value from Encoder.', 'B', 'In Self-Attention, the input token sequence projects three ways to form Q, K, and V.'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'What is the shape of the Attention Weights matrix after Softmax?', '(Seq Len, Model Dim)', '(Model Dim, Model Dim)', '(Seq Len, Seq Len)', '(Batch Size, 1)', 'C', 'It dictates how every token attends to every other token, forming an N x N matrix.'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'What is the primary benefit of Multi-Head Attention?', 'Runs faster on CPUs.', 'Allows attending to different representation subspaces simultaneously.', 'Reduces memory footprint.', 'Prevents hallucination.', 'B', 'Multiple heads capture diverse features (e.g., syntax, semantics) in parallel.'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'Why is a mask applied in the Decoder''s Self-Attention?', 'To prevent looking at future tokens, enforcing autoregressive generation.', 'To hide PII.', 'To stop exploding gradients.', 'To ignore padding tokens.', 'A', 'Masking sets future token attention to negative infinity, yielding 0 probability.'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'How does Cross-Attention differ from Self-Attention?', 'No difference.', 'Uses addition instead of dot products.', 'Query comes from Decoder, Keys and Values from Encoder.', 'Only uses one head.', 'C', 'The Decoder figures out which parts of the input (Encoder Keys/Values) are relevant to the current output (Decoder Query).'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'What is the memory complexity of standard Self-Attention?', 'O(N)', 'O(N^2)', 'O(log N)', 'O(1)', 'B', 'Comparing every token to every other token yields an N x N matrix (Quadratic).'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'If a raw dot product score is negative infinity, what is the attention weight after Softmax?', 'Negative Infinity', '1.0', '0.0', '-1.0', 'C', 'Softmax converts massive negative numbers to exactly 0 (the basis of masking).'),
('b4f58966-9628-433a-9d70-93d73e4dbdb3', 'Which matrix operation routes the final information based on attention probabilities?', 'Multiply by Query', 'Multiply by Key', 'Multiply by Value', 'Add to Input', 'C', 'After probabilities are calculated, they are multiplied by the Value matrix to extract context.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('df53c55d-72c8-4b42-be1f-2db6e195dae0', 'f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Generate Causal Mask', 'Implement a simplified causal mask generator. Return a 2D boolean list of size seq_len x seq_len. Lower triangular matrix (including diagonal) should be True, upper triangle False.', 'Integer `seq_len`', '2D list of booleans', 'Use pure Python.', 'def generate_causal_mask(seq_len: int) -> list[list[bool]]:\n    pass', 'def generate_causal_mask(seq_len):\n    return [[j <= i for j in range(seq_len)] for i in range(seq_len)]');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'In QKV, which vector represents "what a token is looking for"?', 'The Query (Q) vector.', 'EASY'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Write the core Scaled Dot-Product Attention equation.', 'Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V', 'HARD'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Why divide the dot product by sqrt(d_k)?', 'To stabilize variance and prevent the softmax function from outputting near-zero gradients.', 'MEDIUM'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'What is the shape of an Attention Score matrix?', '(Sequence Length) x (Sequence Length)', 'MEDIUM'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'What is the purpose of Multi-Head Attention?', 'Allows the model to attend to multiple different linguistic subspaces simultaneously.', 'EASY'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'How is a causal mask implemented mathematically?', 'By filling the upper triangle of the raw score matrix with a massive negative number before applying softmax.', 'MEDIUM'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'In Cross-Attention, where does the Query matrix come from?', 'The Decoder.', 'MEDIUM'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'In Self-Attention, where do Q, K, and V come from?', 'They are linearly projected from the exact same input sequence.', 'EASY'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'What is the memory complexity of standard Self-Attention with respect to sequence length N?', 'O(N^2) - Quadratic.', 'MEDIUM'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'What matrix actually holds the "content" that gets aggregated?', 'The Value (V) matrix.', 'EASY');

-- 6. Interview Sets
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('3ffe4578-8340-46c2-9b8e-95a3aa7e3470', 'f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Day 4 Interview Prep', 'MIXED');

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'FlashAttention (Dao et al., 2022)', 'https://arxiv.org/abs/2205.14135', 'PAPER'),
('f15102fb-0c15-48de-bc2b-6c3c71e9f42b', 'Attention in neural networks and how it works (3Blue1Brown)', 'https://www.youtube.com/watch?v=eMlx5fFNoYc', 'VIDEO');
