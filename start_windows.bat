@echo off
setlocal enabledelayedexpansion

:: Change to the directory where the script is located
cd /d "%~dp0"

echo Starting Image Captioner setup...
echo Current directory: %cd%

:: Check if Dockerfile exists
if not exist Dockerfile (
    echo Error: Dockerfile not found in the current directory.
    echo Please ensure you are in the correct directory and that the Dockerfile exists.
    echo Current directory: %cd%
    goto :end
)

:: Check if Docker is installed
echo Checking if Docker is installed...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not found in PATH. Please install Docker Desktop for Windows and run this script again.
    goto :end
)

:: Check if Docker is running
echo Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Attempting to start Docker...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    :docker_wait_loop
    timeout /t 5 >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo Still waiting for Docker to start...
        goto docker_wait_loop
    )
)
echo Docker is running.

:: Create host directories if they don't exist
if not exist .\example_images mkdir .\example_images
if not exist .\images_to_caption mkdir .\images_to_caption
echo Created necessary directories.

:: Always rebuild the Docker image
echo Rebuilding the Docker image...
docker build -t image-captioner .
if %errorlevel% neq 0 (
    echo Failed to build Docker image. Please check the Dockerfile and try again.
    goto :end
)

:: Stop and remove the existing container if it's running
echo Stopping and removing existing container if it exists...
docker stop image-captioner-container >nul 2>&1
docker rm image-captioner-container >nul 2>&1

:: Run the container with volume mounts and added capabilities
echo Starting the Image Captioner container...
docker run -d -p 5000:5000 ^
    -v "%cd%\example_images:/app/example_images" ^
    -v "%cd%\images_to_caption:/app/images_to_caption" ^
    -v "%cd%\prompts.json:/app/prompts.json" ^
    -v "%cd%\settings.json:/app/settings.json" ^
    -v huggingface_cache:/root/.cache/huggingface ^
    --name image-captioner-container ^
    --cap-add=SYS_ADMIN ^
    image-captioner

if %errorlevel% neq 0 (
    echo Failed to start the container. Please check if the port 5000 is already in use.
    goto :end
)

:: Wait for the application to start
echo Waiting for the application to start...
timeout /t 5 >nul

:: Open the browser
echo Opening the browser...
start http://localhost:5000

echo Image Captioner is now running. You can access it at http://localhost:5000
echo The example_images and images_to_caption folders are now accessible in your current directory.

:end
echo.
echo Script execution completed. Press any key to exit...
pause >nul