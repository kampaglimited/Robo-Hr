import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    debug: bool = False
    log_level: str = "info"
    port: int = 8000
    
    # API Keys
    openai_api_key: str = ""
    google_translate_api_key: str = ""
    azure_speech_key: str = ""
    azure_speech_region: str = ""
    
    # Service providers
    translation_provider: str = "mock"
    speech_provider: str = "mock"
    
    # Caching
    redis_url: str = "redis://localhost:6379"
    cache_enabled: bool = True
    cache_ttl: int = 3600
    
    # File handling
    temp_dir: str = "/tmp/robohr_ai"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    audio_format: str = "wav"
    max_audio_duration: int = 300  # 5 minutes
    
    # Model configuration
    nlp_model: str = "distilbert-base-uncased"
    confidence_threshold: float = 0.5
    max_tokens: int = 512
    
    # Supported languages
    supported_languages: List[str] = [
        "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "ru", "ar", "hi"
    ]
    
    # Monitoring
    prometheus_enabled: bool = False
    health_check_timeout: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
