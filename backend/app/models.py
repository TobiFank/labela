# backend/app/models.py
from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float

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
    temperature: float


class ProcessingConfig(BaseModelWithConfig):
    batch_size: int = 50
    error_handling: Literal["continue", "stop"] = "continue"
    concurrent_processing: int = 2


class ProcessedItem(BaseModelWithConfig):
    id: int
    filename: str
    image: str
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
    image: str
    filename: str
    caption: str


class PromptTemplate(BaseModel):
    id: str
    name: str
    content: str
    isDefault: bool = False


class SettingsUpdate(BaseModelWithConfig):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    cost_per_token: Optional[float] = None
    temperature: Optional[float] = None
    batch_size: Optional[int] = None
    error_handling: Optional[Literal["continue", "stop"]] = None
    concurrent_processing: Optional[int] = None


class DBPromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)


class DBExample(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    caption = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DBSettings(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, default="default")  # For future multi-user support
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    api_key = Column(String, nullable=True)
    cost_per_token = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    batch_size = Column(Integer, nullable=False, default=50)
    error_handling = Column(String, nullable=False, default="continue")
    concurrent_processing = Column(Integer, nullable=False, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "provider": self.provider,
            "model": self.model,
            "api_key": self.api_key,
            "cost_per_token": self.cost_per_token,
            "temperature": self.temperature,
            "batch_size": self.batch_size,
            "error_handling": self.error_handling,
            "concurrent_processing": self.concurrent_processing
        }

