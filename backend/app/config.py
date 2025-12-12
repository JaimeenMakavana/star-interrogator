from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    google_api_key: str | None = None
    fastapi_port: int = 8000
    frontend_origin: str = "http://localhost:3000"
    chroma_persist_dir: str = "./storage/chroma"
    langgraph_db_path: str = "./storage/langgraph.sqlite3"
    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def ensure_storage_dirs(self) -> None:
        Path(self.chroma_persist_dir).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
        Path(self.langgraph_db_path).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_storage_dirs()
    return settings
