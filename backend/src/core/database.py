from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/document_repo")

# Create engine with connection pooling and faster timeouts
engine = create_engine(
    DATABASE_URL,
    pool_size=5,                    # Connection pool size
    max_overflow=10,                # Additional connections beyond pool_size
    pool_timeout=5,                 # Timeout when getting connection from pool
    pool_recycle=3600,             # Recycle connections every hour
    pool_pre_ping=True,            # Validate connections before use
    connect_args={
        "connect_timeout": 5,       # Fast connection timeout
        "application_name": "DocRepo"
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
