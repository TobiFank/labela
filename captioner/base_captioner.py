import os
from abc import ABC, abstractmethod

from PIL import Image

class BaseCaptioner(ABC):
    @abstractmethod
    def __init__(self, model_name: str):
        self.model_name = model_name

    @abstractmethod
    def load_model(self):
        pass

    @abstractmethod
    def generate_caption(self, image: Image.Image) -> str:
        pass

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