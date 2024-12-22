# backend/app/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from .services import caption_service
from .models import (
    ProcessingStatus,
    BatchProcessRequest,
    CaptionResponse,
    ModelConfig,
    ProcessingConfig
)

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
        model_config: ModelConfig = None,
):
    try:
        caption = await caption_service.generate_single_caption(
            image_file=image,
            example_files=examples,
            model_config=model_config
        )
        return CaptionResponse(caption=caption)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-process")
async def start_batch_processing(request: BatchProcessRequest):
    try:
        # Start the batch processing in a background task
        caption_service.start_batch_processing(
            folder_path=request.folder_path,
            model_config=request.model_config,
            processing_config=request.processing_config
        )
        return {"message": "Batch processing started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-process/stop")
async def stop_batch_processing():
    try:
        caption_service.stop_batch_processing()
        return {"message": "Batch processing stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/batch-process/status", response_model=ProcessingStatus)
async def get_processing_status():
    try:
        status = caption_service.get_processing_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/examples")
async def upload_example(
        image: UploadFile = File(...),
        caption: str = None
):
    try:
        example = await caption_service.save_example(image, caption)
        return example
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional routes would go here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)