# STAR Interrogator

Sidecar-style monorepo that pairs a FastAPI + LangGraph backend with a Next.js App Router frontend to interrogate resumes and rewrite weak bullets into STAR-format lines.

## Tech Stack
- **Frontend:** Next.js 15 (App Router, Tailwind CSS, TypeScript)
- **Backend:** FastAPI + LangGraph + LangChain Google Gemini bindings
- **Vector DB:** ChromaDB (local persistence)
- **PDF Parsing:** PyMuPDF

```
star-interrogator/
 backend/
    app/
       main.py            # FastAPI entry + endpoints
       graph.py           # LangGraph wiring
       state.py           # Typed graph state + models
       nodes/             # Scanner, interviewer, router, writer, wait nodes
       tools/rag.py       # PyMuPDF ingestion + Chroma helper
    requirements.txt
 frontend/
    package.json
    src/app/
        components/        # PDFUploader + ChatInterface
        api/               # Proxy routes to FastAPI
        page.tsx           # Main experience shell
 .env.example
 .nvmrc / .python-version
 README.md
```

## Prerequisites
- Node.js 20.17 (`.nvmrc`)
- Python 3.11 (`.python-version`)
- `GOOGLE_API_KEY` with Gemini 1.5 Flash + Embeddings access

## Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env  # edit with GOOGLE_API_KEY, paths, etc.
uvicorn app.main:app --reload --port 8000
```
LangGraph checkpoints and Chroma data persist under `storage/` (configurable via `.env`).

## Frontend Setup
```bash
cd frontend
npm install
# configure BACKEND_URL if FastAPI runs somewhere else
echo "BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```
Next.js proxies requests through `/api/upload` and `/api/chat` so the browser never talks to FastAPI directly.

## Workflow Snapshot
```mermaid
flowchart TD
    upload[Upload PDF] --> fastapi[FastAPI /upload]
    fastapi --> chroma[ChromaDB]
    fastapi --> langgraph[LangGraph]
    langgraph --> scanner[Scanner Node]
    scanner --> interviewer[Interviewer Node]
    interviewer --> wait[Wait (interrupt)]
    wait -->|Question| frontend[Next.js Chat]
    frontend -->|Answer| router[Router Node]
    router -->|FOLLOWUP| interviewer
    router -->|DRAFT| writer[Writer Node]
    writer --> frontend
```

## Development Shortcuts
- `npm run lint` / `npm run dev` from `frontend`
- `uvicorn app.main:app --reload --app-dir backend/app` for live backend

## Next Steps
- Extend LangGraph nodes to loop through multiple weak bullets per resume.
- Stream interviewer questions and writer drafts to the UI for better UX.
- Add persistence for finished STAR bullets (SQLite or Notion export).
