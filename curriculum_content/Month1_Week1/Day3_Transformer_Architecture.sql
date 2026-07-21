-- ==============================================================================
-- Day 3: Transformer Architecture
-- Note: Replace d8fc6131-0203-4e6c-b982-c17b552da8da with the actual UUID of the Day 3 lesson node.
-- All other generated IDs should be replaced with new UUIDs if your DB requires them.
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, section_title, content_type, content, "order") VALUES
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'The Big Picture: Why Transformers?', 'MARKDOWN', 'Before 2017, sequence tasks used RNNs in an Encoder-Decoder setup. The bottleneck: all information compressed into one fixed-size vector. Transformers discarded recurrence entirely, relying on Self-Attention and processing all tokens in parallel.', 1),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Input: Embeddings & Positional Encoding', 'MARKDOWN', 'Transformers have no inherent concept of word order. Positional Encoding injects order mathematically using sine and cosine functions of different frequencies, added to the embedding.', 2),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'The Encoder and Decoder Blocks', 'MARKDOWN', 'Encoder Block: Multi-Head Self-Attention -> Add & Norm -> FFNN -> Add & Norm. \nDecoder Block: Masked Multi-Head Self-Attention -> Add & Norm -> Encoder-Decoder Cross-Attention -> Add & Norm -> FFNN -> Add & Norm.', 3),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'The Transformer Macro-Architecture', 'MERMAID', 'flowchart TD\n    subgraph Decoder\n        D_In[Outputs shifted right] --> D_Emb[Output Embedding]\n        D_Emb --> D_PE[Positional Encoding]\n        D_PE --> D_MaskAtt[Masked Attention]\n    end\n    subgraph Encoder\n        E_In[Inputs] --> E_Emb[Input Embedding]\n        E_Emb --> E_PE[Positional Encoding]\n        E_PE --> E_Att[Self Attention]\n    end\n    E_Att --> D_MaskAtt', 4),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Code Example: Positional Encoding', 'CODE', 'import torch\nimport math\n\ndef get_positional_encoding(max_seq_len, d_model):\n    pe = torch.zeros(max_seq_len, d_model)\n    position = torch.arange(0, max_seq_len, dtype=torch.float).unsqueeze(1)\n    div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))\n    pe[:, 0::2] = torch.sin(position * div_term)\n    pe[:, 1::2] = torch.cos(position * div_term)\n    return pe', 5);

-- 2. Quizzes
INSERT INTO quizzes (quiz_id, lesson_id, title, description, pass_score) VALUES
('50a18daf-5902-465b-a591-73c42218944e', 'd8fc6131-0203-4e6c-b982-c17b552da8da', 'Day 3 Quiz: Transformer Architecture', 'Test your knowledge on Positional Encodings, FFNNs, and Encoder vs Decoder models.', 80);

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('50a18daf-5902-465b-a591-73c42218944e', 'Why does the Transformer require Positional Encoding?', 'To compress the size of the neural network.', 'Because it processes all tokens in parallel and inherently has no concept of sequence order.', 'To translate English into French.', 'To prevent the GPU from overheating.', 'B', 'Unlike RNNs, Transformers read the whole sentence at once. Without PE, word order is lost.'),
('50a18daf-5902-465b-a591-73c42218944e', 'What is the purpose of the FFNN inside the Transformer block?', 'It calculates the attention scores.', 'It acts as a key-value memory store for facts, expanding the representation.', 'It is responsible for tokenization.', 'It calculates the cosine similarity of words.', 'B', 'FFNN acts as factual memory, processing contextualized info independently per position.'),
('50a18daf-5902-465b-a591-73c42218944e', 'What does the "Add" refer to in the "Add & Norm" step?', 'Adding the vocabulary size to the input.', 'A Residual Connection (Skip Connection).', 'Adding more layers to the network.', 'Adding bias to the weights.', 'B', 'Residual connections (Output = F(x) + x) allow gradients to flow directly during backprop.'),
('50a18daf-5902-465b-a591-73c42218944e', 'In the original Transformer, what connects the Encoder to the Decoder?', 'A recurrent loop.', 'Cross-Attention.', 'Word2Vec.', 'Layer Normalization.', 'B', 'The Decoder uses Cross-Attention to look at the final outputs of the Encoder.'),
('50a18daf-5902-465b-a591-73c42218944e', 'Which of the following models is an Encoder-only architecture?', 'GPT-4', 'Llama 3', 'BERT', 'T5', 'C', 'BERT (Bidirectional Encoder Representations from Transformers) only uses the Encoder part.'),
('50a18daf-5902-465b-a591-73c42218944e', 'Why is the Self-Attention mechanism in the Decoder "Masked"?', 'To protect user privacy.', 'To prevent the model from looking ahead at future tokens it hasn''t generated yet.', 'To hide positional encoding.', 'To reduce memory usage.', 'B', 'Since the decoder is autoregressive, it cannot see future tokens during training.'),
('50a18daf-5902-465b-a591-73c42218944e', 'How does Layer Normalization differ from Batch Normalization?', 'It doesn''t differ.', 'Layer Norm normalizes across all features for a specific sequence/token.', 'Layer Norm is only used in CNNs.', 'Layer Norm requires no learnable parameters.', 'B', 'Sequence lengths vary dynamically; Layer Norm is independent of batch size.'),
('50a18daf-5902-465b-a591-73c42218944e', 'What mathematical functions were used for Positional Encoding?', 'Tangent and Cotangent.', 'Sine and Cosine of varying frequencies.', 'Logarithmic scales.', 'Purely random numbers.', 'B', 'Sine and Cosine waves allow the model to easily learn relative positions.'),
('50a18daf-5902-465b-a591-73c42218944e', 'If d_model is 512, what is typically the intermediate hidden dimension of the FFNN?', '128', '512', '2048', '4096', 'C', 'The standard architecture expands the dimension by a factor of 4 (512 * 4 = 2048).'),
('50a18daf-5902-465b-a591-73c42218944e', 'Modern Generative AI models are primarily based on which part of the Transformer?', 'The Encoder.', 'Positional Encoding.', 'The Decoder.', 'Cross-Attention.', 'C', 'Modern LLMs are almost exclusively Decoder-only architectures.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (challenge_id, lesson_id, title, problem_statement, input_format, output_format, constraints, starter_code, solution_code) VALUES
('1c0cd30d-7cf6-4a4e-b2fb-6896995c85a6', 'd8fc6131-0203-4e6c-b982-c17b552da8da', 'Layer Normalization', 'Implement Layer Normalization for a single 1D vector. Calculate mean and variance. Normalize to mean 0, var 1. Scale by gamma=2.0 and shift by beta=0.5. Add epsilon 1e-5 to variance.', 'List of floats `x`.', 'List of floats.', 'Length of `x` between 2 and 1000.', 'def layer_norm_1d(x: list[float]) -> list[float]:\n    pass', 'import math\ndef layer_norm_1d(x):\n    n = len(x)\n    mean = sum(x) / n\n    variance = sum((v - mean)**2 for v in x) / n\n    eps = 1e-5\n    return [((v - mean) / math.sqrt(variance + eps)) * 2.0 + 0.5 for v in x]');

-- 5. Flashcards
INSERT INTO flashcards (lesson_id, front_text, back_text, difficulty) VALUES
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Why do Transformers need Positional Encoding?', 'Because they process tokens in parallel; without PE, they have no concept of sequence order.', 'EASY'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'What is the purpose of the Residual Connection?', 'To prevent the vanishing gradient problem by allowing an unobstructed path for gradients.', 'MEDIUM'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'What does the Decoder do that the Encoder does not?', 'It uses Masked Attention and Autoregressive generation.', 'MEDIUM'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Is BERT an Encoder or Decoder?', 'Encoder-only.', 'EASY'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Are GPT models Encoders or Decoders?', 'Decoder-only.', 'EASY'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'What mathematical functions generate Positional Encodings in the original paper?', 'Sine and Cosine.', 'MEDIUM'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'What is Cross-Attention?', 'The mechanism in the Decoder that allows it to look back at the outputs of the Encoder.', 'HARD'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Why use Layer Normalization instead of Batch Normalization in Transformers?', 'Because sequence lengths vary. Layer Norm normalizes across the feature dimension of a single token.', 'HARD'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'By what factor does the FFNN typically expand the d_model dimension?', 'A factor of 4.', 'MEDIUM'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'What does "Autoregressive" mean?', 'Generating output sequentially, where each predicted token is appended to the input to predict the next.', 'EASY');

-- 6. Interview Sets
INSERT INTO interview_sets (set_id, lesson_id, title, difficulty) VALUES
('c8b232bd-6531-46d6-8bca-7a3ca7d8daa9', 'd8fc6131-0203-4e6c-b982-c17b552da8da', 'Day 3 Interview Prep', 'MIXED');

-- 7. Lesson Resources
INSERT INTO lesson_resources (lesson_id, title, url, resource_type) VALUES
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'The Illustrated Transformer by Jay Alammar', 'http://jalammar.github.io/illustrated-transformer/', 'BLOG'),
('d8fc6131-0203-4e6c-b982-c17b552da8da', 'Language Models are Unsupervised Multitask Learners', 'https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf', 'PAPER');
