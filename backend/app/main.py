# backend/app/main.py
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    ProcessingStatus,
    BatchProcessingRequest,
    CaptionResponse,
    ModelConfig, PromptTemplate
)
from .services import caption_service

app = FastAPI(title="Image Caption Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate-caption", response_model=CaptionResponse)
async def generate_caption(
        image: UploadFile = File(...),
        examples: Optional[List[UploadFile]] = File(None),
        model_settings: Optional[ModelConfig] = Body(None)
):
    try:
        caption = await caption_service.get_caption_service().generate_single_caption(
            image_file=image,
            example_files=examples,
            model_config=model_settings
        )
        return CaptionResponse(caption=caption)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/batch-process")
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


@app.post("/api/batch-process/stop")
async def stop_batch_processing():
    try:
        caption_service.get_caption_service().stop_batch_processing()
        return {"message": "Batch processing stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/batch-process/status", response_model=ProcessingStatus)
async def get_processing_status():
    try:
        status = caption_service.get_caption_service().get_processing_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/examples")
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


@app.get("/api/examples")
async def list_examples():
    return caption_service.get_caption_service().get_examples()


@app.delete("/api/examples/{example_id}")
async def delete_example(example_id: int):
    return caption_service.get_caption_service().delete_example(example_id)


@app.put("/api/captions/{item_id}")
async def update_caption(item_id: int, caption: str = Body(...)):
    return caption_service.get_caption_service().update_caption(item_id, caption)


@app.post("/api/prompt-templates")
async def save_prompt_template(template: PromptTemplate):
    return caption_service.get_caption_service().save_prompt_template(template)


@app.delete("/api/examples/{example_id}")
async def remove_example(example_id: int):
    try:
        await caption_service.get_caption_service().remove_example(example_id)
        return {"message": "Example removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/processed-items/{item_id}/caption")
async def update_caption(item_id: int, caption: str = Body(...)):
    try:
        updated_item = await caption_service.get_caption_service().update_caption(item_id, caption)
        return updated_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/prompt-templates", response_model=List[PromptTemplate])
async def get_prompt_templates():
    return caption_service.get_caption_service().get_prompt_templates()

@app.post("/api/prompt-templates", response_model=PromptTemplate)
async def create_prompt_template(template: PromptTemplate):
    return caption_service.get_caption_service().create_prompt_template(template)

@app.put("/api/prompt-templates/{template_id}", response_model=PromptTemplate)
async def update_prompt_template(template_id: str, template: PromptTemplate):
    result = caption_service.get_caption_service().update_prompt_template(template_id, template)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result

@app.delete("/api/prompt-templates/{template_id}")
async def delete_prompt_template(template_id: str):
    if not caption_service.get_caption_service().delete_prompt_template(template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
