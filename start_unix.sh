#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker on various systems
install_docker() {
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y docker.io
    elif command_exists yum; then
        sudo yum install -y docker
    elif command_exists brew; then
        brew install --cask docker
    else
        echo "Unable to install Docker automatically. Please install Docker manually and run this script again."
        exit 1
    fi
}

# Check if Docker is installed, install if not
if ! command_exists docker; then
    echo "Docker is not installed. Attempting to install Docker..."
    install_docker
fi

# Start Docker service if it's not running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Attempting to start Docker..."
    if command_exists systemctl; then
        sudo systemctl start docker
    elif command_exists service; then
        sudo service docker start
    else
        echo "Unable to start Docker automatically. Please start Docker manually and run this script again."
        exit 1
    fi
fi

# Create host directories if they don't exist
mkdir -p ./example_images ./images_to_caption

# Check if the image exists and rebuild if necessary
if docker image inspect image-captioner >/dev/null 2>&1; then
    echo "Docker image exists. Checking for updates..."
    # Get the last modification time of the Dockerfile
    DOCKERFILE_MTIME=$(stat -c %Y Dockerfile)
    # Get the creation time of the Docker image
    IMAGE_CTIME=$(docker inspect -f '{{.Created}}' image-captioner | xargs date +%s -d)

    if [ $DOCKERFILE_MTIME -gt $IMAGE_CTIME ]; then
        echo "Dockerfile has been modified. Rebuilding the image..."
        if ! docker build -t image-captioner .; then
            echo "Failed to build Docker image. Please check the Dockerfile and try again."
            exit 1
        fi
    else
        echo "Docker image is up-to-date."
    fi
else
    echo "Docker image doesn't exist. Building the image..."
    if ! docker build -t image-captioner .; then
        echo "Failed to build Docker image. Please check the Dockerfile and try again."
        exit 1
    fi
fi

# Stop and remove the existing container if it's running
docker stop image-captioner-container >/dev/null 2>&1
docker rm image-captioner-container >/dev/null 2>&1

# Run the container with volume mounts and added capabilities
if ! docker run -d -p 5000:5000 \
    -v $(pwd)/example_images:/app/example_images \
    -v $(pwd)/images_to_caption:/app/images_to_caption \
    -v huggingface_cache:/root/.cache/huggingface \
    --name image-captioner-container \
    --cap-add=SYS_ADMIN \
    image-captioner; then
    echo "Failed to start the container. Please check if the port 5000 is already in use."
    exit 1
fi

# Wait for the application to start
echo "Waiting for the application to start..."
sleep 5

# Open the browser
if command_exists xdg-open; then
    xdg-open http://localhost:5000
elif command_exists open; then
    open http://localhost:5000
else
    echo "Please open your web browser and navigate to http://localhost:5000"
fi

echo "Image Captioner is now running. You can access it at http://localhost:5000"
echo "The example_images and images_to_caption folders are now accessible in your current directory."