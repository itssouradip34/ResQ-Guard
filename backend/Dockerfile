FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and spatial computing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY sample_data/ ./sample_data/

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["python", "backend/run_backend.py"]
