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
                content="Generate a caption for the image following these guidelines...",
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