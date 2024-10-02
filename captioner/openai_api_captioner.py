import openai
from PIL import Image
import io
import os
import base64

from openai import OpenAI

from captioner.base_captioner import BaseCaptioner
from config import EXAMPLES_FOLDER


class OpenAIApiCaptioner(BaseCaptioner):
    def __init__(self, api_key: str, examples_folder: str):
        super().__init__("OpenAI")
        self.api_key = api_key
        self.examples_folder = examples_folder
        self.examples = self.load_examples()
        self.client = OpenAI(api_key=self.api_key)

    def load_examples(self):
        examples = []
        for filename in os.listdir(self.examples_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(self.examples_folder, filename)
                txt_path = os.path.splitext(image_path)[0] + '.txt'
                if os.path.exists(txt_path):
                    with open(txt_path, 'r') as f:
                        caption = f.read().strip()
                    examples.append((image_path, caption))
        return examples

    def load_model(self):
        # No model loading necessary for API
        pass

    def create_prompt(self):
        prompt = """I will show you some examples of image captions. Then, I want you to caption a new image in a similar style, focusing ONLY on what you can directly observe in the image. Follow these strict guidelines:

1. Describe the building, its location, and visible surroundings using ONLY factual, objective terms.
2. State the weather conditions visible in the image without interpretation.
3. Describe any visible street-level activity or urban elements factually.
4. If present, describe the geometric facade of the building in detail, focusing on its observable features.
5. DO NOT use subjective or interpretive language like "striking," "beautiful," "serene," or "inviting."
6. DO NOT make assumptions about atmosphere, feelings, or anything not directly visible in the image.
7. DO NOT use flowery or poetic language. Stick to clear, factual descriptions.
8. Focus solely on what is visible - do not invent or imagine elements not shown in the image.

Here are some example captions:

"""
        for _, example_caption in self.examples:
            prompt += f"Example Caption: {example_caption}\n\n"

        prompt += """Now, caption the new image using ONLY objective, factual descriptions of what you can directly observe. Do not use any subjective or interpretive language. Describe the image as if you are a camera, not a poet or storyteller."""

        return prompt

    def generate_caption(self, image: Image.Image or str) -> str:
        few_shot_prompt = self.create_prompt()

        if isinstance(image, str):  # If image is a URL
            image_content = {"type": "image_url", "image_url": {"url": image}}
        else:  # If image is a PIL Image
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            image_content = {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}

        # Use the chat completions API with GPT-4o mini
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",  # Use GPT-4o mini model
            messages=[
                {"role": "system", "content": few_shot_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": "Please caption this image:"},
                    image_content
                ]}
            ],
            max_tokens=2048,
        )

        # Extract the generated caption
        return response.choices[0].message.content

    def caption_images(self, input_folder: str, output_folder: str, trigger_word: str = None):
        self.load_model()
        for filename in os.listdir(input_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_path = os.path.join(input_folder, filename)
                image = Image.open(image_path)
                caption = self.generate_caption(image)
                if trigger_word:
                    caption = f"{trigger_word} {caption}"
                caption_filename = os.path.splitext(filename)[0] + ".txt"
                caption_path = os.path.join(output_folder, caption_filename)
                with open(caption_path, "w") as f:
                    f.write(caption)
                print(f"Caption generated for {filename}")