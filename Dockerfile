# Stage 1: backend-base
FROM python:3.11-slim AS backend-base

# Install system dependencies
RUN apt-get update && apt-get install -y gcc postgresql-client curl

# Set the working directory
WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, migrations, and data directories
COPY backend/ ./backend/
COPY migrations/ ./migrations/
COPY data/ ./data/

# Expose port and add health check
EXPOSE 8000
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

# Run the FastAPI application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Stage 2: frontend-deps
FROM node:20-alpine AS frontend-deps

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json from root
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Stage 3: frontend-builder
FROM node:20-alpine AS frontend-builder

# Set the working directory
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=frontend-deps /app/node_modules ./node_modules

# Copy Next.js configuration and frontend files
COPY package.json next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./
COPY app/ ./app/
COPY lib/ ./lib/

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Stage 4: frontend-runner
FROM node:20-alpine AS frontend-runner

# Set the working directory
WORKDIR /app

# Copy built .next, package.json and node_modules from builder
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/node_modules ./node_modules

# Expose port and add health check
EXPOSE 3000
HEALTHCHECK CMD curl --fail http://localhost:3000/health || exit 1

# Run the Next.js application
CMD ["npm", "start"]