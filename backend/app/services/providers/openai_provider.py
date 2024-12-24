# backend/app/services/providers/openai_provider.py
import base64
import logging
import os
from io import BytesIO
from typing import Optional, List
from PIL import Image
from openai import AsyncOpenAI
from ...models import ModelConfig, ExamplePair
from .base_provider import BaseProvider

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseProvider):
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.config: Optional[ModelConfig] = None

    def configure(self, config: ModelConfig):
        logger.info(f"Configuring OpenAI provider with model: {config.model}")
        self.config = config
        try:
            self.client = AsyncOpenAI(api_key=config.api_key)
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise

    async def generate_caption(self, image: Image.Image, template: Optional[str] = None, examples: Optional[List[ExamplePair]] = None) -> str:
        if not self.client or not self.config:
            logger.error("Provider not configured")
            raise RuntimeError("Provider not configured")

        logger.info("Starting caption generation process")
        try:
            # Initialize messages array with a generic system prompt
            messages = [{
                "role": "system",
                "content": "You are a highly accurate image captioning assistant. Your task is to generate detailed, accurate captions for images based on what you can directly observe. Follow the user's instructions carefully for the desired captioning style and format."
            }]

            # Add examples first if provided
            if examples:
                logger.info(f"Processing {len(examples)} example pairs")
                for i, example in enumerate(examples):
                    try:
                        logger.info(f"Processing example {i+1}: {example.filename}")
                        image_path = example.image.replace('http://localhost:8000/api/examples/', '')
                        image_path = os.path.join('data/examples', image_path)

                        if not os.path.exists(image_path):
                            logger.error(f"Example image not found at path: {image_path}")
                            continue

                        # For first example, include the template/prompt
                        with open(image_path, 'rb') as img_file:
                            example_base64 = base64.b64encode(img_file.read()).decode()

                        if i == 0 and template:
                            messages.append({
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": template},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{example_base64}"
                                        }
                                    }
                                ]
                            })
                        else:
                            # For subsequent examples, just the image
                            messages.append({
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{example_base64}"
                                        }
                                    }
                                ]
                            })

                        # Add assistant's example response
                        messages.append({
                            "role": "assistant",
                            "content": example.caption
                        })

                        logger.info(f"Added example {i+1} with caption: {example.caption[:100]}...")

                    except Exception as e:
                        logger.error(f"Failed to process example {example.filename}: {str(e)}")
                        continue

            # Convert the target image to base64
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            image_base64 = base64.b64encode(buffered.getvalue()).decode()

            # Add the target image message (if no examples/template were provided, include the template here)
            if not examples and template:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": template},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                })
            else:
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                })

            logger.info(f"Final message array has {len(messages)} messages")
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=self.config.temperature
            )

            caption = response.choices[0].message.content.strip()
            logger.info("Caption generated successfully")
            return caption

        except Exception as e:
            logger.error(f"Error generating caption: {str(e)}")
            raise RuntimeError(f"Error generating caption: {str(e)}")