# Aadi – Gen‑Z Wellness (Prototype)
Values‑based guidance without direct scripture references. 
Web: Next.js + Tailwind (SOS, Mood, Encrypted Journal). API: FastAPI + Postgres. 
Includes Docker, CI for Vercel (web) & Fly.io (api).

## Local
cd infra && docker compose up -d
cd ../apps/api && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
python seed_content.py
cd ../web && cp .env.example .env && npm i && npm run dev
# open http://localhost:3000


## Requirements
- Node 20+, Python 3.11+, Docker (optional for local infra)

## Local Dev (step-by-step)
```bash
# 1) Start Postgres
cd infra && docker compose up -d

# 2) API
cd ../apps/api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3) Seed content
python seed_content.py

# 4) Web
cd ../web
cp .env.example .env
npm i
npm run dev
# Open http://localhost:3000
```

## Deploy (GitHub Actions included)
- Web → Vercel: set secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, plus `NEXT_PUBLIC_*` envs.
- API → Fly.io: set secret `FLY_API_TOKEN` and app secret `DATABASE_URL`.

## Notes
- Journal uses client-side AES‑GCM. Passphrase is **never** sent to the server.
- Guidance is values-based; **no direct scripture references**.
