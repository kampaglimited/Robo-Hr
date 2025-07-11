import pytest
from commands.nlp import CommandProcessor

@pytest.mark.asyncio
async def test_command_processor_initialization():
    processor = CommandProcessor()
    await processor.initialize()
    assert processor.initialized == True
    await processor.cleanup()

@pytest.mark.asyncio
async def test_process_simple_command():
    processor = CommandProcessor()
    await processor.initialize()
    
    result = await processor.process_command("show my attendance", "en", 1)
    
    assert result["action"] == "view_attendance"
    assert result["parameters"]["employee_id"] == 1
    
    await processor.cleanup()

@pytest.mark.asyncio
async def test_clock_in_command():
    processor = CommandProcessor()
    await processor.initialize()
    
    result = await processor.process_command("clock in", "en", 1)
    
    assert result["action"] == "clock_in"
    assert result["parameters"]["employee_id"] == 1
    
    await processor.cleanup()
