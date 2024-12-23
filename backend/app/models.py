# backend/app/models.py
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, String, Boolean, DateTime

from .database import Base


# Base configuration for all models
class BaseModelWithConfig(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

# Update all your models to inherit from BaseModelWithConfig instead of BaseModel
class ModelConfig(BaseModelWithConfig):
    provider: Literal["openai", "huggingface"]
    model: str
    api_key: str
    cost_per_token: float
    max_tokens: int
    temperature: float

class ProcessingConfig(BaseModelWithConfig):
    batch_size: int = 50
    error_handling: Literal["continue", "stop"] = "continue"
    concurrent_processing: int = 2

class ProcessedItem(BaseModelWithConfig):
    id: int
    filename: str
    image_path: str
    caption: str
    timestamp: datetime
    status: Literal["success", "error", "pending"]
    error_message: Optional[str] = None

class ProcessingStatus(BaseModelWithConfig):
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

class BatchProcessingRequest(BaseModelWithConfig):
    folder_path: str
    model_settings: ModelConfig
    processing_settings: Optional[ProcessingConfig] = None

class CaptionResponse(BaseModelWithConfig):
    caption: str

class ExamplePair(BaseModelWithConfig):
    id: int
    image_path: str
    filename: str
    caption: str

class PromptTemplate(BaseModel):
    id: str
    name: str
    content: str
    isDefault: bool = False

class DBPromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)