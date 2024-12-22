# backend/app/services/providers/__init__.py
from .openai_provider import OpenAIProvider
from .huggingface_provider import HuggingFaceProvider

__all__ = ['OpenAIProvider', 'HuggingFaceProvider']