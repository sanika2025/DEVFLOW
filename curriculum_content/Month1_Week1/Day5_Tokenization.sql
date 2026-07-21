-- ==============================================================================
-- Day 5: Tokenization
-- Note: Replace 9db0bf48-b719-4bf1-b482-691c6cf41f51 with the actual UUID of the Day 5 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'The Problem: How do neural networks read?', 'MARKDOWN', 'Neural networks only understand numbers. To feed text into a Transformer, we must split the text into chunks, assign an integer ID to each chunk, and look up its embedding vector. This splitting process is called Tokenization.', 1),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Early Attempts and Failures', 'MARKDOWN', 'Character-Level: Solves OOV but makes sequences too long (O(N^2) memory problem). Word-Level: Keeps sequences short but creates a massive vocabulary and causes Out-Of-Vocabulary (OOV) errors.', 2),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Subword Tokenization: BPE, WordPiece, SentencePiece', 'MARKDOWN', 'BPE merges the most frequent pairs. WordPiece merges pairs that maximize data likelihood. SentencePiece treats input as a raw stream of characters including spaces.', 3),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Byte-Pair Encoding (BPE) Merge Process', 'MERMAID', 'flowchart TD\n    Start[Raw Text] --> Step1[Split into chars]\n    Step1 --> FreqCount1[Count Pairs]\n    FreqCount1 --> Merge1{Most Frequent Pair}\n    Merge1 --> V1[Add to Vocab]\n    V1 --> FreqCount2[Count Pairs]', 4),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Code Example: BPE Algorithm', 'CODE', 'from collections import defaultdict\nimport re\n\ndef get_stats(vocab):\n    pairs = defaultdict(int)\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols) - 1):\n            pairs[symbols[i], symbols[i+1]] += freq\n    return pairs\n\n# Loop over num_merges to find best pair and merge...', 5);

-- 2. Quizzes
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', '9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Day 5 Quiz: Tokenization', 'Test your knowledge on BPE, OOV issues, and Special Tokens.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'Why is Character-Level tokenization rarely used in LLMs?', 'Characters cannot be converted to integers.', 'It creates massive sequence lengths, crashing the O(N^2) attention mechanism.', 'Requires too much disk space.', 'Causes massive OOV errors.', 'B', 'Character models result in very long sequences. Transformer memory scales quadratically.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'What is an Out-Of-Vocabulary (OOV) token?', 'A punctuation token.', 'A stop generating token.', 'A word the model encounters that was not in its training vocabulary.', 'A padding token.', 'C', 'Word-level models map unseen strings to Unknown (OOV) tokens, losing semantics.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'How does Subword Tokenization solve the OOV problem?', 'Ignores unknown words.', 'Breaks unknown words into smaller known subwords or characters.', 'Searches the internet.', 'Crashes and asks for input.', 'B', 'It falls back to smaller subwords or individual characters, ensuring no data is lost.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'Which algorithm iteratively merges the most frequent pair of adjacent symbols?', 'Bag of Words', 'WordPiece', 'Byte-Pair Encoding (BPE)', 'TF-IDF', 'C', 'BPE starts with characters and greedily merges most frequent pairs.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'What is a major advantage of SentencePiece over standard BPE?', 'Trains in 1 second.', 'Treats spaces as normal characters, making it language-agnostic.', 'Uses 0 memory.', 'No neural networks required.', 'B', 'Operates directly on raw text stream, effective for languages without spaces.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'What is the purpose of the <EOS> token?', 'Increase attention score.', 'Signal End Of Sequence, telling decoder to stop generating.', 'Pad the batch.', 'Start the sequence.', 'B', 'Without EOS, the model would generate text endlessly.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'In BERT''s WordPiece tokenizer, what does the `##` prefix indicate?', 'A comment.', 'A subword that attaches to the preceding token without a space.', 'A toxic word.', 'A number.', 'B', '`##ning` tells the detokenizer to stitch it to the previous word.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'Roughly, how many tokens does 100 English words equate to?', '10', '75', '133', '1000', 'C', '1 token approx 0.75 words. 100 / 0.75 = 133.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'If batch sequences have lengths [10, 15, 8], what must you do in PyTorch?', 'Delete length 8.', 'Crop to 8.', 'Pad all to 15 using <PAD>.', 'Nothing.', 'C', 'Tensors must be rectangular; sequences must be padded to the max length.'),
('8d112d0d-54de-47e2-acd1-51c8cb98cecd', 'Which tokenizer does GPT-4 use?', 'WordPiece', 'SentencePiece', 'tiktoken (BPE)', 'Space-splitting', 'C', 'GPT-4 uses tiktoken (cl100k_base encoding).');

-- 4. Coding Challenges
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('92ca2020-4d77-41cb-bab4-f8963e70892a', '9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Pad Sequences', 'Given a list of lists of integers (token IDs), pad them to match the length of the longest sequence using a pad_token_id. Pad on the side specified by padding_side.', '`batch` (list of lists), `pad_token_id` (int), `padding_side` (str)', 'list of lists of integers', 'Batch length 1 to 100.', 'def pad_sequences(batch: list[list[int]], pad_token_id: int = 0, padding_side: str = "right") -> list[list[int]]:\n    pass', 'def pad_sequences(batch, pad_token_id=0, padding_side="right"):\n    max_len = max(len(s) for s in batch)\n    res = []\n    for s in batch:\n        pad = [pad_token_id] * (max_len - len(s))\n        if padding_side == "right":\n            res.append(s + pad)\n        else:\n            res.append(pad + s)\n    return res');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Why not use Word-level tokenization?', 'Massive vocabulary size and fails completely on unknown words (OOV) or typos.', 'EASY'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'What does BPE stand for?', 'Byte-Pair Encoding.', 'EASY'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'How does BPE work fundamentally?', 'Iteratively merges the most frequently occurring adjacent pair until target vocab size is reached.', 'MEDIUM'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'How do subword tokenizers handle OOV words?', 'Break them down into known subwords or characters.', 'MEDIUM'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'What is SentencePiece?', 'Treats input as raw stream of characters including spaces; language-agnostic.', 'HARD'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'What is the purpose of <EOS>?', 'End of Sequence token. Tells the LLM to stop generating.', 'EASY'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'What is the purpose of <PAD>?', 'Padding token. Makes sequences in a batch the exact same length.', 'MEDIUM'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'What does `##` mean in WordPiece?', 'Denotes a subword that attaches to the previous token without a space.', 'MEDIUM'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', '1 token roughly equals how many English words?', '0.75 words.', 'EASY'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Which tokenization algorithm does GPT-4 use?', 'BPE (implemented via tiktoken).', 'MEDIUM');

-- 6. Interview Sets
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('b15891f9-a4c5-470f-97b7-e03df27078b3', '9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Day 5 Interview Prep', 'MIXED');

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'Neural Machine Translation of Rare Words with Subword Units', 'https://arxiv.org/abs/1508.07909', 'PAPER'),
('9db0bf48-b719-4bf1-b482-691c6cf41f51', 'OpenAI Tokenizer Web Interface', 'https://platform.openai.com/tokenizer', 'TOOL');
