# Stage 1: backend-base
FROM python:3.11.9-slim AS backend-base

# Install system dependencies and clean up APT cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc postgresql-client curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, migrations, data directories, and scripts
COPY backend/ ./backend/
COPY migrations/ ./migrations/
COPY data/ ./data/
COPY scripts/ ./scripts/

# Build the Relationship Compass index
RUN python scripts/build-relationship-compass-index-local.py

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Stage 2: frontend-deps
FROM node:20-slim AS frontend-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

# Stage 3: frontend-builder
FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY --from=frontend-deps /app/node_modules ./node_modules

COPY package.json next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./
COPY middleware.ts ./
COPY vendor/ ./vendor/
COPY app/ ./app/
COPY lib/ ./lib/
COPY components/ ./components/
COPY hooks/ ./hooks/
COPY utils/ ./utils/
COPY services/ ./services/
COPY contexts/ ./contexts/
COPY types/ ./types/
COPY data/ ./data/
COPY config/ ./config/
COPY brand/ ./brand/
COPY public/ ./public/
COPY styles/ ./styles/

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 4: frontend-runner
FROM node:20-slim AS frontend-runner

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
