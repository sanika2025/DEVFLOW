-- ==============================================================================
-- WEEK 1 CUSTOM CONTENT GENERATED
-- ==============================================================================

-- ==============================================================================
-- Day 1: Lesson for Day 1
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Evolution of AI', 'Theory', 'Artificial Intelligence is the field of making computers perform tasks that normally require human intelligence.

Machine Learning is a subset of AI where systems learn patterns from data.

Deep Learning uses neural networks with many layers.

Generative AI creates new content instead of only classifying information.

Timeline:
AI -> Machine Learning -> Deep Learning -> Generative AI -> Large Language Models', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'What is an LLM?', 'Theory', 'A Large Language Model is a neural network trained on enormous amounts of text.

Instead of storing answers, it learns statistical relationships between words.

Examples include:
- GPT
- Claude
- Gemini
- Llama
- Mistral

An LLM predicts the next token repeatedly until an answer is generated.', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Why LLMs Matter', 'Theory', 'LLMs can:
- Answer questions
- Write code
- Summarize documents
- Translate languages
- Generate emails
- Create SQL queries
- Assist developers

They are general-purpose reasoning engines built on language.', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Real World Applications', 'Theory', 'Healthcare
Finance
Education
Legal
Customer Support
Software Development
Marketing', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Limitations', 'Theory', 'Hallucinations
Knowledge Cutoff
Context Window
Bias
Privacy
Prompt Sensitivity', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Code Example', 'Code', 'from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.5",
    input="Explain Machine Learning."
)

print(response.output_text)', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Diagram', 'Diagram', 'flowchart TD
    A[User] --> B[Prompt]
    B --> C[LLM]
    C --> D[Generated Response]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Summary', 'Theory', 'LLMs are predictive language models trained on massive text corpora that generate human-like responses using probability rather than memorization.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'Day 1 Quiz: Intro to LLMs', 'Test your understanding of the evolution of AI and LLM fundamentals.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'What is the primary function of Generative AI compared to traditional Machine Learning?', '["It exclusively classifies data","It creates new content","It relies entirely on rule-based logic","It requires no training data"]'::jsonb, 1, 'Generative AI goes beyond classification to produce novel text, images, and other forms of media.'),
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'Which of the following best describes how an LLM generates answers?', '["It searches a database of pre-written answers","It randomly selects words from a dictionary","It predicts the next token repeatedly based on statistical probabilities","It translates queries into SQL"]'::jsonb, 2, 'LLMs do not store facts in a database; they probabilistically predict the next token in a sequence.'),
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'Which of the following is considered a limitation of current LLMs?', '["Hallucinations","Ability to write code","Natural language understanding","Speed of text generation"]'::jsonb, 0, 'Hallucinations occur when an LLM generates highly plausible but factually incorrect information.'),
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'What does ''Knowledge Cutoff'' refer to in the context of LLMs?', '["The point where the model deletes its memory","The specific date when the model''s training data ends","The maximum length of the prompt","The inability to learn programming languages"]'::jsonb, 1, 'Knowledge cutoff means the model has no innate awareness of events that occurred after its training data was collected.'),
('d07ad74e-1773-4c71-8a30-35d0bd3f7347', 'Deep Learning is a subset of which broader field?', '["Generative AI","Machine Learning","Data Engineering","Expert Systems"]'::jsonb, 1, 'Deep Learning is a specialized subset of Machine Learning that utilizes multi-layered artificial neural networks.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('e0e06f35-7ff4-4fa9-a846-ae8785db82c5', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Your First Prompt', 'Write a Python script using the OpenAI SDK to send a prompt to an LLM asking it to explain Machine Learning. Print the response.', 'from openai import OpenAI

# Initialize the client
client = OpenAI()

# Your code here', 'from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.5",
    input="Explain Machine Learning."
)

print(response.output_text)');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'What does LLM stand for?', 'Large Language Model'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'What is an AI ''Hallucination''?', 'When an AI model generates plausible but factually incorrect information.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'How does an LLM fundamentally generate text?', 'By predicting the most statistically probable next token.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'What is the difference between AI and ML?', 'AI is the broad field of making computers simulate human intelligence, while ML is a subset where systems learn patterns from data.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 1' LIMIT 1), 'Name three major LLM models.', 'GPT, Claude, Gemini (or Llama, Mistral).');

-- ==============================================================================
-- Day 2: Lesson for Day 2
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Problems with RNNs', 'Theory', 'Sequential processing: Words must be processed one by one.
Vanishing gradients: Struggle to remember long-term dependencies.
Slow training: Cannot be easily parallelized on GPUs.

Transformers solve these problems using attention.', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Encoder and Decoder', 'Theory', 'Encoder: Reads the input sentence and produces contextual embeddings.

Decoder: Generates output one token at a time based on the Encoder''s embeddings.', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Attention Mechanism', 'Theory', 'Instead of reading words sequentially, every word looks at every other word simultaneously.

Example: "The animal didn''t cross the street because it was tired."
The model uses attention to understand that "it" refers to "animal", not "street".', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Self Attention Formula', 'Theory', 'Attention(Q,K,V)
Q = Query (What am I looking for?)
K = Key (What do I contain?)
V = Value (What is my actual content?)

Score -> Softmax -> Weighted Values -> Output', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Multi-Head Attention', 'Theory', 'Instead of one attention calculation, multiple attention heads learn different relationships.

Example:
Head 1: Grammar
Head 2: Meaning
Head 3: Dependency', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Code Example', 'Code', 'from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

tokens = tokenizer("Transformers are amazing.")

print(tokens)', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Diagram', 'Diagram', 'flowchart TD
    A[Sentence] --> B[Tokenizer]
    B --> C[Embeddings]
    C --> D[Self Attention]
    D --> E[Feed Forward]
    E --> F[Output]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Summary', 'Theory', 'Transformers process all words simultaneously using self-attention, making them faster and more accurate than RNNs.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'Day 2 Quiz: Transformer Architecture', 'Test your knowledge on Transformers, Encoders, Decoders, and Attention.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'What is the primary advantage of Transformers over RNNs?', '["They process data sequentially","They process all words simultaneously using attention","They do not use neural networks","They require less training data"]'::jsonb, 1, 'Transformers avoid sequential processing, allowing for massive parallelization and better retention of long-range context.'),
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'In the Self-Attention formula, what do Q, K, and V stand for?', '["Quality, Key, Vector","Quantity, K-means, Variance","Query, Key, Value","Queue, Kernel, Variable"]'::jsonb, 2, 'Q is Query, K is Key, and V is Value.'),
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'What is the purpose of Multi-Head Attention?', '["To allow the model to focus on different aspects (like grammar and meaning) simultaneously","To compress the model size","To translate into multiple languages at once","To bypass the softmax function"]'::jsonb, 0, 'Different attention heads can independently learn different semantic and syntactic relationships.'),
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'Which component of a Transformer generates the output token by token?', '["The Encoder","The Multi-Head Attention","The Decoder","The Tokenizer"]'::jsonb, 2, 'The Decoder generates the sequence autoregressively, one token at a time.'),
('2207adbc-b8c5-4458-9163-4a8a16fec04f', 'What classic NLP problem does Self-Attention solve beautifully (e.g., ''The animal didn''t cross the street because it was tired'')?', '["Translation","Coreference Resolution","Spell checking","Tokenization"]'::jsonb, 1, 'Self-attention naturally solves coreference resolution by giving high attention weights between ''it'' and ''animal''.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('5a2205b9-b457-4753-be8e-5cfb86391e43', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Tokenizing a Sentence', 'Use the Hugging Face `transformers` library to load the `bert-base-uncased` tokenizer and tokenize the string "Transformers are amazing.".', 'from transformers import AutoTokenizer

# Your code here', 'from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
tokens = tokenizer("Transformers are amazing.")
print(tokens)');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'Why did Transformers replace RNNs?', 'Because RNNs suffer from vanishing gradients and slow, sequential processing, while Transformers process tokens in parallel using attention.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'What does the Encoder do?', 'It reads the input sequence and converts it into rich, contextual embeddings.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'What does the Decoder do?', 'It uses the Encoder''s embeddings to generate the output sequence one token at a time.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'What are Q, K, and V in Self-Attention?', 'Query, Key, and Value.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 2' LIMIT 1), 'What is the benefit of Multi-Head Attention?', 'It allows the model to capture multiple different types of relationships (e.g., syntactic and semantic) simultaneously.');

-- ==============================================================================
-- Day 3: Lesson for Day 3
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Tokens', 'Theory', 'LLMs read tokens rather than words.

Example:
"ChatGPT is amazing"
↓
["Chat", "G", "PT", " is", " amazing"]', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Tokenization Methods', 'Theory', 'Character-level
Word-level
Subword-level
Byte Pair Encoding (BPE)
SentencePiece', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Embeddings', 'Theory', 'Embeddings convert text into dense vectors of numbers.

Example:
Dog -> [0.12, 0.93, ...]
Cat -> [0.15, 0.91, ...]

Similar words have nearby vectors in the embedding space.', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Context Window', 'Theory', 'Context window determines how much text the model remembers or can process at once.

Examples of Context Windows:
- 8K tokens
- 32K tokens
- 128K tokens
- 1M Tokens', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Why Tokens Matter', 'Theory', 'Cost: APIs charge per token.
Latency: More tokens take longer to process.
Memory: VRAM scales quadratically with token length in standard attention.
Performance: Too much irrelevant context can degrade reasoning.', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Code Example', 'Code', 'import tiktoken

enc = tiktoken.encoding_for_model("gpt-4")

print(enc.encode("Hello World"))', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Diagram', 'Diagram', 'flowchart LR
    A[Sentence] --> B[Tokenizer]
    B --> C[Tokens]
    C --> D[Embeddings]
    D --> E[LLM]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Summary', 'Theory', 'Every LLM converts text into tokens and embeddings before reasoning over it.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'Day 3 Quiz: Tokens & Embeddings', 'Test your understanding of how LLMs process raw text into numbers.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'What is a token in the context of LLMs?', '["A complete sentence","A single character","A chunk of text (a word or subword)","A specialized neural network layer"]'::jsonb, 2, 'Tokens are subword units. A single word can be one token or broken into multiple tokens.'),
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'Why do we use Embeddings?', '["To convert text into dense mathematical vectors","To compress the context window","To increase the cost of API calls","To translate languages"]'::jsonb, 0, 'Embeddings turn tokens into arrays of numbers so the neural network can perform math on them.'),
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'What is Byte Pair Encoding (BPE)?', '["A method for generating images","A popular subword tokenization algorithm","An encryption standard for API keys","A technique to reduce hallucination"]'::jsonb, 1, 'BPE is the standard tokenization algorithm used by GPT and many other models.'),
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'What does the ''Context Window'' refer to?', '["The size of the computer monitor","The maximum number of tokens the model can process in one request","The amount of training data","The number of attention heads"]'::jsonb, 1, 'The context window is the maximum sequence length (input + output) the model can handle.'),
('09b0a2e0-a108-4815-ae2b-e64990a5c49a', 'Which of the following is NOT directly impacted by token count?', '["API Cost","Inference Latency","Model Training Date","GPU Memory required"]'::jsonb, 2, 'Token count affects cost, latency, and memory, but has no relation to when the model was trained.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('13c615f0-2fc2-4c6b-a777-cfe679bdd2b3', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Counting Tokens', 'Use the `tiktoken` library to count how many tokens are in the string "Hello World" using the encoding for `gpt-4`.', 'import tiktoken

# Your code here', 'import tiktoken

enc = tiktoken.encoding_for_model("gpt-4")
tokens = enc.encode("Hello World")
print(len(tokens))');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'What is a Token?', 'A subword chunk of text that the LLM reads and processes.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'What is an Embedding?', 'A mathematical vector representation of a token, where similar concepts are grouped close together in vector space.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'What is Byte Pair Encoding (BPE)?', 'A data compression technique widely used as a subword tokenization method in LLMs.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'What is the Context Window?', 'The maximum limit of tokens an LLM can process and remember in a single interaction.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 3' LIMIT 1), 'Why is tracking token usage important?', 'Because LLM APIs charge per token, and excessively large token counts increase latency and memory usage.');

-- ==============================================================================
-- Day 4: Lesson for Day 4
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Prompt Structure', 'Theory', 'A well-structured prompt typically contains:
- Role (Who is the AI?)
- Task (What should it do?)
- Context (Background information)
- Constraints (What must it NOT do?)
- Output Format (How should the answer be structured?)', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Prompting Techniques', 'Theory', 'Zero Shot: No examples provided.

One Shot: One example provided.

Few Shot: Multiple examples provided to guide the model.

Chain of Thought: Asking the model to "think step-by-step" to improve reasoning.', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Prompt Templates', 'Theory', 'Common templates:
"You are an expert..."
"Summarize the following text..."
"Return ONLY valid JSON..."', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Bad vs Good Prompt', 'Theory', 'Bad:
"Explain Python."

Good:
"You are a senior Python instructor.
Explain decorators using simple code examples.
Keep the explanation under 200 words."', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Prompt Best Practices', 'Theory', 'Be specific.
Provide examples (Few Shot).
Specify exact output formats.
Limit hallucinations by adding constraints like "If you don''t know the answer, say I don''t know."', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Code Example', 'Code', 'prompt = """
You are a SQL expert.

Convert this sentence into SQL.

Return only SQL.
"""', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Diagram', 'Diagram', 'flowchart TD
    A[Prompt] --> B[LLM]
    B --> C[Structured Output]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Summary', 'Theory', 'Prompt engineering significantly improves response quality without changing or retraining the model.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('b6b74559-e39e-427e-8560-259fdc42c194', 'Day 4 Quiz: Prompt Engineering', 'Test your understanding of prompt anatomy and techniques.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('b6b74559-e39e-427e-8560-259fdc42c194', 'Which of the following is NOT a standard component of prompt anatomy?', '["Role","Task","Learning Rate","Constraints"]'::jsonb, 2, 'Learning rate is a model training parameter, not part of prompt engineering.'),
('b6b74559-e39e-427e-8560-259fdc42c194', 'What is ''Few Shot Prompting''?', '["Giving the model multiple examples of the desired input/output before asking it to perform the task","Only allowing the model a few attempts to answer","Sending a very short prompt","Making the model think step-by-step"]'::jsonb, 0, 'Few shot prompting provides examples in the context window to guide the model''s behavior.'),
('b6b74559-e39e-427e-8560-259fdc42c194', 'What is the primary benefit of ''Chain of Thought'' prompting?', '["It saves tokens","It forces the model to break down its reasoning step-by-step, improving accuracy on complex tasks","It automatically connects to a database","It speeds up inference time"]'::jsonb, 1, 'Asking the model to think step-by-step drastically improves its logic and mathematical reasoning capabilities.'),
('b6b74559-e39e-427e-8560-259fdc42c194', 'Why is ''Explain Python'' considered a bad prompt?', '["It is too long","It asks about a programming language","It lacks specificity, role, context, and format constraints","It is zero-shot"]'::jsonb, 2, 'A prompt like this is far too vague and will result in a generic, unhelpful response.'),
('b6b74559-e39e-427e-8560-259fdc42c194', 'What is the best way to prevent hallucinations via prompting?', '["Use a smaller model","Explicitly instruct the model: ''If you do not know the answer based on the context, state that you do not know''","Use zero-shot prompting","Do not provide any context"]'::jsonb, 1, 'Providing explicit constraints against guessing is a highly effective anti-hallucination technique.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('0d303b4e-a3c2-4fb3-8750-d4f632d976f4', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Rewrite a Bad Prompt', 'You have a bad prompt: "Fix my code." Rewrite it as a high-quality system prompt string in Python.', 'bad_prompt = "Fix my code."

good_prompt = """
# Your prompt here
"""', 'good_prompt = """
You are a Senior Software Engineer.
Review the provided code for bugs, security vulnerabilities, and performance issues.
Provide the corrected code block and briefly explain the fixes.
"""');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'What is Zero-Shot Prompting?', 'Providing a prompt to the LLM without giving any examples of the expected output.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'What is Few-Shot Prompting?', 'Providing a few examples of the desired input-output behavior within the prompt.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'What is Chain of Thought?', 'A prompting technique where the model is asked to ''think step-by-step'' to improve logical reasoning.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'Name the five components of Prompt Anatomy.', 'Role, Task, Context, Constraints, and Output Format.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 4' LIMIT 1), 'How can you improve a bad prompt like ''Write a blog post''?', 'By assigning a Role (expert marketer), specifying the Context (topic), and enforcing Constraints (word count, tone).');

-- ==============================================================================
-- Day 5: Lesson for Day 5
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'REST APIs', 'Theory', 'REST APIs are the standard way applications communicate over the internet using HTTP.

They rely on:
- Request (Client asks for something)
- Response (Server replies)
- JSON (The standard data format for these exchanges)', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Authentication', 'Theory', 'APIs are protected using API Keys.

API Keys must be stored in Environment Variables.

CRITICAL: Never expose API keys in frontend code (like React or Vue), as users can steal them.', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Making Requests', 'Theory', 'Client -> API -> LLM -> Response

You send a JSON payload containing the model name, messages, and parameters. The API processes it and returns a JSON response.', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Parsing JSON', 'Theory', 'OpenAI API responses contain several fields:
- status: The HTTP status code.
- choices: An array of generated responses (usually you take choices[0]).
- message: The actual generated text.
- usage: Token counts for billing.', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Rate Limits', 'Theory', 'Providers restrict usage to prevent abuse.

- Token Limits: Max tokens per minute (TPM).
- Retries: You must implement exponential backoff if a request fails.
- Timeouts: LLMs take time to generate text; ensure your HTTP client doesn''t timeout prematurely.', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Code Example', 'Code', 'from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.5",
    input="Explain APIs."
)

print(response.output_text)', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Diagram', 'Diagram', 'flowchart TD
    A[Frontend] --> B[Backend]
    B --> C[OpenAI API]
    C --> D[LLM]
    D --> E[Backend]
    E --> F[Frontend]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Summary', 'Theory', 'Applications should call LLM APIs from secure backend services rather than directly from the frontend to protect API keys and manage rate limits.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('20e11495-7e88-4b28-a3ac-8abe40937704', 'Day 5 Quiz: APIs & Integration', 'Test your knowledge on API integration and security.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('20e11495-7e88-4b28-a3ac-8abe40937704', 'Why should you NEVER put your OpenAI API key in your React frontend?', '["It will slow down the application","It will cause CORS errors","Anyone can view the source code and steal your key to run up your bill","The API only accepts requests from Python"]'::jsonb, 2, 'Frontend code is shipped to the user''s browser, meaning API keys are fully exposed to malicious users.'),
('20e11495-7e88-4b28-a3ac-8abe40937704', 'What does TPM stand for in the context of LLM APIs?', '["Total Prompt Memory","Tokens Per Minute","Time Per Message","Text Processing Module"]'::jsonb, 1, 'TPM is a standard rate-limiting metric used by LLM providers.'),
('20e11495-7e88-4b28-a3ac-8abe40937704', 'Which data format is standard for sending and receiving data with the OpenAI API?', '["XML","CSV","JSON","YAML"]'::jsonb, 2, 'JSON (JavaScript Object Notation) is the universally accepted format for REST APIs.'),
('20e11495-7e88-4b28-a3ac-8abe40937704', 'If your API request fails due to a rate limit (429 Error), what is the best practice?', '["Stop the application entirely","Retry immediately in an infinite loop","Implement exponential backoff retries","Switch to a different model"]'::jsonb, 2, 'Exponential backoff safely retries the request with increasing delays, preventing further rate limit violations.'),
('20e11495-7e88-4b28-a3ac-8abe40937704', 'In the OpenAI JSON response, where is the generated text typically located?', '["usage.total_tokens","choices[0].message.content","model.name","status.code"]'::jsonb, 1, 'The generated text is nested inside the first item of the choices array, within the message object.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('4843f671-1627-4970-b5bf-cf97f42a2244', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Extracting the Message', 'Given a mock JSON response from OpenAI, extract and print the content of the assistant''s message.', 'import json

mock_response = """
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I am an AI."
      }
    }
  ]
}
"""

# Your code here', 'import json

mock_response = """
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I am an AI."
      }
    }
  ]
}
"""

data = json.loads(mock_response)
content = data["choices"][0]["message"]["content"]
print(content)');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'What is a REST API?', 'An architectural style for APIs that uses HTTP requests to GET, PUT, POST, and DELETE data.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'Why use Environment Variables?', 'To securely store sensitive information like API keys outside of the source code.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'What is a Rate Limit?', 'A restriction placed by an API provider on how many requests or tokens you can process within a specific timeframe.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'What is Exponential Backoff?', 'An error-handling strategy that retries failed API requests with progressively longer delays.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 5' LIMIT 1), 'What does the ''usage'' field in an API response tell you?', 'The number of prompt tokens and completion tokens consumed, which dictates the cost of the request.');

-- ==============================================================================
-- Day 6: Lesson for Day 6
-- ==============================================================================

-- 1. Lesson Sections
INSERT INTO lesson_sections (lesson_id, title, section_type, content, order_index) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Chat Architecture', 'Theory', 'Building a chatbot requires more than just an API call.

Architecture:
Frontend (UI) -> Backend (Orchestration) -> LLM (Generation) -> Database (State)', 1),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Conversation History', 'Theory', 'LLMs are stateless! They do not remember previous messages.

To have a conversation, you must pass the ENTIRE message history back to the model every single time.

Roles:
System: High-level instructions.
User: The human''s input.
Assistant: The LLM''s past replies.', 2),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Chat Completion Flow', 'Theory', '1. Receive User Input
2. Retrieve past messages from Database
3. Append User Input to History
4. Call API with full history
5. Store Assistant Response in Database
6. Return Output to User', 3),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Error Handling', 'Theory', 'Production chatbots must handle:
- Retries for transient API errors.
- Timeouts (if the LLM hangs).
- Fallback Responses ("I am experiencing high traffic right now, please try again").', 4),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Improving UX', 'Theory', 'To make chatbots feel responsive:
- Typing Indicators
- Streaming (Server-Sent Events) to show tokens as they generate.
- Markdown Rendering for formatted text.
- Syntax Highlighting for code blocks.', 5),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Code Example', 'Code', 'messages = [
    {"role":"system","content":"You are a helpful assistant."},
    {"role":"user","content":"Hello, I am Bob."},
    {"role":"assistant","content":"Hi Bob, how can I help you?"},
    {"role":"user","content":"What is my name?"} # The model needs the history to answer this!
]', 6),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Diagram', 'Diagram', 'flowchart LR
    A[User Input] --> B[Append to History]
    B --> C[Send Full Array to API]
    C --> D[Assistant Output]
    D --> E[Store in History]', 7),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Summary', 'Theory', 'A production chatbot requires backend orchestration, conversation history, API integration, and error handling—not just a frontend chat interface.', 8);

-- 2. Quizzes
INSERT INTO quizzes (id, title, description) VALUES
('2d6248a5-e453-4a63-a74d-086384de31e8', 'Day 6 Quiz: Building Chatbots', 'Test your knowledge on state management and conversation history.');

-- 3. Quiz Questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation) VALUES
('2d6248a5-e453-4a63-a74d-086384de31e8', 'Why must you send the entire conversation history to the LLM for every message?', '["Because LLMs are inherently stateless and have no memory between API calls","To increase the cost of the API call","To prevent prompt injection","Because the API requires exactly 10 messages"]'::jsonb, 0, 'LLM APIs are stateless REST endpoints. They only ''remember'' what you include in the current request payload.'),
('2d6248a5-e453-4a63-a74d-086384de31e8', 'What is the purpose of the ''System'' role in a message array?', '["To define the user''s name","To set high-level behavior, tone, and instructions for the assistant","To store database credentials","To log errors"]'::jsonb, 1, 'The System message anchors the model''s persona and overarching constraints.'),
('2d6248a5-e453-4a63-a74d-086384de31e8', 'Which technique drastically improves user experience by displaying text immediately as it generates?', '["Polling","WebHooks","Streaming (Server-Sent Events)","Batch Processing"]'::jsonb, 2, 'Streaming chunks of tokens to the frontend reduces perceived latency significantly.'),
('2d6248a5-e453-4a63-a74d-086384de31e8', 'What happens if your conversation history exceeds the model''s context window?', '["The model automatically summarizes it","The API request fails with a Token Limit error","The model deletes the oldest messages","The model generates a random string"]'::jsonb, 1, 'If the total tokens exceed the context window, the API throws an error. You must truncate or summarize history manually before sending.'),
('2d6248a5-e453-4a63-a74d-086384de31e8', 'Which of the following belongs in the backend rather than the frontend?', '["Rendering Markdown","Securely storing the OpenAI API Key","Displaying a typing indicator","Styling code blocks"]'::jsonb, 1, 'API keys must be kept secure on the backend to prevent theft.');

-- 4. Coding Challenges
INSERT INTO coding_challenges (id, lesson_id, title, problem_statement, starter_code, solution_code) VALUES
('ed1a31e7-13f3-44cb-a0da-77cb975672a9', (SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Message Array Structure', 'Create a Python list called `messages` containing a system prompt instructing the AI to be a pirate, and a user prompt asking "What is AI?".', 'messages = []

# Your code here', 'messages = [
    {"role": "system", "content": "You are a helpful AI assistant that speaks strictly like a pirate."},
    {"role": "user", "content": "What is AI?"}
]');

-- 5. Flashcards
INSERT INTO flashcards (category, question, answer) VALUES
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Are LLM APIs stateful or stateless?', 'Stateless. They retain no memory of previous requests.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'How do chatbots maintain context?', 'By passing the entire conversation history in an array with every new request.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'What are the three primary roles in an LLM message array?', 'System, User, and Assistant.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'What is Streaming in the context of LLMs?', 'Sending tokens to the client as they are generated, rather than waiting for the entire response to finish.'),
((SELECT id FROM curriculum_nodes WHERE title = 'Lesson for Day 6' LIMIT 1), 'Why do we need a database for a chatbot?', 'To persist the user''s conversation history across sessions so it can be retrieved and sent to the LLM.');

