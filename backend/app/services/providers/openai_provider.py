# backend/app/services/providers/openai_provider.py
import base64
from io import BytesIO
from typing import Optional
from PIL import Image
from openai import OpenAI, AsyncOpenAI
from ...models import ModelConfig
from .base_provider import BaseProvider

class OpenAIProvider(BaseProvider):
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.config: Optional[ModelConfig] = None

    def configure(self, config: ModelConfig):
        self.config = config
        self.client = AsyncOpenAI(api_key=config.api_key)

    async def generate_caption(self, image: Image.Image) -> str:
        if not self.client or not self.config:
            raise RuntimeError("Provider not configured")

        # Convert image to base64
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        image_base64 = base64.b64encode(buffered.getvalue()).decode()

        try:
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please provide a detailed caption for this image."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            raise RuntimeError(f"Error generating caption: {str(e)}")