# Implementation Plan: Resume Upload & Auto-Parsing

> Applicant uploads their resume. Backend extracts text, sends to DeepSeek, returns structured data to pre-fill their career profile. Applicant reviews and confirms before saving.  
> **Dependencies:** Auth, DB, Backend deployment plans complete. Supabase Storage enabled.

---

## Flow

```
Applicant uploads PDF or DOCX
        ↓
POST /api/resume/upload
        ↓
Backend validates file type + size
        ↓
File stored in Supabase Storage (under user's own folder)
        ↓
Backend extracts plain text (pdfplumber / python-docx)
        ↓
Full extracted text sent to DeepSeek with structured prompt
        ↓
DeepSeek returns structured JSON
        ↓
Backend returns parsed data — nothing saved yet
        ↓
Frontend shows pre-filled review form
        ↓
Applicant reviews and edits
        ↓
Applicant confirms → PUT /api/profile saves to career_profiles
```

---

## Supabase Storage Setup

```
Bucket name:  resumes
Access:       private (no public URLs — authenticated reads only)
Allowed types: application/pdf
               application/vnd.openxmlformats-officedocument.wordprocessingml.document
Max file size: 10MB
```

Storage path pattern: `{user_id}/{timestamp}_{original_filename}`

### Storage RLS policies

```sql
-- Applicant can upload to their own folder only
CREATE POLICY "applicant_upload_own_resume"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Applicant can read their own resume only
CREATE POLICY "applicant_read_own_resume"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Database Changes

```sql
-- Add resume tracking fields to career_profiles
ALTER TABLE career_profiles ADD COLUMN resume_storage_path  TEXT;
ALTER TABLE career_profiles ADD COLUMN resume_filename       TEXT;
ALTER TABLE career_profiles ADD COLUMN resume_uploaded_at   TIMESTAMPTZ;
```

---

## Backend

### Dependencies

```
pdfplumber==0.11.0
python-docx==1.1.2
```

### Text extraction service

```python
# services/resume_parser.py
import pdfplumber
from docx import Document
import io

def extract_text(file_bytes: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())

    raise ValueError(f"Unsupported file type: {content_type}")
```

### DeepSeek parsing prompt

```python
RESUME_PARSE_PROMPT = """
You are a resume parser. Extract structured career information from the resume text below.
Return ONLY valid JSON matching this exact schema. Do not add commentary.

Schema:
{
  "current_role": "string or null",
  "years_experience": "integer or null",
  "industry": "one of: engineering | hr | operations | finance | marketing | design | product | legal | other",
  "city": "string or null",
  "company_size": "one of: startup | sme | mnc | glc | null",
  "skills": [
    { "name": "string", "inferred_level": "junior | mid | senior", "confidence": 0.0-1.0 }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "integer or null" }
  ],
  "life_chapter": "one of: student | early_career | mid_career | senior | executive",
  "summary": "2-3 sentence career summary inferred from the resume"
}

Rules:
- skills: extract all technical and domain skills mentioned. Infer level from context and years.
- life_chapter: infer from years_experience (0-2=early_career, 3-7=mid_career, 8-15=senior, 15+=executive, student if still studying)
- If a field cannot be determined, return null for that field
- Return empty arrays [] not null for array fields
- skills must have at least 1 item if any skills are detectable

Resume text:
{resume_text}
"""

async def parse_resume_with_deepseek(resume_text: str) -> dict:
    response = await deepseek_client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {
                "role": "user",
                "content": RESUME_PARSE_PROMPT.format(resume_text=resume_text)
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    return json.loads(response.choices[0].message.content)
```

### Upload endpoint

```python
# routers/resume.py

@router.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    # 2. Validate file size (10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10MB")

    # 3. Store in Supabase Storage
    storage_path = f"{user.id}/{int(time.time())}_{file.filename}"
    supabase.storage.from_("resumes").upload(
        storage_path,
        file_bytes,
        {"content-type": file.content_type}
    )

    # 4. Update career_profiles with resume path
    await db.execute(
        update(CareerProfile)
        .where(CareerProfile.user_id == user.id)
        .values(
            resume_storage_path=storage_path,
            resume_filename=file.filename,
            resume_uploaded_at=datetime.utcnow()
        )
    )
    await db.commit()

    # 5. Extract text
    resume_text = extract_text(file_bytes, file.content_type)
    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file. It may be a scanned image. Try a different format or fill in your profile manually."
        )

    # 6. Parse with DeepSeek
    parsed = await parse_resume_with_deepseek(resume_text)

    # 7. Return parsed data for review — NOT auto-saved
    return {
        "storage_path": storage_path,
        "filename": file.filename,
        "parsed_profile": parsed
    }
```

> **Critical:** The endpoint returns the parsed data but does not write to `career_profiles`. The frontend shows a review form. Saving is a separate `PUT /api/profile` call after the applicant confirms.

---

## Frontend

### Upload UI

```
┌──────────────────────────────────────────────────────┐
│  Upload your resume                                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │         Drag and drop your resume here         │  │
│  │              PDF or DOCX, max 10MB             │  │
│  │                                                │  │
│  │              [Browse files]                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Supported: PDF, DOCX                                │
└──────────────────────────────────────────────────────┘
```

After upload → loading state "Parsing your resume..." → review form:

```
┌──────────────────────────────────────────────────────┐
│  Review your parsed profile                          │
│  Extracted from resume.pdf — edit anything below     │
│                                                      │
│  Current role:    [Senior Engineer            ]      │
│  Years exp:       [8                          ]      │
│  Industry:        [Engineering              ▼]       │
│  City:            [Kuala Lumpur               ]      │
│                                                      │
│  Skills detected:                                    │
│  [Python ×] [Kubernetes ×] [FastAPI ×] [+ Add]      │
│                                                      │
│  [← Re-upload]              [Save Profile →]         │
└──────────────────────────────────────────────────────┘
```

### React component flow

```jsx
// pages/ResumeUpload.jsx

const [parsedProfile, setParsedProfile] = useState(null)
const [uploading, setUploading] = useState(false)

async function handleUpload(file) {
  setUploading(true)
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiCall('/api/resume/upload', {
    method: 'POST',
    body: formData,
    headers: {}  // let browser set multipart Content-Type with boundary
  })

  if (!res.ok) {
    const err = await res.json()
    setError(err.detail)
    return
  }

  const { parsed_profile } = await res.json()
  setParsedProfile(parsed_profile)  // show review form
  setUploading(false)
}

async function handleSave(editedProfile) {
  await apiCall('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(editedProfile)
  })
  navigate('/apply')
}
```

---

## Scanned PDF Handling

`pdfplumber` returns empty string for image-only PDFs (scanned documents). No OCR for MVP.

```python
if not resume_text.strip():
    raise HTTPException(
        status_code=422,
        detail="Your PDF appears to be a scanned image. Please upload a text-based PDF or DOCX, or fill in your profile manually."
    )
```

Frontend shows the error with a "Fill in manually →" fallback button that skips to the profile form.

---

## Build Order

```
1. Create Supabase Storage bucket + RLS policies        ← 30 minutes
2. Add resume fields to career_profiles migration       ← 15 minutes
3. Install pdfplumber + python-docx                     ← 10 minutes
4. Build extract_text() service                         ← 1 hour
5. Build parse_resume_with_deepseek() + prompt tuning   ← 2 hours
6. Build POST /api/resume/upload endpoint               ← 1.5 hours
7. Build resume upload UI (drag-and-drop)               ← 2 hours
8. Build parsed profile review form                     ← 2 hours
9. Wire review form → PUT /api/profile to save          ← 1 hour
10. Handle scanned PDF error + manual fallback          ← 30 minutes
```

---

## Effort Estimate

| Task | Effort |
|---|---|
| Storage setup + DB migration | 1 hour |
| Text extraction service | 1 hour |
| DeepSeek parsing prompt + endpoint | 3.5 hours |
| Upload + review UI | 4 hours |
| Error handling + fallback | 30 minutes |
| **Total** | **~1 day** |

---

## Risks

| Risk | Mitigation |
|---|---|
| DeepSeek parses skills or role incorrectly | Review step before save — user always confirms |
| Scanned PDF returns empty text | Return 422 with clear error, offer manual profile entry |
| DOCX with complex formatting (tables, columns) | `python-docx` reads paragraph text only — may miss table content. Accept as known limitation for MVP. |
| Applicant uploads another person's resume | Files stored under their `user_id` path — RLS prevents reading others' files |
