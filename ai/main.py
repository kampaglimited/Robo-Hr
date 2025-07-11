from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime
import logging

# Import our modules
from commands.nlp import CommandProcessor
from commands.speech import SpeechProcessor
from commands.translation import TranslationService
from models.schemas import (
    CommandRequest, CommandResponse, 
    SpeechToTextRequest, SpeechToTextResponse,
    TextToSpeechRequest, TextToSpeechResponse,
    HealthResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ROBOHR AI Service",
    description="AI-powered Natural Language Processing for HRMS",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
command_processor = CommandProcessor()
speech_processor = SpeechProcessor()
translation_service = TranslationService()

@app.on_startup
async def startup_event():
    """Initialize services on startup"""
    logger.info("🤖 Starting ROBOHR AI Service...")
    await command_processor.initialize()
    await speech_processor.initialize()
    await translation_service.initialize()
    logger.info("✅ AI Service initialized successfully")

@app.on_shutdown
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🔄 Shutting down AI Service...")
    await command_processor.cleanup()
    await speech_processor.cleanup()
    await translation_service.cleanup()
    logger.info("✅ AI Service shutdown complete")

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with service information"""
    return {
        "service": "ROBOHR AI Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/health",
            "nlp_command": "/nlp/command",
            "speech_to_text": "/speech-to-text",
            "text_to_speech": "/text-to-speech",
            "translate": "/translate"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check if all services are healthy
        nlp_status = await command_processor.health_check()
        speech_status = await speech_processor.health_check()
        translation_status = await translation_service.health_check()
        
        all_healthy = all([nlp_status, speech_status, translation_status])
        
        return HealthResponse(
            status="healthy" if all_healthy else "degraded",
            timestamp=datetime.now().isoformat(),
            services={
                "nlp": "healthy" if nlp_status else "unhealthy",
                "speech": "healthy" if speech_status else "unhealthy",
                "translation": "healthy" if translation_status else "unhealthy"
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/nlp/command", response_model=CommandResponse)
async def process_command(request: CommandRequest):
    """Process natural language commands"""
    try:
        logger.info(f"Processing command: {request.text[:50]}...")
        
        # Translate to English if needed
        processed_text = request.text
        if request.lang != 'en':
            processed_text = await translation_service.translate_to_english(
                request.text, request.lang
            )
        
        # Process the command
        result = await command_processor.process_command(
            processed_text, 
            request.lang, 
            request.employee_id
        )
        
        # Translate response back if needed
        if request.lang != 'en' and result.get('message'):
            result['message'] = await translation_service.translate_from_english(
                result['message'], request.lang
            )
        
        return CommandResponse(
            success=True,
            action=result.get('action', 'unknown'),
            parameters=result.get('parameters', {}),
            message=result.get('message', ''),
            confidence=result.get('confidence', 0.5),
            original_text=request.text,
            processed_text=processed_text,
            language=request.lang
        )
        
    except Exception as e:
        logger.error(f"Command processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(
    audio_file: UploadFile = File(...),
    language: str = "en"
):
    """Convert speech to text"""
    try:
        logger.info(f"Processing speech-to-text for language: {language}")
        
        # Read audio file
        audio_data = await audio_file.read()
        
        # Process speech
        transcript = await speech_processor.speech_to_text(audio_data, language)
        
        return SpeechToTextResponse(
            success=True,
            transcript=transcript,
            language=language,
            confidence=0.9  # This would come from the actual speech recognition
        )
        
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/text-to-speech", response_model=TextToSpeechResponse)
async def text_to_speech(request: TextToSpeechRequest):
    """Convert text to speech"""
    try:
        logger.info(f"Processing text-to-speech: {request.text[:50]}...")
        
        # Generate speech
        audio_url = await speech_processor.text_to_speech(request.text, request.lang)
        
        return TextToSpeechResponse(
            success=True,
            audio_url=audio_url,
            text=request.text,
            language=request.lang
        )
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate_text(request: dict):
    """Translate text between languages"""
    try:
        text = request.get('text')
        source_lang = request.get('source_lang', 'auto')
        target_lang = request.get('target_lang', 'en')
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        translated_text = await translation_service.translate(
            text, source_lang, target_lang
        )
        
        return {
            "success": True,
            "original_text": text,
            "translated_text": translated_text,
            "source_language": source_lang,
            "target_language": target_lang
        }
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/capabilities")
async def get_capabilities():
    """Get AI service capabilities"""
    return {
        "supported_languages": ["en", "es", "fr", "de", "it", "pt", "zh", "ja"],
        "commands": [
            "view_attendance", "clock_in", "clock_out", "request_leave",
            "view_payroll", "view_employees", "get_employee_info",
            "create_employee", "update_employee", "generate_report"
        ],
        "speech_formats": ["wav", "mp3", "ogg"],
        "features": [
            "natural_language_processing",
            "speech_recognition",
            "text_to_speech",
            "multilingual_support",
            "command_execution",
            "intent_recognition"
        ]
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else "Something went wrong"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info"
    )