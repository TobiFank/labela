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
    captioner.caption_images(INPUT_FOLDER, OUTPUT_FOLDER, args.trigger)

if __name__ == "__main__":
    main()