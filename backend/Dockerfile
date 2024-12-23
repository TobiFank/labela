# backend/Dockerfile
# Use Python 3.10
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    wget \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Download wait-for-it script
RUN wget -O /wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /wait-for-it.sh

# Install Poetry
RUN pip install poetry

# Copy only requirements to cache them in docker layer
COPY pyproject.toml poetry.lock* ./

# Configure poetry for container environment
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy project files
COPY . .

# Create directories for data persistence
RUN mkdir -p /app/data/examples /app/data/input /app/data/output

# Expose port 8000
EXPOSE 8000

# Start the FastAPI application with database wait
CMD ["/wait-for-it.sh", "postgres:5432", "--", "poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]