import logging
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

# Default: MSSQL via Windows trusted connection, matching the original setup.
# Override with a DATABASE_URL env var if you want to test quickly against
# SQLite instead, e.g. DATABASE_URL=sqlite:///./employees.db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mssql+pyodbc://@localhost/employeedata"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&trusted_connection=yes"
    "&TrustServerCertificate=yes",
)

# Log which DB backend is in use, without exposing the full connection string
db_backend = DATABASE_URL.split(":")[0]
logger.info(f"Connecting to database backend: {db_backend}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    logger.debug("DB session opened")
    try:
        yield db
    finally:
        db.close()
        logger.debug("DB session closed")