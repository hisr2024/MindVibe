# Backend-only Docker configuration for AI Mental-Wellness Coach services
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