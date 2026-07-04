from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    app_name: str = "CampusPilot Student OS"
    sqlite_url: str = "sqlite:///./campuspilot_os.db"
    
    # JWT Settings
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # In production, keep this in .env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 7 days
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
