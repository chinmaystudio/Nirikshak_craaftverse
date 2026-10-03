# NIRIKSHAK AI Intelligence Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application and trained models
COPY nirikshak_ai/ ./nirikshak_ai/
COPY models/ ./models/
COPY run_api.py .

# Create volume mount point for state
RUN mkdir -p /app/state

ENV PYTHONUNBUFFERED=1
ENV NIRIKSHAK_MODEL_ROOT=/app
ENV AI_STATE_DIR=/app/state

EXPOSE 8000

# Run 1 worker to ensure atomic file/SQLite state consistency
CMD ["uvicorn", "nirikshak_ai.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
