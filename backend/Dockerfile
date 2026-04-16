FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for cryptography / python-magic / asyncpg / clamav if needed)
# Since we use pyclamd / clamav, the worker container might need clamav. We'll install clamav-daemon.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libmagic1 \
        clamav \
        clamav-daemon \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Pre-download ClamAV signatures (optional: makes startup slower but worker ready)
# RUN freshclam

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Ensure PYTHONPATH includes the current directory
ENV PYTHONPATH="${PYTHONPATH}:/app"

EXPOSE 8000
