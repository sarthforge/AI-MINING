from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    supabase_db_url: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    ndvi_drop_threshold: float = 0.3
    # shortcut: local GeoTIFF pair when STAC is unavailable
    ndvi_raster_dir: str = ""
    max_cloud_pct: float = 20.0
    stac_url: str = "https://earth-search.aws.element84.com/v1"
    storage_bucket: str = "imagery"
    cors_origins: str = "http://localhost:5173"


settings = Settings()
