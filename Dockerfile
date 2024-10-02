# Use Python 3.10 instead of 3.8
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies, including X11 libraries for tkinter
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-tk \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy only the pyproject.toml and poetry.lock (if it exists) to leverage Docker cache
COPY pyproject.toml poetry.lock* /app/

# Install project dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy the current directory contents into the container at /app
COPY . /app

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Create volumes for persistent storage
VOLUME /app/example_images
VOLUME /app/images_to_caption
VOLUME /root/.cache/huggingface

# Run app.py when the container launches
CMD ["python", "app.py"]