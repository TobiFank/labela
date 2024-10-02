import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM, BitsAndBytesConfig

from captioner.base_captioner import BaseCaptioner

class HuggingFaceCaptioner(BaseCaptioner):
    def __init__(self, model_name: str, use_quantization: bool = False):
        super().__init__(model_name)
        self.device = "cpu" #"cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.processor = None
        self.use_quantization = use_quantization

    def load_model(self):
        if self.use_quantization:
            # Configure 4-bit quantization
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16
            )
            # Load the model with quantization
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                quantization_config=quantization_config,
                device_map="auto"
            )
        else:
            # Load the model in full precision
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name).to(self.device)

        self.processor = AutoProcessor.from_pretrained(self.model_name)

    def generate_caption(self, image: Image.Image) -> str:
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        output = self.model.generate(**inputs, max_new_tokens=50)
        return self.processor.decode(output[0], skip_special_tokens=True)