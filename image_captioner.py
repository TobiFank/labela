import datetime
import json
import os

from captioner.captioner_factory import CaptionerFactory
from config import INPUT_FOLDER, OUTPUT_FOLDER, EXAMPLES_FOLDER

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Image Captioning Tool")
    parser.add_argument("technique", choices=["apikey", "huggingface"], help="Captioning technique to use")
    parser.add_argument("--trigger", help="Optional trigger word to prepend to captions")
    parser.add_argument("--model", default="HuggingFaceM4/idefics-9b-instruct", help="Hugging Face model to use")
    parser.add_argument("--api_key", help="API key for API-based captioning")
    parser.add_argument("--quantize", action="store_true", help="Use 4-bit quantization for Hugging Face models")

    args = parser.parse_args()

    captioner = CaptionerFactory.create_captioner(
        args.technique,
        args.model,
        args.api_key,
        args.quantize
    )

    specs = {
        'timestamp': datetime.datetime.now().isoformat(),
        'technique': args.technique,
        'model': args.model,
        'trigger_word': args.trigger,
        'temperature': captioner.settings['temperature'],
        'prompt': captioner.settings['prompt'],
        'quantized': args.quantize
    }

    specs_filename = f"caption_specs_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    specs_path = os.path.join(OUTPUT_FOLDER, specs_filename)
    with open(specs_path, 'w') as f:
        json.dump(specs, f, indent=2)

    print(f"Specs saved to {specs_filename}")

    captioner.caption_images(INPUT_FOLDER, OUTPUT_FOLDER, args.trigger)

if __name__ == "__main__":
    main()