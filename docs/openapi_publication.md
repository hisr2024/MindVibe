# OpenAPI Publication Strategy

This guide defines how MindVibe generates, validates, and publishes its OpenAPI schema so integrators always have access to accurate API references.

## Goals
- Produce a versioned OpenAPI document for every deployment.
- Publish the schema in both machine-readable (`openapi.json`) and human-readable (ReDoc) formats.
- Validate the schema during CI to prevent accidental breaking changes.

## Generating the Schema
FastAPI exposes the OpenAPI spec at runtime. Use the following export script to capture a reproducible artifact:

```bash
python - <<'PY'
from fastapi.testclient import TestClient
from backend.main import app

with TestClient(app) as client:
    response = client.get('/openapi.json')
    response.raise_for_status()
    with open('public/api/openapi.json', 'w') as f:
        f.write(response.text)
    print('✅ wrote public/api/openapi.json')
PY
```

Place the exported file in `public/api/openapi.json` so the Next.js frontend and external consumers can fetch it from `/api/openapi.json` when deployed.

## CI/CD Publication
1. **Validation step:** Add a CI job that runs the export script above and then lints the result using [`openapi-spec-validator`](https://github.com/python-openapi/openapi-spec-validator).
2. **Artifact upload:** Store `public/api/openapi.json` as a build artifact for every commit and publish it to `reports/api/openapi.json` for traceability.
3. **Static hosting:** Configure the web deployment (Vercel/Fly) to serve `public/api/openapi.json`. Include a ReDoc viewer route (e.g., `/api/docs`) that reads from this file so the documentation updates automatically after each deploy.

## Versioning and Change Management
- Align the `info.version` in `backend/main.py` with release tags in `CHANGELOG.md` before exporting.
- When endpoints change, update request/response models in `backend/schemas.py` so the generated OpenAPI remains accurate.
- Keep prior schemas under `reports/api/versions/` (one file per release) to audit changes over time.

## Publication Checklist
- [ ] Schema exported to `public/api/openapi.json`.
- [ ] Schema validated in CI.
- [ ] ReDoc/Swagger viewer renders updated schema.
- [ ] Previous version archived in `reports/api/versions/`.
