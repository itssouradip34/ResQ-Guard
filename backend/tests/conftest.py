import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.services.seed_service import SeedService

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        SeedService.seed_initial_data(db)
    finally:
        db.close()
    yield
