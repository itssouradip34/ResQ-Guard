import math
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Engine configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Custom SQLite spatial functions for offline distance / haversine
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        def haversine_distance(lat1, lon1, lat2, lon2):
            if any(v is None for v in [lat1, lon1, lat2, lon2]):
                return 0.0
            r = 6371.0 # Earth radius in km
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (math.sin(dlat / 2) ** 2 +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                 math.sin(dlon / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return r * c

        dbapi_connection.create_function("haversine_distance", 4, haversine_distance)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
