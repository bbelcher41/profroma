# Profroma Financial Statement Consolidator

Single-repo app with Next.js frontend + FastAPI backend for uploading 1..N financial statement PDFs, extracting data (text-first with OCR fallback), mapping to a target COA CSV, viewing/editing consolidated rows, and exporting to Excel.

## Stack
- Frontend: Next.js 14, TypeScript, App Router, Tailwind
- Backend: FastAPI (Python 3.11)
- OCR: Tesseract + Poppler (`pdf2image`) + `pytesseract`
- PDF text-first parsing: `pypdf` + `pdfminer.six`
- LLM extraction/mapping: OpenAI Responses API (`gpt-4.1-mini` default)
- Excel: `openpyxl`
- Deployment: single Docker container with `supervisord`

## Repo Layout
```
/
  frontend/
  backend/
  Dockerfile
  supervisord.conf
  README.md
```

## Environment Variables
- `OPENAI_API_KEY` (required)
- `BACKEND_INTERNAL_URL` (default `http://127.0.0.1:8000`)
- `MAX_PAGES` (default `60`)
- `MAX_FILE_MB` (default `25`)
- `OPENAI_MODEL` (default `gpt-4.1-mini`)

## Local Development
### Backend
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
BACKEND_INTERNAL_URL=http://127.0.0.1:8000 npm run dev
```
Open http://localhost:3000.

## Docker (recommended)
Build and run with one command set:
```bash
docker build -t profroma .
docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY=your_key_here \
  -e BACKEND_INTERNAL_URL=http://127.0.0.1:8000 \
  profroma
```
Open http://localhost:3000.

## API Endpoints
Backend:
- `GET /api/health`
- `POST /api/consolidate` (multipart: `pdfs[]`, `coa_csv`)
- `POST /api/export-xlsx` (JSON payload from consolidate)

Frontend proxy routes (same-origin for browser):
- `POST /api/consolidate` -> backend `/api/consolidate`
- `POST /api/export-xlsx` -> backend `/api/export-xlsx`

## Privacy + Storage
- PDFs processed in-memory and temporary files only for OCR conversion.
- Temporary files are deleted after use.
- No database or object storage.
- Logging excludes raw extracted statement text.

## Render Deploy (Docker)
1. Push this repo to GitHub.
2. Render -> **New +** -> **Web Service** -> connect repo.
3. Environment:
   - Runtime: **Docker**
   - Set `OPENAI_API_KEY`.
   - Optional: `MAX_PAGES`, `MAX_FILE_MB`, `OPENAI_MODEL`.
4. Render detects `Dockerfile` and builds automatically.
5. Start command comes from Docker CMD (supervisord).
6. Visit public URL.

## Railway Deploy (Docker)
1. Push repo to GitHub.
2. Railway -> **New Project** -> **Deploy from GitHub repo**.
3. Railway detects `Dockerfile`.
4. Set environment variable `OPENAI_API_KEY` (required).
5. Deploy; Railway exposes public URL on container port `3000`.

## Notes on Robustness
- Total upload limit enforced via `MAX_FILE_MB` (default 25MB).
- Page cap via `MAX_PAGES` (default 60) for OCR/text extraction.
- OCR fallback used if text extraction is below threshold.
- Warnings surfaced in UI for OCR usage and partial failures.
