# backend/app/services/providers/base_provider.py
from abc import ABC, abstractmethod
from PIL import Image
from ...models import ModelConfig

class BaseProvider(ABC):
    @abstractmethod
    def configure(self, config: ModelConfig):
        """Configure the provider with the given settings."""
        pass

    @abstractmethod
    async def generate_caption(self, image: Image.Image) -> str:
        """Generate a caption for the given image."""
        pass