# Day 6: Embeddings

## 1. Lesson Metadata
- **Lesson Title:** Embeddings & Semantic Search
- **Duration:** 2-3 hours
- **Difficulty:** Intermediate
- **Estimated Study Time:** 2.5 hours
- **Learning Objectives:**
  - Understand the concept of High-Dimensional Vector Spaces.
  - Explain how embeddings capture semantic meaning mathematically.
  - Calculate and understand Cosine Similarity.
  - Understand the architecture of Semantic Search and its role in Retrieval-Augmented Generation (RAG).
  - Compare Dense (Embedding) retrieval vs Sparse (BM25/Keyword) retrieval.
- **Prerequisites:** Basic algebra (vectors, dot products).
- **Expected Outcomes:** You will be able to write a Python script that converts text into embeddings using an API, calculates the similarity between them, and builds a conceptual vector search engine.

---

## 2. Theory Section

### The Vector Space
An embedding is a list of floating-point numbers (a vector). For example, OpenAI's `text-embedding-ada-002` model outputs a vector of length 1,536. 
Imagine a 3D coordinate system (X, Y, Z). A vector `[1, 2, 3]` is a point in that space. Now imagine a space with 1,536 dimensions. We can't visualize it, but the math works exactly the same.
An embedding model is trained to place words or sentences that have similar *meanings* close to each other in this high-dimensional space.
- "The dog barked" might be at coordinates `[0.1, 0.9, ...]`
- "The puppy yipped" might be at `[0.12, 0.88, ...]` (Very close!)
- "I love financial modeling" might be at `[-0.8, -0.2, ...]` (Very far away!)

### Cosine Similarity: Measuring Distance
How do we know if two vectors are close? We measure the distance or angle between them.
While Euclidean Distance (measuring the straight line between two points) works, **Cosine Similarity** is the industry standard for embeddings.
- Cosine similarity measures the *angle* between two vectors, regardless of their magnitude (length).
- If two vectors point in the exact same direction, the angle is 0, and the cosine of 0 is **1.0** (Perfect similarity).
- If they are orthogonal (90 degrees, completely unrelated), the cosine is **0.0**.
- If they point in exact opposite directions (180 degrees), the cosine is **-1.0**.

### Semantic Search vs Keyword Search
Traditional databases use Keyword Search (like BM25 or TF-IDF). 
- *Query:* "How to cancel my subscription?"
- *Document:* "To terminate your account, click here."
- *Keyword Search Result:* 0% match. The words don't overlap.

**Semantic Search** uses embeddings.
- We generate an embedding for the Query.
- We generate embeddings for all Documents in our database.
- We calculate the Cosine Similarity between the Query vector and all Document vectors.
- *Semantic Search Result:* 95% match. "Terminate account" and "cancel subscription" occupy the exact same neighborhood in the vector space.

### The Foundation of RAG
Embeddings are the backbone of modern LLM applications. LLMs hallucinate and have limited context windows. To fix this, we use Retrieval-Augmented Generation (RAG).
1. **Chunking & Embedding:** Break your company's private PDF into paragraphs. Embed each paragraph and store it in a Vector Database (like Pinecone, Milvus, or pgvector).
2. **Retrieval:** Embed the user's question. Perform a semantic search to find the Top-K most similar paragraphs.
3. **Generation:** Inject those paragraphs into the LLM's prompt: `"Answer the user based on this context: [Paragraphs]"`.

---

## 3. Architecture Section

### Semantic Search Flow

```mermaid
flowchart TD
    subgraph Data Pipeline (Offline)
        Doc[Private Document] --> Chunk[Chunking]
        Chunk --> EmbedModel1[Embedding Model]
        EmbedModel1 --> VecDB[(Vector Database)]
    end

    subgraph Query Pipeline (Real-time)
        User[User Question] --> EmbedModel2[Embedding Model]
        EmbedModel2 --> QueryVec[Query Vector]
        QueryVec -->|Cosine Similarity Search| VecDB
        VecDB -->|Returns Top-K Chunks| Prompt[Construct Prompt]
        Prompt --> LLM[Large Language Model]
        LLM --> Answer[Final Answer]
    end
```

---

## 4. Code Examples

Let's implement Cosine Similarity and a basic Semantic Search engine in Python.

```python
"""
Filename: semantic_search_demo.py
Description: Calculating Cosine Similarity and building a naive vector search.
"""
import numpy as np

def cosine_similarity(v1, v2):
    """Calculates the cosine similarity between two 1D numpy arrays."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    
    # Prevent division by zero
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
        
    return dot_product / (norm_v1 * norm_v2)

# --- Execution ---
if __name__ == "__main__":
    # Simulated Embeddings (e.g., from an API, simplified to 4 dimensions)
    # In reality, these would be 768 or 1536 dimensional vectors.
    database = {
        "doc1_puppy": np.array([0.9, 0.8, 0.1, 0.0]), # Talks about dogs
        "doc2_cat":   np.array([0.8, 0.7, 0.2, 0.1]), # Talks about cats (similar to dogs)
        "doc3_bank":  np.array([0.0, 0.1, 0.9, 0.8]), # Talks about finance
        "doc4_money": np.array([0.1, 0.0, 0.8, 0.9])  # Talks about money (similar to finance)
    }
    
    # User query: "Tell me about dogs."
    query_vector = np.array([1.0, 0.9, 0.0, 0.0])
    
    print("User Query Vector:", query_vector)
    print("-" * 30)
    
    # Perform Semantic Search
    results = {}
    for doc_id, doc_vector in database.items():
        sim = cosine_similarity(query_vector, doc_vector)
        results[doc_id] = sim
        
    # Sort results by similarity (Descending)
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
    
    print("Semantic Search Results:")
    for doc_id, score in sorted_results:
        print(f"{doc_id}: {score:.4f}")
        
    print("\nNotice how the 'puppy' and 'cat' documents score highly,")
    print("while 'bank' and 'money' score near zero, despite no keywords being used!")
```

---

## 5. Hands-on Exercise

### Easy
**Task:** Run the Python script. Change the `query_vector` to `[0.0, 0.1, 1.0, 1.0]` (simulating a query about investing). Observe how the search results flip, prioritizing `doc3_bank` and `doc4_money`.

### Medium
**Task:** Euclidean distance is another way to measure similarity (the physical distance between two points: $\sqrt{\sum(A_i - B_i)^2}$). Write a Python function `euclidean_distance(v1, v2)`. Calculate the distances between the query and the documents. Note that for Euclidean distance, *smaller* is better.

### Hard
**Task:** Create a free account on Hugging Face. Get an API key. Use the `requests` library in Python to send three sentences to the `sentence-transformers/all-MiniLM-L6-v2` Inference API endpoint. Extract the embeddings (lists of floats) from the JSON response and run them through your `cosine_similarity` function to prove semantic search works on real data.

---

## 6. Mini Assignment
**Calculate Asymmetric Semantic Similarity:**
Sometimes, a query is short ("Dog") and the document is long (A whole Wikipedia page about dogs). 
Write a script that creates a simulated Query vector of length 5, and a simulated Document vector of length 5. Multiply the Document vector by 10 (increasing its magnitude). Calculate the Cosine Similarity. 
In a comment, explain why the similarity score did not change even though the Document vector is now 10 times larger. (Hint: Cosine measures angle, not magnitude).

---

## 7. Coding Challenge

**Problem Statement:**
Implement a Top-K Semantic Retriever. You are given a query vector, a 2D list of document vectors, and an integer `k`. You must return the *indices* of the top `k` most similar documents using Cosine Similarity. If two documents have the same similarity, preserve their original order.

**Input:** 
- `query`: A list of floats.
- `documents`: A list of lists of floats.
- `k`: An integer.

**Output:** A list of `k` integers representing the indices of the best documents.

**Constraints:**
- Length of vectors: $1 \le len \le 100$
- Number of documents: $1 \le N \le 1000$

**Starter Code:**
```python
def retrieve_top_k(query: list[float], documents: list[list[float]], k: int) -> list[int]:
    # Your code here
    pass
```

**Solution:**
```python
import math

def get_cosine_sim(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot / (norm_v1 * norm_v2)

def retrieve_top_k(query: list[float], documents: list[list[float]], k: int) -> list[int]:
    scores = []
    for idx, doc in enumerate(documents):
        sim = get_cosine_sim(query, doc)
        scores.append((sim, idx))
        
    # Sort by similarity descending. Python's sort is stable, preserving order on ties.
    scores.sort(key=lambda x: x[0], reverse=True)
    
    return [idx for sim, idx in scores[:k]]
```

**Hidden Test Cases:**
1. `retrieve_top_k([1, 0], [[0, 1], [1, 0.1], [1, 0]], 2)` -> `[2, 1]`
2. `retrieve_top_k([1, 1], [[-1, -1], [0, 0], [1, 1]], 1)` -> `[2]`

---

## 8. Quiz

1. **What is an Embedding?**
   - A) A SQL table.
   - B) A list of floating-point numbers representing the semantic meaning of text in a high-dimensional space.
   - C) A type of neural network layer that outputs text.
   - D) A token used for padding.
   - **Correct Answer:** B
   - **Explanation:** Embeddings map discrete text into continuous mathematical vectors.

2. **Why is Cosine Similarity preferred over Euclidean Distance for embeddings?**
   - A) It is faster to compute.
   - B) It focuses on the angle (direction) of the vectors, meaning it is robust to variations in document length (magnitude).
   - C) It only works on GPUs.
   - D) Euclidean distance cannot be calculated in more than 3 dimensions.
   - **Correct Answer:** B
   - **Explanation:** A short query and a long document might be far apart in Euclidean space due to magnitude, but point in the exact same semantic direction (high cosine similarity).

3. **What is the cosine similarity of two orthogonal (unrelated) vectors?**
   - A) 1.0
   - B) -1.0
   - C) 0.0
   - D) 100.0
   - **Correct Answer:** C
   - **Explanation:** The cosine of 90 degrees is 0.

4. **Which search method would successfully match "terminate account" with "cancel subscription"?**
   - A) TF-IDF Keyword Search
   - B) BM25 Keyword Search
   - C) Regex Search
   - D) Semantic (Vector) Search
   - **Correct Answer:** D
   - **Explanation:** Semantic search matches on *meaning* (vector proximity) rather than exact string overlap.

5. **What does RAG stand for?**
   - A) Random Access Generation
   - B) Retrieval-Augmented Generation
   - C) Real-time Artificial Generation
   - D) Recurrent Attention Gate
   - **Correct Answer:** B
   - **Explanation:** It is the architecture of retrieving relevant documents via semantic search and augmenting the LLM's prompt with them.

6. **In a RAG pipeline, when is the Vector Database queried?**
   - A) During the offline chunking phase.
   - B) During the model's initial pre-training.
   - C) In real-time, right after the user asks a question and the question is embedded.
   - D) After the LLM generates the answer.
   - **Correct Answer:** C
   - **Explanation:** The user's query is converted to a vector on the fly, which is then used to search the Vector DB.

7. **What happens if you embed the Query using `model_A` but the Documents were embedded using `model_B`?**
   - A) It works perfectly fine.
   - B) The database will automatically translate them.
   - C) The semantic search will return total garbage.
   - D) The LLM will hallucinate.
   - **Correct Answer:** C
   - **Explanation:** Different models create entirely different vector spaces. A vector from `model_A` has absolutely no mathematical relationship to a vector from `model_B`.

8. **If the dot product of two normalized vectors (length = 1) is 1.0, what does that mean?**
   - A) They are completely unrelated.
   - B) They are identical in direction (perfect similarity).
   - C) They point in opposite directions.
   - D) The model crashed.
   - **Correct Answer:** B
   - **Explanation:** For normalized vectors, the dot product IS the cosine similarity. 1.0 means an angle of 0 degrees.

9. **Which is a popular, purpose-built Vector Database?**
   - A) MongoDB
   - B) Redis
   - C) Pinecone
   - D) SQLite
   - **Correct Answer:** C
   - **Explanation:** Pinecone (along with Milvus, Qdrant, and Weaviate) is explicitly designed for fast Nearest-Neighbor vector search. (Note: Postgres can also do this via the `pgvector` extension).

10. **Why must documents be "chunked" before embedding?**
    - A) To save money.
    - B) Because embedding models have token limits (e.g., 8192 tokens), and a whole book cannot be embedded into a single highly-specific vector without losing granular detail.
    - C) Because Vector DBs can only store integers.
    - D) To prevent prompt injection.
    - **Correct Answer:** B
    - **Explanation:** If you embed a whole book into one vector, the vector represents the "average" of the book. You lose the ability to search for specific facts.

---

## 9. Flashcards

1. **Front:** What is an Embedding?
   **Back:** A numerical representation (vector) of text where mathematical distance represents semantic similarity.
   **Difficulty:** Easy

2. **Front:** What is Cosine Similarity?
   **Back:** A metric that measures the cosine of the angle between two vectors, returning 1 for identical, 0 for orthogonal, and -1 for opposites.
   **Difficulty:** Easy

3. **Front:** Keyword Search vs Semantic Search?
   **Back:** Keyword search looks for exact string matches. Semantic search looks for meaning/concept matches using vectors.
   **Difficulty:** Medium

4. **Front:** What is RAG?
   **Back:** Retrieval-Augmented Generation. Supplying an LLM with relevant facts retrieved from a database to ground its answers.
   **Difficulty:** Medium

5. **Front:** What is the primary purpose of a Vector Database?
   **Back:** To store high-dimensional embeddings and perform ultra-fast Nearest-Neighbor similarity searches.
   **Difficulty:** Medium

6. **Front:** Why do we "chunk" documents before embedding them?
   **Back:** To fit within the embedding model's context window and to preserve granular, specific semantic meaning rather than "averaging out" a whole book.
   **Difficulty:** Hard

7. **Front:** Can you compare an embedding from OpenAI with an embedding from Hugging Face?
   **Back:** No. They map to entirely different vector spaces. The query and documents must be embedded by the exact same model.
   **Difficulty:** Medium

8. **Front:** If two vectors point in opposite directions, what is their cosine similarity?
   **Back:** -1.0
   **Difficulty:** Easy

9. **Front:** Name one popular Vector Database.
   **Back:** Pinecone, Milvus, Qdrant, or Postgres with pgvector.
   **Difficulty:** Easy

10. **Front:** Why is Cosine Similarity often preferred over Euclidean distance in NLP?
    **Back:** It is magnitude-invariant, meaning it focuses on the direction (meaning) of the text rather than its length.
    **Difficulty:** Hard

---

## 10. Interview Questions

### Beginner
**Q: Explain how Semantic Search works to someone who only knows standard SQL searches.**
**Ideal Answer:** Standard SQL searches for exact words using `LIKE '%keyword%'`. If you search for "automobile", it misses documents containing "car". Semantic search uses an AI model to convert text into mathematical coordinates. "Automobile" and "car" end up very close to each other in this coordinate space. The database then just calculates the distance between points, allowing it to find relevant documents even if the exact words don't match.

### Intermediate
**Q: What is a chunking strategy, and why does it matter in a RAG pipeline?**
**Ideal Answer:** Chunking is how you split a large document (like a PDF) before embedding it. If you chunk too small (e.g., sentence level), the vector lacks context ("It is green" - what is green?). If you chunk too large (e.g., whole pages), the vector's meaning becomes diluted, and the retrieval accuracy drops. A good strategy uses overlap (e.g., 500 tokens with a 50-token overlap) to ensure context isn't lost at the boundaries.

### Advanced
**Q: A pure vector search often struggles with queries like "What were the Q3 earnings for 2021?". The semantic search might return Q3 earnings for 2022 because they are semantically identical. How do you solve this?**
**Ideal Answer:** I would use Hybrid Search. Pure dense vector search is bad at exact keyword or entity matching (like years, names, or IDs). Hybrid search combines Dense Retrieval (Embeddings/Cosine Similarity) with Sparse Retrieval (BM25/Keyword search). The scores from both algorithms are normalized and combined (using algorithms like Reciprocal Rank Fusion - RRF). Additionally, I would extract metadata (like `year=2021`) during chunking and apply a metadata filter (a hard `WHERE` clause) before running the vector search.

### HR-style / Conceptual
**Q: Tell me about a time you had to choose between a managed service and building an open-source solution.**
**Ideal Answer:** In a previous project, we needed a Vector Database. The managed service (Pinecone) offered zero-maintenance and immediate scalability, but our data was highly sensitive (PII), and legal didn't want data leaving our VPC. I advocated for using `pgvector` inside our existing Postgres infrastructure. While it required more engineering effort to tune the HNSW indexes, it satisfied compliance, reduced vendor lock-in, and utilized our team's existing SQL expertise.

---

## 11. Resources
- **Blogs:** "Understanding Embeddings" by OpenAI.
- **Documentation:** Pinecone documentation on Hybrid Search and Vector Math.
- **Libraries:** `langchain` and `llamaindex` (Standard frameworks for building RAG pipelines).
- **YouTube:** "Vector Databases Explained" by Fireship.

---

## 12. Real World Engineering
### Production Vector Search
- **The ANN Problem:** Calculating exact Cosine Similarity against 1 billion vectors takes too long (O(N) scan). Production databases use Approximate Nearest Neighbor (ANN) algorithms. The most common is **HNSW (Hierarchical Navigable Small World)** graphs. It trades a tiny bit of accuracy for massive speedups (O(log N) search time).
- **Asymmetric Search:** User queries are usually short ("fix broken printer"), but documents are long. Some embedding models (like Cohere's) are explicitly trained to handle asymmetric search, mapping short queries and long documents into the same neighborhood better than standard models.
- **Reranking:** In production RAG, you rarely trust the vector database's top 5 results blindly. Engineers implement a "Retrieve and Rerank" pipeline. The Vector DB retrieves the Top 100 fast using fast, cheap embeddings. Then, a highly accurate (but slower) Cross-Encoder model scores those 100 documents against the query and re-sorts them, passing only the absolute best Top 5 to the LLM.
