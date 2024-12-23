# backend/app/services/settings_service.py
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import DBSettings, SettingsUpdate

class SettingsService:
    def __init__(self):
        self._db: Session = SessionLocal()

    def get_settings(self, user_id: str = "default") -> Optional[dict]:
        """Get settings for a user"""
        settings = self._db.query(DBSettings).filter_by(user_id=user_id).first()
        if settings:
            return settings.to_dict()
        return None

    def update_settings(self, settings_update: SettingsUpdate, user_id: str = "default") -> dict:
        """Update settings for a user"""
        settings = self._db.query(DBSettings).filter_by(user_id=user_id).first()

        if not settings:
            # Create new settings if they don't exist
            settings = DBSettings(
                id=str(uuid.uuid4()),
                user_id=user_id,
                provider=settings_update.provider or "openai",
                model=settings_update.model or "gpt-4-vision-preview",
                api_key=settings_update.api_key,
                cost_per_token=settings_update.cost_per_token or 0.01,
                max_tokens=settings_update.max_tokens or 1000,
                temperature=settings_update.temperature or 0.5,
                batch_size=settings_update.batch_size or 50,
                error_handling=settings_update.error_handling or "continue",
                concurrent_processing=settings_update.concurrent_processing or 2
            )
            self._db.add(settings)
        else:
            # Update existing settings
            update_data = settings_update.dict(exclude_unset=True)
            for key, value in update_data.items():
                if value is not None:
                    setattr(settings, key, value)
            settings.updated_at = datetime.utcnow()

        try:
            self._db.commit()
            self._db.refresh(settings)
            return settings.to_dict()
        except Exception as e:
            self._db.rollback()
            raise Exception(f"Failed to update settings: {str(e)}")

_settings_service = None

def get_settings_service() -> SettingsService:
    global _settings_service
    if _settings_service is None:
        _settings_service = SettingsService()
    return _settings_service