# backend/app/services/settings_service.py
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import DBSettings, SettingsUpdate


class SettingsService:
    def __init__(self):
        self._db: Session = SessionLocal()

    # backend/app/services/settings_service.py

    def get_settings(self, user_id: str = "default") -> Optional[dict]:
        """Get settings for a user"""
        try:
            settings = self._db.query(DBSettings).filter_by(user_id=user_id).first()
            if settings:
                return settings.to_dict()

            # If no settings exist, return None
            return None
        except Exception as e:
            print(f"Database error in get_settings: {str(e)}")  # Add logging
            raise

    def update_settings(self, settings_update: SettingsUpdate, user_id: str = "default") -> dict:
        """Update settings for a user"""
        settings = self._db.query(DBSettings).filter_by(user_id=user_id).first()

        if not settings:
            # Create new settings with ALL fields
            settings = DBSettings(
                id=str(uuid.uuid4()),
                user_id=user_id,
                provider=settings_update.provider or "openai",
                model=settings_update.model or "gpt-4-vision-preview",
                api_key=settings_update.api_key or "",
                cost_per_token=settings_update.cost_per_token or 0.01,
                max_tokens=settings_update.max_tokens or 1000,
                temperature=settings_update.temperature or 0.5,
                batch_size=settings_update.batch_size or 50,
                error_handling=settings_update.error_handling or "continue",
                concurrent_processing=settings_update.concurrent_processing or 2
            )
            self._db.add(settings)
            self._db.commit()
            self._db.refresh(settings)
        else:
            # Update existing settings, being explicit about updates
            settings.provider = settings_update.provider or settings.provider
            settings.model = settings_update.model or settings.model
            settings.api_key = settings_update.api_key if settings_update.api_key is not None else settings.api_key
            settings.cost_per_token = settings_update.cost_per_token if settings_update.cost_per_token is not None else settings.cost_per_token
            settings.max_tokens = settings_update.max_tokens if settings_update.max_tokens is not None else settings.max_tokens
            settings.temperature = settings_update.temperature if settings_update.temperature is not None else settings.temperature
            settings.batch_size = settings_update.batch_size if settings_update.batch_size is not None else settings.batch_size
            settings.error_handling = settings_update.error_handling if settings_update.error_handling is not None else settings.error_handling
            settings.concurrent_processing = settings_update.concurrent_processing if settings_update.concurrent_processing is not None else settings.concurrent_processing
            self._db.commit()
            self._db.refresh(settings)

        return settings.to_dict()


_settings_service = None


def get_settings_service() -> SettingsService:
    global _settings_service
    if _settings_service is None:
        _settings_service = SettingsService()
    return _settings_service
