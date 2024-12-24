# backend/app/main.py
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .models import (
    ProcessingStatus,
    BatchProcessingRequest,
    CaptionResponse,
    ModelConfig, PromptTemplate, SettingsUpdate
)
from .services import caption_service, settings_service

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


# backend/app/main.py
@app.post("/generate-caption", response_model=CaptionResponse)
async def generate_caption(
        image: UploadFile = File(...),
        examples: Optional[List[UploadFile]] = File(None)
):
    try:
        # Get settings from database
        settings = settings_service.get_settings_service().get_settings()
        if not settings:
            raise HTTPException(status_code=400, detail="No settings configured")

        # Create ModelConfig from settings
        model_config = ModelConfig(
            provider=settings['provider'],
            model=settings['model'],
            api_key=settings['api_key'],
            cost_per_token=settings['cost_per_token'],
            max_tokens=settings['max_tokens'],
            temperature=settings['temperature']
        )

        caption = await caption_service.get_caption_service().generate_single_caption(
            image_file=image,
            example_files=examples,
            model_config=model_config
        )
        return CaptionResponse(caption=caption)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process")
async def start_batch_processing(request: BatchProcessingRequest):
    try:
        caption_service.get_caption_service().start_batch_processing(
            folder_path=request.folder_path,
            model_config=request.model_settings,
            processing_config=request.processing_settings
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


@app.put("/processed-items/{item_id}/caption")
async def update_caption(item_id: int, caption: str = Body(...)):
    try:
        updated_item = await caption_service.get_caption_service().update_caption(item_id, caption)
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
                "model": "gpt-4-vision-preview",
                "api_key": "",
                "cost_per_token": 0.01,
                "max_tokens": 1000,
                "temperature": 0.7,
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


caption_service.initialize_service()

app.mount("/examples", StaticFiles(directory="data/examples"), name="examples")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
