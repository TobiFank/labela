# backend/app/services/providers/huggingface_provider.py
from typing import Optional
from PIL import Image
import torch
from transformers import pipeline
from ...models import ModelConfig
from .base_provider import BaseProvider

class HuggingFaceProvider(BaseProvider):
    def __init__(self):
        self.pipeline = None
        self.config: Optional[ModelConfig] = None

    def configure(self, config: ModelConfig):
        self.config = config
        # Initialize the pipeline with the specified model
        self.pipeline = pipeline(
            "image-to-text",
            model=config.model,
            device=0 if torch.cuda.is_available() else -1
        )

    async def generate_caption(self, image: Image.Image) -> str:
        if not self.pipeline or not self.config:
            raise RuntimeError("Provider not configured")

        try:
            # Generate caption using the pipeline
            result = self.pipeline(image)

            # Most HuggingFace image-to-text models return a list of predictions
            # We'll take the first one as it usually has the highest confidence
            if isinstance(result, list):
                caption = result[0]["generated_text"]
            else:
                caption = result["generated_text"]

            return caption.strip()

        except Exception as e:
            raise RuntimeError(f"Error generating caption: {str(e)}")

    def __del__(self):
        # Clean up GPU memory if needed
        if self.pipeline and hasattr(self.pipeline, "model"):
            if hasattr(self.pipeline.model, "to"):
                try:
                    self.pipeline.model.to("cpu")
                except:
                    pass
            del self.pipeline
        torch.cuda.empty_cache()