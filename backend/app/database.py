# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@postgres/captioner"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db(reset: bool = False):
    """Initialize the database, optionally resetting it first"""
    from .models import DBPromptTemplate  # Import here to avoid circular imports

    if reset:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Add default template if it doesn't exist
    with SessionLocal() as db:
        default_template = db.query(DBPromptTemplate).filter_by(is_default=True).first()
        if not default_template:
            default_template = DBPromptTemplate(
                id=str(uuid.uuid4()),
                name="Default Template",
                content="I want you to create captions for the provided images. Focusing ONLY on what you can directly observe in the image. Follow these strict guidelines:\n\n1. Describe the building, its location, and visible surroundings using ONLY factual, objective terms.\n2. State the weather conditions visible in the image without interpretation.\n3. Describe any visible street-level activity or urban elements factually.\n4. If present, describe the geometric facade of the building in detail, focusing on its observable features.\n5. DO NOT use subjective or interpretive language like \"striking,\" \"beautiful,\" \"serene,\" or \"inviting.\"\n6. DO NOT make assumptions about atmosphere, feelings, or anything not directly visible in the image.\n7. DO NOT use flowery or poetic language. Stick to clear, factual descriptions.\n8. Focus solely on what is visible - do not invent or imagine elements not shown in the image. Caption the new image using ONLY objective, factual descriptions of what you can directly observe. Do not use any subjective or interpretive language. Describe the image as if you are a camera, not a poet or storyteller.",
                is_default=True
            )
            db.add(default_template)
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Error creating default template: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()