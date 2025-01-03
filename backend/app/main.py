# backend/app/main.py
import logging
import os
from typing import List

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .models import (
    ProcessingStatus,
    BatchProcessingRequest,
    CaptionResponse,
    ModelConfig, PromptTemplate, SettingsUpdate, ProcessedItem, CaptionUpdate
)
from .services import caption_service, settings_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Set third-party loggers to WARNING or higher
logging.getLogger('httpcore').setLevel(logging.WARNING)
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('python_multipart').setLevel(logging.WARNING)
logging.getLogger('openai').setLevel(logging.WARNING)
logging.getLogger('PIL').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


def setup_data_directories():
    """Ensure data directories exist with proper permissions"""
    # Create root data directories
    root_data_dirs = [
        "/data",           # Root data dir
        "/data/examples",   # Examples dir
        "/app/backend/temp"  # Temp dir
    ]

    for directory in root_data_dirs:
        try:
            os.makedirs(directory, mode=0o777, exist_ok=True)  # World-writable for user access
            os.chmod(directory, 0o777)  # Ensure permissions are set
            logger.info(f"Ensured {directory} exists with proper permissions")
        except Exception as e:
            logger.error(f"Failed to setup {directory}: {str(e)}")


setup_data_directories()

init_db()
app = FastAPI(title="Image Caption Generator API",
              root_path="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate-caption", response_model=CaptionResponse)
async def generate_caption(
        image: UploadFile = File(...)
):
    logger = logging.getLogger(__name__)
    logger.info("=== Starting Caption Generation Request ===")

    # Log image details
    logger.info(f"Received image: {image.filename} ({image.content_type})")

    try:
        # Get settings and log them
        settings = settings_service.get_settings_service().get_settings()

        logger.info("Using settings:")
        logger.info(f"  Provider: {settings['provider']}")
        logger.info(f"  Model: {settings['model']}")
        logger.info(f"  Temperature: {settings['temperature']}")

        # Create ModelConfig from settings
        model_config = ModelConfig(
            provider=settings['provider'],
            model=settings['model'],
            api_key=settings['api_key'],
            cost_per_token=settings['cost_per_token'],
            temperature=settings['temperature']
        )

        caption = await caption_service.get_caption_service().generate_single_caption(
            image_file=image,
            model_config=model_config
        )

        logger.info(f"Generated caption: {caption}")
        logger.info("=== Caption Generation Complete ===")
        return CaptionResponse(caption=caption)

    except Exception as e:
        logger.error(f"Error in generate_caption endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process")
async def start_batch_processing(request: BatchProcessingRequest):
    try:
        await caption_service.get_caption_service().start_batch_processing(
            folder_path=request.folder_path,
            model_config=request.model_settings,
            processing_config=request.processing_settings,
            reprocess=request.reprocess
        )
        return {"message": "Batch processing started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process/stop")
async def stop_batch_processing():
    try:
        caption_service.get_caption_service().stop_batch_processing()
        return {"message": "Batch processing stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/batch-process/status", response_model=ProcessingStatus)
async def get_processing_status():
    try:
        status = caption_service.get_caption_service().get_processing_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/examples")
async def upload_example(
        image: UploadFile = File(...),
        caption: str = Form(...)
):
    try:
        example = await caption_service.get_caption_service().save_example(image, caption)
        return example
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/examples")
async def list_examples():
    return caption_service.get_caption_service().load_examples()


@app.put("/captions/{item_id}")
async def update_caption(item_id: int, caption: str = Body(...)):
    return caption_service.get_caption_service().update_caption(item_id, caption)


@app.delete("/examples/{example_id}")
async def remove_example(example_id: int):
    success = await caption_service.get_caption_service().remove_example(example_id)
    if not success:
        raise HTTPException(status_code=404, detail="Example not found")
    return {"message": "Example removed successfully"}


@app.put("/processed-items/{item_id}/caption", response_model=ProcessedItem)
async def update_caption(item_id: int, update: CaptionUpdate):
    try:
        updated_item = caption_service.get_caption_service().update_caption(item_id, update.caption)
        return updated_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/prompt-templates", response_model=List[PromptTemplate])
async def get_prompt_templates():
    try:
        templates = caption_service.get_caption_service().get_prompt_templates()
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/prompt-templates", response_model=PromptTemplate)
async def create_prompt_template(template: PromptTemplate):
    try:
        # Log the incoming template for debugging
        print(f"Received template: {template}")
        result = caption_service.get_caption_service().create_prompt_template(template)
        return result
    except Exception as e:
        # Log the full error
        print(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/prompt-templates/{template_id}", response_model=PromptTemplate)
async def update_prompt_template(template_id: str, template: PromptTemplate):
    try:
        result = caption_service.get_caption_service().update_prompt_template(template_id, template)
        if not result:
            raise HTTPException(status_code=404, detail="Template not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/prompt-templates/{template_id}")
async def delete_prompt_template(template_id: str):
    try:
        if not caption_service.get_caption_service().delete_prompt_template(template_id):
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings")
async def get_settings():
    """Get user settings"""
    try:
        settings = settings_service.get_settings_service().get_settings()
        if not settings:
            return {
                "provider": "openai",
                "model": "gpt-4o",
                "api_key": "",
                "cost_per_token": 0.01,
                "temperature": 0.5,
                "batch_size": 50,
                "error_handling": "continue",
                "concurrent_processing": 2
            }
        return settings
    except Exception as e:
        print(f"Error getting settings: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update user settings"""
    try:
        updated = settings_service.get_settings_service().update_settings(settings)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test-image")
async def save_test_image(image: UploadFile = File(...)):
    return await caption_service.get_caption_service().save_test_image(image)


@app.get("/test-image")
async def get_test_image():
    return caption_service.get_caption_service().get_test_image()


@app.post("/batch-process/pause")
async def pause_batch_processing():
    try:
        caption_service.get_caption_service().pause_processing()
        return {"message": "Batch processing paused"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process/resume")
async def resume_batch_processing():
    try:
        caption_service.get_caption_service().resume_processing()
        return {"message": "Batch processing resumed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/folder-contents")
async def get_folder_contents(folder_path: str):
    """Get contents of a folder including caption status of images"""
    try:
        contents = await caption_service.get_caption_service().get_folder_contents(folder_path)
        return contents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/folders")
async def list_folders():
    """List all available folders in the data directory"""
    base_dir = "/data"  # This is the mounted root data folder
    folders = []

    for item in os.listdir(base_dir):
        if item in ["temp", "examples"]:  # Skip system folders
            continue

        full_path = os.path.join(base_dir, item)
        if os.path.isdir(full_path):
            image_count = len([
                f for f in os.listdir(full_path)
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
            ])

            folders.append({
                'name': item,
                'path': full_path,
                'image_count': image_count
            })

    return folders


caption_service.initialize_service()

app.mount("/examples", StaticFiles(directory="/data/examples"), name="examples")
app.mount("/data", StaticFiles(directory="/data"), name="data")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
