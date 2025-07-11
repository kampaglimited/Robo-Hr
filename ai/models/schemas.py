from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class CommandRequest(BaseModel):
    """Request model for NLP command processing"""
    text: str = Field(..., description="The command text to process")
    lang: str = Field(default="en", description="Language code (en, es, fr, etc.)")
    employee_id: Optional[int] = Field(None, description="Employee ID for context")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Additional context")

class CommandResponse(BaseModel):
    """Response model for processed commands"""
    success: bool = Field(..., description="Whether the command was processed successfully")
    action: str = Field(..., description="The identified action/intent")
    parameters: Dict[str, Any] = Field(default={}, description="Extracted parameters")
    message: str = Field(default="", description="Human-readable response message")
    confidence: float = Field(default=0.0, description="Confidence score (0-1)")
    original_text: str = Field(..., description="Original input text")
    processed_text: str = Field(..., description="Processed/translated text")
    language: str = Field(..., description="Language of the input")
    suggestions: Optional[List[str]] = Field(default=[], description="Alternative suggestions")

class SpeechToTextRequest(BaseModel):
    """Request model for speech-to-text conversion"""
    language: str = Field(default="en", description="Language code for recognition")
    format: str = Field(default="wav", description="Audio format")
    sample_rate: Optional[int] = Field(default=16000, description="Audio sample rate")

class SpeechToTextResponse(BaseModel):
    """Response model for speech-to-text conversion"""
    success: bool = Field(..., description="Whether conversion was successful")
    transcript: str = Field(..., description="Transcribed text")
    language: str = Field(..., description="Detected/specified language")
    confidence: float = Field(default=0.0, description="Recognition confidence")
    duration: Optional[float] = Field(None, description="Audio duration in seconds")
    alternatives: Optional[List[str]] = Field(default=[], description="Alternative transcriptions")

class TextToSpeechRequest(BaseModel):
    """Request model for text-to-speech conversion"""
    text: str = Field(..., description="Text to convert to speech")
    lang: str = Field(default="en", description="Language code")
    voice: Optional[str] = Field(None, description="Voice preference")
    speed: float = Field(default=1.0, description="Speech speed multiplier")
    pitch: float = Field(default=1.0, description="Voice pitch multiplier")

class TextToSpeechResponse(BaseModel):
    """Response model for text-to-speech conversion"""
    success: bool = Field(..., description="Whether conversion was successful")
    audio_url: str = Field(..., description="URL to generated audio file")
    text: str = Field(..., description="Original text")
    language: str = Field(..., description="Language used")
    duration: Optional[float] = Field(None, description="Audio duration in seconds")
    format: str = Field(default="mp3", description="Audio format")

class TranslationRequest(BaseModel):
    """Request model for text translation"""
    text: str = Field(..., description="Text to translate")
    source_lang: str = Field(default="auto", description="Source language (auto-detect)")
    target_lang: str = Field(..., description="Target language")

class TranslationResponse(BaseModel):
    """Response model for text translation"""
    success: bool = Field(..., description="Whether translation was successful")
    original_text: str = Field(..., description="Original text")
    translated_text: str = Field(..., description="Translated text")
    source_language: str = Field(..., description="Detected source language")
    target_language: str = Field(..., description="Target language")
    confidence: float = Field(default=0.0, description="Translation confidence")

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Overall service status")
    timestamp: str = Field(..., description="Timestamp of health check")
    services: Dict[str, str] = Field(..., description="Status of individual services")
    version: str = Field(default="1.0.0", description="Service version")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")

class IntentClassification(BaseModel):
    """Model for intent classification results"""
    intent: str = Field(..., description="Classified intent")
    confidence: float = Field(..., description="Classification confidence")
    entities: Dict[str, Any] = Field(default={}, description="Extracted entities")
    context: Dict[str, Any] = Field(default={}, description="Context information")

class EntityExtraction(BaseModel):
    """Model for entity extraction results"""
    entity_type: str = Field(..., description="Type of entity")
    entity_value: str = Field(..., description="Extracted value")
    start_pos: int = Field(..., description="Start position in text")
    end_pos: int = Field(..., description="End position in text")
    confidence: float = Field(..., description="Extraction confidence")

class LanguageDetection(BaseModel):
    """Model for language detection results"""
    language: str = Field(..., description="Detected language code")
    confidence: float = Field(..., description="Detection confidence")
    alternatives: List[Dict[str, float]] = Field(default=[], description="Alternative languages")

class CommandHistory(BaseModel):
    """Model for command execution history"""
    id: str = Field(..., description="Unique command ID")
    timestamp: datetime = Field(..., description="Execution timestamp")
    employee_id: Optional[int] = Field(None, description="Employee ID")
    command_text: str = Field(..., description="Original command")
    action: str = Field(..., description="Executed action")
    success: bool = Field(..., description="Execution success")
    response_time: float = Field(..., description="Response time in seconds")
    language: str = Field(..., description="Command language")

class AICapabilities(BaseModel):
    """Model for AI service capabilities"""
    supported_languages: List[str] = Field(..., description="Supported language codes")
    available_commands: List[str] = Field(..., description="Available command types")
    speech_formats: List[str] = Field(..., description="Supported audio formats")
    features: List[str] = Field(..., description="Available features")
    models: Dict[str, str] = Field(..., description="AI models in use")
    version: str = Field(..., description="Service version")

class ErrorResponse(BaseModel):
    """Model for error responses"""
    success: bool = Field(default=False, description="Always false for errors")
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    request_id: Optional[str] = Field(None, description="Request ID for tracking")

# Configuration models
class NLPConfig(BaseModel):
    """Configuration for NLP processing"""
    model_name: str = Field(default="distilbert-base-uncased", description="NLP model name")
    confidence_threshold: float = Field(default=0.5, description="Minimum confidence threshold")
    max_tokens: int = Field(default=512, description="Maximum token length")
    cache_enabled: bool = Field(default=True, description="Enable response caching")

class SpeechConfig(BaseModel):
    """Configuration for speech processing"""
    sample_rate: int = Field(default=16000, description="Audio sample rate")
    chunk_size: int = Field(default=1024, description="Audio chunk size")
    max_duration: int = Field(default=30, description="Maximum audio duration in seconds")
    formats: List[str] = Field(default=["wav", "mp3"], description="Supported formats")

class TranslationConfig(BaseModel):
    """Configuration for translation service"""
    provider: str = Field(default="google", description="Translation provider")
    cache_enabled: bool = Field(default=True, description="Enable translation caching")
    max_length: int = Field(default=5000, description="Maximum text length")
    supported_languages: List[str] = Field(
        default=["en", "es", "fr", "de", "it", "pt", "zh", "ja"],
        description="Supported language codes"
    )