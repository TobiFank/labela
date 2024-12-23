# backend/app/services/caption_service.py
import asyncio
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

import aiofiles
from PIL import Image
from fastapi import UploadFile
from sqlalchemy.orm import Session

from .providers import OpenAIProvider, HuggingFaceProvider
from ..database import SessionLocal
from ..models import (
    ModelConfig,
    ProcessingConfig,
    ProcessedItem,
    ProcessingStatus,
    ExamplePair, PromptTemplate, DBPromptTemplate
)


class CaptionService:
    def __init__(self):
        self._processing = False
        self._processed_items: List[ProcessedItem] = []
        self._current_batch = 0
        self._start_time: Optional[datetime] = None
        self._total_cost = 0.0
        self._providers = {
            "openai": OpenAIProvider(),
            "huggingface": HuggingFaceProvider()
        }
        self._processing_task: Optional[asyncio.Task] = None
        self._templates: List[PromptTemplate] = []
        self._db: Session = SessionLocal()

    async def generate_single_caption(
            self,
            image_file: UploadFile,
            example_files: Optional[List[UploadFile]] = None,
            model_config: Optional[ModelConfig] = None
    ) -> str:
        # Save uploaded image temporarily
        temp_image_path = f"temp_{image_file.filename}"
        try:
            async with aiofiles.open(temp_image_path, 'wb') as out_file:
                content = await image_file.read()
                await out_file.write(content)

            # Load image using PIL
            image = Image.open(temp_image_path)

            # Get the appropriate provider
            provider = self._providers[model_config.provider]
            provider.configure(model_config)

            # Generate caption
            caption = await provider.generate_caption(image)

            return caption
        finally:
            # Cleanup
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

    def start_batch_processing(
            self,
            folder_path: str,
            model_config: ModelConfig,
            processing_config: Optional[ProcessingConfig] = None
    ):
        if self._processing:
            raise RuntimeError("Batch processing is already running")

        self._processing = True
        self._start_time = datetime.now()
        self._current_batch = 0
        self._processed_items = []
        self._total_cost = 0.0

        # Start the processing task
        self._processing_task = asyncio.create_task(
            self._process_batch(folder_path, model_config, processing_config or ProcessingConfig())
        )

    async def _process_batch(
            self,
            folder_path: str,
            model_config: ModelConfig,
            processing_config: ProcessingConfig
    ):
        try:
            provider = self._providers[model_config.provider]
            provider.configure(model_config)

            # Get list of all image files
            image_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
            ]
            total_images = len(image_files)

            # Process in batches
            for i in range(0, total_images, processing_config.batch_size):
                if not self._processing:
                    break

                batch = image_files[i:i + processing_config.batch_size]
                self._current_batch += 1

                # Create tasks for concurrent processing
                tasks = []
                for filename in batch:
                    filepath = os.path.join(folder_path, filename)
                    tasks.append(self._process_single_image(filepath, provider))

                # Process batch with concurrency limit
                for batch_result in asyncio.as_completed(tasks, limit=processing_config.concurrent_processing):
                    try:
                        processed_item = await batch_result
                        self._processed_items.append(processed_item)
                    except Exception as e:
                        if processing_config.error_handling == "stop":
                            raise
                        # Log error and continue

        except Exception as e:
            # Log error
            print(f"Batch processing error: {str(e)}")
        finally:
            self._processing = False

    async def _process_single_image(self, image_path: str, provider) -> ProcessedItem:
        try:
            image = Image.open(image_path)
            caption = await provider.generate_caption(image)

            return ProcessedItem(
                id=len(self._processed_items) + 1,
                filename=os.path.basename(image_path),
                image_path=image_path,
                caption=caption,
                timestamp=datetime.now(),
                status="success"
            )
        except Exception as e:
            return ProcessedItem(
                id=len(self._processed_items) + 1,
                filename=os.path.basename(image_path),
                image_path=image_path,
                caption="",
                timestamp=datetime.now(),
                status="error",
                error_message=str(e)
            )

    def stop_batch_processing(self):
        self._processing = False
        if self._processing_task:
            self._processing_task.cancel()

    def get_processing_status(self) -> ProcessingStatus:
        total_count = len([
            f for f in os.listdir(self._current_folder)
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        ]) if self._processing else 0

        processed_count = len(self._processed_items)

        # Calculate processing speed if applicable
        processing_speed = None
        if self._start_time and processed_count > 0:
            elapsed_time = (datetime.now() - self._start_time).total_seconds() / 60  # minutes
            processing_speed = processed_count / elapsed_time if elapsed_time > 0 else 0

        # Estimate completion time
        estimated_completion = None
        if processing_speed and total_count > processed_count:
            remaining_items = total_count - processed_count
            remaining_minutes = remaining_items / processing_speed
            estimated_completion = datetime.now() + timedelta(minutes=remaining_minutes)

        return ProcessingStatus(
            is_processing=self._processing,
            processed_count=processed_count,
            total_count=total_count,
            current_batch=self._current_batch,
            items=self._processed_items,
            error_count=sum(1 for item in self._processed_items if item.status == "error"),
            start_time=self._start_time,
            estimated_completion=estimated_completion,
            processing_speed=processing_speed,
            total_cost=self._total_cost
        )

    async def save_example(self, image: UploadFile, caption: str) -> ExamplePair:
        # Save example image to examples directory
        example_path = f"examples/{image.filename}"
        async with aiofiles.open(example_path, 'wb') as out_file:
            content = await image.read()
            await out_file.write(content)

        return ExamplePair(
            id=len(self._examples) + 1,
            image_path=example_path,
            filename=image.filename,
            caption=caption,
            created_at=datetime.now()
        )

    def get_prompt_templates(self) -> List[PromptTemplate]:
        try:
            db_templates = self._db.query(DBPromptTemplate).all()
            if not db_templates:
                default_template = DBPromptTemplate(
                    id="default",
                    name="Default Template",
                    content="Generate a caption for the image following these guidelines...",
                    is_default=True,
                    created_at=datetime.now()
                )
                self._db.add(default_template)
                self._db.commit()
                db_templates = [default_template]

            return [PromptTemplate(
                id=t.id,
                name=t.name,
                content=t.content,
                is_default=t.is_default,
                created_at=t.created_at,
                updated_at=t.updated_at
            ) for t in db_templates]
        except Exception as e:
            self._db.rollback()
            raise e

    def create_prompt_template(self, template: PromptTemplate) -> PromptTemplate:
        try:
            db_template = DBPromptTemplate(
                id=str(uuid.uuid4()),
                name=template.name,
                content=template.content,
                is_default=template.is_default,
                created_at=datetime.now()
            )
            self._db.add(db_template)
            self._db.commit()
            self._db.refresh(db_template)
            return template
        except Exception as e:
            self._db.rollback()
            raise e

    def update_prompt_template(self, template_id: str, updated_template: PromptTemplate) -> Optional[PromptTemplate]:
        try:
            db_template = self._db.query(DBPromptTemplate).filter(DBPromptTemplate.id == template_id).first()
            if not db_template:
                return None

            db_template.name = updated_template.name
            db_template.content = updated_template.content
            db_template.updated_at = datetime.now()

            self._db.commit()
            self._db.refresh(db_template)

            return PromptTemplate(
                id=db_template.id,
                name=db_template.name,
                content=db_template.content,
                is_default=db_template.is_default,
                created_at=db_template.created_at,
                updated_at=db_template.updated_at
            )
        except Exception as e:
            self._db.rollback()
            raise e

    def delete_prompt_template(self, template_id: str) -> bool:
        try:
            result = self._db.query(DBPromptTemplate).filter(DBPromptTemplate.id == template_id).delete()
            self._db.commit()
            return result > 0
        except Exception as e:
            self._db.rollback()
            raise e

    def __del__(self):
        if hasattr(self, '_db'):
            self._db.close()


_caption_service = CaptionService()


def get_caption_service() -> CaptionService:
    return _caption_service
