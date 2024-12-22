# backend/app/models.py
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

class ModelConfig(BaseModel):
    provider: Literal["openai", "huggingface"]
    model: str
    api_key: str
    cost_per_token: float
    max_tokens: int

class ProcessingConfig(BaseModel):
    batch_size: int = 50
    error_handling: Literal["continue", "stop"] = "continue"
    concurrent_processing: int = 2

class ProcessedItem(BaseModel):
    id: int
    filename: str
    image_path: str
    caption: str
    timestamp: datetime
    status: Literal["success", "error", "pending"]
    error_message: Optional[str] = None

class ProcessingStatus(BaseModel):
    is_processing: bool
    processed_count: int
    total_count: int
    current_batch: int
    items: List[ProcessedItem]
    error_count: int
    start_time: Optional[datetime]
    estimated_completion: Optional[datetime]
    processing_speed: Optional[float]  # items per minute
    total_cost: float

class BatchProcessRequest(BaseModel):
    folder_path: str
    model_config: ModelConfig
    processing_config: Optional[ProcessingConfig] = None

class CaptionResponse(BaseModel):
    caption: str

class ExamplePair(BaseModel):
    id: int
    image_path: str
    filename: str
    caption: str
    created_at: datetime

class PromptTemplate(BaseModel):
    id: str
    name: str
    content: str
    is_default: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

# Additional model classes would go here