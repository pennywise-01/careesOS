# Implementation Plan: Real Semantic Scoring

> **Replaces:** `embedding_mock` 4-float arrays and `avg_confidence`-based approximation.  
> **Dependency:** Supabase setup (from Auth Phase 0) must be complete. pgvector is a Supabase extension — one-click enable.

---

## Current State (Prototype)

```js
// mockData.js — fake 4-float vectors
embedding_mock: [0.1, 0.8, 0.3, 0.9]

// Dashboard.jsx — fake cosine similarity on 4-float arrays
semantic = min(0.99, (avg_confidence * 0.8) + 0.15)
```

This does not measure semantic alignment between the candidate and the job. It measures narrative confidence — a proxy that breaks when a candidate writes well but in the wrong domain.

---

## What Real Semantic Scoring Does

Converts the candidate's full narrative answers and the job's description into dense vectors (embeddings), then calculates cosine similarity between them. A high score means the candidate's language, domain framing, and concepts genuinely align with the role — not just keyword overlap.

```
Candidate: all 6 answers concatenated (raw text)
        ↓
Embedding model → 1024-dim vector stored in DB
        ↓  cosine similarity
Job: description + requirements + work_sample_task concatenated
        ↓
Embedding model → 1024-dim vector stored in DB
        =
Semantic score  0.0 – 1.0
```

---

## Embedding Model Decision

**Recommended for MVP: DeepSeek Embeddings**
- Already using DeepSeek for extraction and grading — single vendor, consistent billing
- 1024-dim output — sufficient for semantic matching
- ~$0.10 per 1M tokens — negligible cost at prototype/early scale

**Recommended for Asia production scale: BAAI/BGE-M3 (self-hosted)**
- Free, open-source
- Multilingual: covers English, Malay, Mandarin, Tamil — critical for Southeast Asia
- 1024-dim output
- Runs on a single CPU instance for low-to-medium volume
- Switch from DeepSeek embeddings to BGE-M3 is a one-line model swap — same vector dimensions

---

## What Gets Embedded

| Input | Source | When generated |
|---|---|---|
| **Job text** | `description + requirements.join(' ') + work_sample_task` | When reviewer posts the job |
| **Candidate text** | All 6 answers concatenated (raw, not extracted profile) | After candidate submits questionnaire |

**Why raw answers, not extracted profile:**
The extracted profile is a lossy compression. The raw answers contain richer semantic signal — domain vocabulary, narrative framing, reasoning style — which embedding models capture better than a structured JSON summary.

---

## Database Changes

### Enable pgvector (Supabase Dashboard → Extensions → enable `vector`)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Schema additions

```sql
-- Jobs table
ALTER TABLE jobs ADD COLUMN embedding vector(1024);

-- Applications table
ALTER TABLE applications ADD COLUMN embedding vector(1024);

-- Optional: ANN index for fast similarity search at scale
CREATE INDEX ON jobs        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ON applications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

> The ivfflat index is optional for MVP — only needed when you have 10,000+ rows. Add it before going to production scale.

---

## Backend Changes

### 1. Embedding helper function

```python
# services/embeddings.py

import httpx

async def generate_embedding(text: str) -> list[float]:
    response = await httpx.AsyncClient().post(
        "https://api.deepseek.com/embeddings",
        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
        json={"model": "deepseek-embedding", "input": text}
    )
    return response.json()["data"][0]["embedding"]
```

To swap to BGE-M3 later, replace the URL and model name only — nothing else changes.

---

### 2. Generate embedding when job is posted

```python
# POST /api/jobs

job_text = f"{job.description} {' '.join(job.requirements)} {job.work_sample_task}"
job.embedding = await generate_embedding(job_text)
db.add(job)
db.commit()
```

---

### 3. Generate embedding when candidate submits answers

```python
# POST /api/extract-profile  (already exists — add here)

candidate_text = " ".join([
    answers.get("q1", ""),
    answers.get("q2", ""),
    answers.get("q3", ""),
    answers.get("q4", ""),
    answers.get("q5", ""),
    answers.get("q6", "")
])
application.embedding = await generate_embedding(candidate_text)
db.add(application)
db.commit()
```

---

### 4. Semantic score calculation

```python
# services/scoring.py

from pgvector.sqlalchemy import cosine_distance

def calculate_semantic_score(app_embedding: list, job_embedding: list) -> float:
    # cosine similarity = 1 - cosine distance
    dot = sum(a * b for a, b in zip(app_embedding, job_embedding))
    norm_a = sum(a ** 2 for a in app_embedding) ** 0.5
    norm_b = sum(b ** 2 for b in job_embedding) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return round(dot / (norm_a * norm_b), 3)
```

Or use pgvector's native SQL operator (faster at scale):

```sql
SELECT 1 - (a.embedding <=> j.embedding) AS semantic_score
FROM applications a
JOIN jobs j ON j.id = a.job_id
WHERE a.id = :application_id;
```

---

## Scoring Engine Update

Replace the mock approximation everywhere it is used:

```python
# Before (mock — frontend Dashboard.jsx)
semantic = min(0.99, (avg_confidence * 0.8) + 0.15)

# After (real — backend scoring service)
semantic = calculate_semantic_score(application.embedding, job.embedding)
```

Composite formula, weights, and all other factors remain unchanged.

---

## Cost Estimate

| Event | Approx tokens | Volume (100 users/month) |
|---|---|---|
| Job posted | ~500 tokens | ~10 jobs → 5,000 tokens |
| Candidate answers | ~1,500 tokens | ~100 apps → 150,000 tokens |
| **Total/month** | | **~155,000 tokens** |

At DeepSeek embedding pricing (~$0.10/1M tokens):
**~$0.016/month for 100 users. Effectively free.**

At 10,000 users/month: ~$1.55/month. Still negligible.

---

## Cleanup After Implementation

Remove from codebase once real embeddings are live:

| Item | Location | Action |
|---|---|---|
| `embedding_mock` arrays | `mockData.js` — all candidates and jobs | Delete |
| Mock cosine similarity function | `Dashboard.jsx` `cosineSimilarity()` | Move to backend, delete from frontend |
| `min(0.99, avg_confidence * 0.8 + 0.15)` | `Dashboard.jsx` `calculateScores()` | Replace with API call |
| `embedding_mock` field on submitted applications | `UserJourney.jsx` submission block | Delete |

---

## Build Order

```
Supabase setup complete (Phase 0)
        ↓
Enable pgvector extension in Supabase dashboard     ← 5 minutes
        ↓
Add embedding columns to jobs + applications tables ← DB migration, 10 minutes
        ↓
Build generate_embedding() helper                   ← 1 hour
        ↓
Integrate into POST /api/jobs (job creation)        ← 1 hour
        ↓
Integrate into POST /api/extract-profile            ← 1 hour
        ↓
Build calculate_semantic_score() backend function   ← 1 hour
        ↓
Update composite scoring to use real score          ← 1 hour
        ↓
Remove embedding_mock from frontend codebase        ← 30 minutes
```

**Total effort: ~1 day** — the smallest high-impact change in the entire prod migration.

---

## Risks

| Risk | Mitigation |
|---|---|
| DeepSeek embedding API rate limits | Batch embed on job post and answer submit, not on every dashboard load |
| Embedding dimensions change between models | Store dimension count on each record; validate before similarity calculation |
| Candidate writes in Malay/mixed language | Switch to BGE-M3 multilingual model — same pipeline, different model endpoint |
| Embeddings become stale if job is edited | Re-generate job embedding on every job update |
