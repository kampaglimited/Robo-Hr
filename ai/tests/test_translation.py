import pytest
from commands.translation import TranslationService

@pytest.mark.asyncio
async def test_translation_service_initialization():
    service = TranslationService()
    await service.initialize()
    assert service.initialized == True
    await service.cleanup()

@pytest.mark.asyncio
async def test_language_detection():
    service = TranslationService()
    await service.initialize()
    
    # Test English
    lang = await service.detect_language("show me my attendance")
    assert lang == "en"
    
    # Test Spanish
    lang = await service.detect_language("muéstrame mi asistencia")
    assert lang == "es"
    
    await service.cleanup()

@pytest.mark.asyncio
async def test_translation():
    service = TranslationService()
    await service.initialize()
    
    result = await service.translate("show me my attendance", "en", "es")
    assert "asistencia" in result.lower()
    
    await service.cleanup()
