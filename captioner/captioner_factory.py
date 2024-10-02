from captioner.huggingface_captioner import HuggingFaceCaptioner
from captioner.idefics_captioner import IdeficsCaptioner
from captioner.openai_api_captioner import OpenAIApiCaptioner
from config import EXAMPLES_FOLDER

class CaptionerFactory:
    @staticmethod
    def create_captioner(technique: str, model_name: str = None, api_key: str = None, use_quantization: bool = False):
        if technique == "huggingface":
            if model_name == "HuggingFaceM4/idefics-9b-instruct":
                return IdeficsCaptioner(model_name, EXAMPLES_FOLDER)
            else:
                return HuggingFaceCaptioner(model_name, use_quantization)
        elif technique == "apikey":
            return OpenAIApiCaptioner(api_key, EXAMPLES_FOLDER)
        else:
            raise ValueError("Invalid technique. Choose 'huggingface' or 'apikey'")