FROM python:3.11-slim

# python-magic needs libmagic system library
RUN apt-get update && apt-get install -y \
    libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
ENV PIP_DEFAULT_TIMEOUT=300
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install https://huggingface.co/kormilitzin/en_core_med7_lg/resolve/main/en_core_med7_lg-any-py3-none-any.whl

COPY . .

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
