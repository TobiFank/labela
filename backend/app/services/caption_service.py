# backend/app/services/caption_service.py
import asyncio
import logging
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
    ExamplePair, PromptTemplate, DBPromptTemplate, DBExample
)

logger = logging.getLogger(__name__)


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
        self._examples = []
        self._paused = False
        self._examples_dir = "/data/examples"  # Root data/examples directory
        self._temp_dir = "/app/backend/temp"  # Backend temp directory
        self._current_folder = None

    def initialize(self):
        self._examples = self.load_examples()
        self._templates = self.get_prompt_templates()

    def _get_active_template(self):
        """Gets the current active template or falls back to default"""
        try:
            with SessionLocal() as db:
                # First try to get the default template
                template = db.query(DBPromptTemplate).filter(DBPromptTemplate.is_default == True).first()
                if not template:
                    # If no default template exists, create one
                    template = DBPromptTemplate(
                        id=str(uuid.uuid4()),
                        name="Default Template",
                        content="Generate a detailed caption for this image that describes its key features and content.",
                        is_default=True
                    )
                    db.add(template)
                    db.commit()
                    db.refresh(template)
                return PromptTemplate(
                    id=template.id,
                    name=template.name,
                    content=template.content,
                    isDefault=template.is_default
                )
        except Exception as e:
            logger.error(f"Error getting active template: {str(e)}")
            return None

    async def generate_single_caption(
            self,
            image_file: UploadFile,
            model_config: Optional[ModelConfig] = None
    ) -> str:
        logger = logging.getLogger(__name__)
        logger.info("Starting caption generation process")

        # Create temp directory if it doesn't exist
        try:
            os.makedirs(self._temp_dir, exist_ok=True)
            temp_image_path = os.path.join(self._temp_dir, f"temp_{image_file.filename}")
            logger.info(f"Created temp directory and path: {temp_image_path}")
        except Exception as e:
            logger.error(f"Failed to create temp directory: {str(e)}")
            raise

        try:
            # Save uploaded image temporarily
            logger.info("Attempting to save uploaded file")
            async with aiofiles.open(temp_image_path, 'wb') as out_file:
                content = await image_file.read()
                await out_file.write(content)
            logger.info("Successfully saved uploaded file")

            # Load image using PIL
            logger.info("Attempting to load image with PIL")
            image = Image.open(temp_image_path)
            logger.info("Successfully loaded image with PIL")

            # Get the appropriate provider
            if model_config.provider not in self._providers:
                logger.error(f"Unsupported provider: {model_config.provider}")
                raise ValueError(f"Unsupported provider: {model_config.provider}")

            provider = self._providers[model_config.provider]
            logger.info(f"Got provider for {model_config.provider}")

            provider.configure(model_config)
            logger.info("Configured provider")

            # Load active template and examples
            active_template = self._get_active_template()
            logger.info(f"Got active template: {active_template.name if active_template else 'None'}")

            examples = self.load_examples()
            logger.info(f"Got {len(examples)} examples")

            # Generate caption
            logger.info("Starting caption generation with provider")
            caption = await provider.generate_caption(
                image=image,
                template=active_template.content if active_template else None,
                examples=examples
            )
            logger.info("Successfully generated caption")

            return caption
        except Exception as e:
            logger.error(f"Caption generation failed: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}", exc_info=True)  # This will log the full traceback
            raise RuntimeError(f"Caption generation failed: {str(e)}")
        finally:
            # Cleanup
            try:
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                    logger.info("Cleaned up temporary file")
            except Exception as e:
                logger.error(f"Failed to clean up temporary file: {str(e)}")

    def start_batch_processing(
            self,
            folder_path: str,
            model_config: ModelConfig,
            processing_config: Optional[ProcessingConfig] = None
    ):
        if self._processing:
            raise RuntimeError("Batch processing is already running")

        self._current_folder = folder_path
        self._processing = True
        self._start_time = datetime.now()
        self._current_batch = 0
        self._processed_items = []
        self._total_cost = 0.0

        # Start the processing task
        self._processing_task = asyncio.create_task(
            self._process_batch(folder_path, model_config, processing_config or ProcessingConfig())
        )

    async def get_folder_contents(self, folder_path: str) -> dict:
        """Get contents of a folder with caption status"""
        try:
            # Get all image files
            image_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
            ]

            folder_stats = {
                'total_images': len(image_files),
                'captioned': 0,
                'uncaptioned': 0,
                'files': []
            }

            # Check each file's caption status
            for image_file in image_files:
                image_path = os.path.join(folder_path, image_file)
                caption_path = os.path.splitext(image_path)[0] + '.txt'

                caption_content = None
                if os.path.exists(caption_path):
                    with open(caption_path, 'r') as f:
                        caption_content = f.read().strip()
                    folder_stats['captioned'] += 1
                else:
                    folder_stats['uncaptioned'] += 1

                folder_stats['files'].append({
                    'filename': image_file,
                    'has_caption': caption_content is not None,
                    'caption': caption_content,
                    'last_modified': os.path.getmtime(image_path)
                })

            return folder_stats

        except Exception as e:
            logger.error(f"Error reading folder contents: {str(e)}")
            raise

    async def _process_batch(self, folder_path: str, model_config: ModelConfig, processing_config: ProcessingConfig):
        """Process a batch of images with concurrent processing limits"""
        try:
            provider = self._providers[model_config.provider]
            provider.configure(model_config)

            # Get list of image files that don't have captions yet
            image_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
                   and not os.path.exists(os.path.splitext(os.path.join(folder_path, f))[0] + '.txt')
            ]

            total_images = len(image_files)
            logger.info(f"Found {total_images} images without captions")

            # Process in batches
            for i in range(0, total_images, processing_config.batch_size):
                if not self._processing:
                    break

                while self._paused:
                    await asyncio.sleep(1)
                    if not self._processing:
                        break

                batch = image_files[i:i + processing_config.batch_size]
                self._current_batch += 1

                # Process batch with concurrency control
                running_tasks = set()
                completed_tasks = []

                for filename in batch:
                    filepath = os.path.join(folder_path, filename)

                    # Wait if we've hit the concurrency limit
                    if len(running_tasks) >= processing_config.concurrent_processing:
                        done, running_tasks = await asyncio.wait(
                            running_tasks,
                            return_when=asyncio.FIRST_COMPLETED
                        )
                        completed_tasks.extend(done)

                    # Create and add new task
                    task = asyncio.create_task(self._process_single_image(filepath, provider))
                    running_tasks.add(task)

                # Wait for any remaining tasks in this batch
                if running_tasks:
                    done, _ = await asyncio.wait(running_tasks)
                    completed_tasks.extend(done)

                # Process all completed tasks
                for task in completed_tasks:
                    try:
                        processed_item = await task
                        self._processed_items.append(processed_item)
                    except Exception as e:
                        logger.error(f"Error processing file: {str(e)}")
                        if processing_config.error_handling == "stop":
                            raise

        except Exception as e:
            logger.error(f"Batch processing error: {str(e)}")
            raise  # Re-raise to ensure error is properly handled
        finally:
            self._processing = False
            logger.info("Batch processing completed")

    async def _process_single_image(self, image_path: str, provider) -> ProcessedItem:
        try:
            # Generate caption
            image = Image.open(image_path)
            caption = await provider.generate_caption(image)

            # Save caption to a txt file next to the image
            caption_path = os.path.splitext(image_path)[0] + '.txt'
            async with aiofiles.open(caption_path, 'w') as f:
                await f.write(caption)

            return ProcessedItem(
                id=len(self._processed_items) + 1,
                filename=os.path.basename(image_path),
                image=image_path,
                caption=caption,
                timestamp=datetime.now(),
                status="success"
            )
        except Exception as e:
            logger.error(f"Error processing {image_path}: {str(e)}")
            return ProcessedItem(
                id=len(self._processed_items) + 1,
                filename=os.path.basename(image_path),
                image=image_path,
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

    def pause_processing(self):
        """Pause the current processing"""
        self._paused = True

    def resume_processing(self):
        """Resume paused processing"""
        self._paused = False

    async def save_example(self, image: UploadFile, caption: str) -> ExamplePair:
        try:
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{image.filename}"
            filepath = os.path.join(self._examples_dir, filename)
            caption_path = os.path.splitext(filepath)[0] + '.txt'

            # Save image
            async with aiofiles.open(filepath, 'wb') as out_file:
                content = await image.read()
                await out_file.write(content)

            # Save caption
            async with aiofiles.open(caption_path, 'w') as out_file:
                await out_file.write(caption)

            # Create database entry
            with SessionLocal() as db:
                db_example = DBExample(
                    filename=filename,
                    image_path=filepath,  # Store the full filepath
                    caption=caption
                )
                db.add(db_example)
                db.commit()
                db.refresh(db_example)

                # Return with URL for frontend
                return ExamplePair(
                    id=db_example.id,
                    image=f"/api/examples/{filename}",  # Remove the host part
                    filename=filename,
                    caption=caption
                )

        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            raise RuntimeError(f"Failed to save example: {str(e)}")

    # Add method to load examples on startup
    def load_examples(self) -> List[ExamplePair]:
        with SessionLocal() as db:
            db_examples = db.query(DBExample).all()
            return [
                ExamplePair(
                    id=ex.id,
                    image=f"http://localhost:8000/api/examples/{ex.filename}",
                    filename=ex.filename,
                    caption=ex.caption
                )
                for ex in db_examples
            ]

    async def remove_example(self, example_id: int) -> bool:
        """Removes an example and its associated image file from both DB and filesystem"""
        with SessionLocal() as db:
            try:
                # First get the example to find the image path
                example = db.query(DBExample).filter(DBExample.id == example_id).first()
                if not example:
                    return False

                # Store the image path before deleting from DB
                image_path = example.image_path

                # Delete from database
                db.query(DBExample).filter(DBExample.id == example_id).delete()
                db.commit()

                # Delete the image file if it exists
                if os.path.exists(image_path):
                    os.remove(image_path)

                return True
            except Exception as e:
                db.rollback()
                print(f"Error removing example: {e}")
                raise RuntimeError(f"Failed to remove example: {str(e)}")

    def get_prompt_templates(self) -> List[PromptTemplate]:
        """Gets all prompt templates"""
        with SessionLocal() as db:
            db_templates = db.query(DBPromptTemplate).all()
            return [
                PromptTemplate(
                    id=t.id,
                    name=t.name,
                    content=t.content,
                    isDefault=t.is_default
                ) for t in db_templates
            ]

    def create_prompt_template(self, template: PromptTemplate) -> PromptTemplate:
        """Creates a new prompt template"""
        with SessionLocal() as db:
            try:
                # Always generate a new UUID for new templates
                template_id = str(uuid.uuid4())
                db_template = DBPromptTemplate(
                    id=template_id,
                    name=template.name,
                    content=template.content,
                    is_default=False  # New templates are never default
                )
                db.add(db_template)
                db.commit()
                db.refresh(db_template)

                return PromptTemplate(
                    id=db_template.id,
                    name=db_template.name,
                    content=db_template.content,
                    isDefault=db_template.is_default
                )
            except Exception as e:
                db.rollback()
                raise Exception(f"Database error: {str(e)}")

    def update_prompt_template(self, template_id: str, updated_template: PromptTemplate) -> Optional[PromptTemplate]:
        """Updates an existing prompt template"""
        with SessionLocal() as db:
            try:
                db_template = db.query(DBPromptTemplate).filter(DBPromptTemplate.id == template_id).first()
                if not db_template:
                    return None

                # Update fields
                db_template.name = updated_template.name
                db_template.content = updated_template.content
                db_template.is_default = updated_template.isDefault

                db.commit()
                db.refresh(db_template)

                return PromptTemplate(
                    id=db_template.id,
                    name=db_template.name,
                    content=db_template.content,
                    isDefault=db_template.is_default
                )
            except Exception as e:
                db.rollback()
                print(f"Error updating template: {e}")
                raise

    def delete_prompt_template(self, template_id: str) -> bool:
        """Deletes a prompt template"""
        with SessionLocal() as db:
            result = db.query(DBPromptTemplate).filter(DBPromptTemplate.id == template_id).delete()
            db.commit()
            return result > 0


_caption_service = None


def initialize_service():
    global _caption_service
    _caption_service = CaptionService()
    _caption_service.initialize()


def get_caption_service() -> CaptionService:
    if _caption_service is None:
        raise RuntimeError("CaptionService not initialized")
    return _caption_service
