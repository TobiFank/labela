import os

import torch
from PIL import Image
from transformers import IdeficsForVisionText2Text, AutoProcessor

from captioner.huggingface_captioner import HuggingFaceCaptioner


class IdeficsCaptioner(HuggingFaceCaptioner):
    def __init__(self, model_name: str, examples_folder: str):
        super().__init__(model_name)
        self.examples_folder = examples_folder
        self.examples = self.load_examples()

    def load_model(self):
        self.model = IdeficsForVisionText2Text.from_pretrained(self.model_name, torch_dtype=torch.bfloat16).to(
            self.device)
        self.processor = AutoProcessor.from_pretrained(self.model_name)

    def load_examples(self):
        examples = []
        for filename in os.listdir(self.examples_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_path = os.path.join(self.examples_folder, filename)
                txt_path = os.path.splitext(image_path)[0] + '.txt'
                if os.path.exists(txt_path):
                    with open(txt_path, 'r') as f:
                        caption = f.read().strip()
                    examples.append((Image.open(image_path), caption))
        return examples

    def generate_caption(self, image: Image.Image) -> str:
        prompts = self.create_prompts(image)
        inputs = self.processor(prompts, add_end_of_utterance_token=False, return_tensors="pt").to(self.device)
        exit_condition = self.processor.tokenizer("<end_of_utterance>", add_special_tokens=False).input_ids
        bad_words_ids = self.processor.tokenizer(["<image>", "<fake_token_around_image>"],
                                                 add_special_tokens=False).input_ids

        # Update the generate parameters
        generated_ids = self.model.generate(
            **inputs,
            eos_token_id=exit_condition,
            bad_words_ids=bad_words_ids,
            max_new_tokens=2048,  # Set max_new_tokens instead of max_length
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )

        caption = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        return caption.split("Assistant:")[-1].strip()

    def create_prompts(self, image: Image.Image):
        prompts = [
            ["User: I will show you some examples of image captions. Then, I want you to caption a new image.",
             "<end_of_utterance>",
             "\nAssistant: Certainly! I'd be happy to help you caption a new image based on the examples you provide. Please show me the examples, and then I'll be ready to caption the new image for you.<end_of_utterance>",
             "\nUser: Here are the examples:"]
        ]

        for ex_image, ex_caption in self.examples:
            prompts[0].extend([
                ex_image,
                f"Caption: {ex_caption}",
                "<end_of_utterance>",
                "\nAssistant: Understood. I've noted this example of an image and its corresponding caption. Please continue with more examples or show me the new image you'd like me to caption.<end_of_utterance>",
                "\nUser:"
            ])

        prompts[0].extend([
            "Now, please caption this new image:",
            image,
            "<end_of_utterance>",
            "\nAssistant:"
        ])

        return prompts