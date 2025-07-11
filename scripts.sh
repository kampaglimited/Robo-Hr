#!/bin/bash

# ROBOHR AI Service Complete Setup Script
echo "🤖 Setting up ROBOHR AI Service..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p ai/{commands,models,temp,logs,audio,tests,config}

# Navigate to AI directory
cd ai

# Create requirements.txt if it doesn't exist
if [ ! -f requirements.txt ]; then
    echo "📦 Creating requirements.txt..."
    # Copy the requirements content here
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
# AI Service Configuration
DEBUG=true
LOG_LEVEL=info
PORT=8000

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Google Cloud Configuration (optional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Translation Service
TRANSLATION_PROVIDER=mock
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key

# Speech Services
SPEECH_PROVIDER=mock
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=your-region

# Caching
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
CACHE_TTL=3600

# File Storage
TEMP_DIR=/tmp/robohr_ai
MAX_FILE_SIZE=10485760
AUDIO_FORMAT=wav
MAX_AUDIO_DURATION=300

# Model Configuration
NLP_MODEL=distilbert-base-uncased
CONFIDENCE_THRESHOLD=0.5
MAX_TOKENS=512

# Monitoring
PROMETHEUS_ENABLED=false
HEALTH_CHECK_TIMEOUT=30
EOF
fi

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log

# Temporary files
temp/
audio/
cache/

# Model files
models/
*.pkl
*.joblib
*.h5
*.onnx

# API keys and secrets
.env.local
.env.production
config.json
credentials.json

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/

# OS
.DS_Store
Thumbs.db
EOF

# Create config module
echo "⚙️  Creating configuration module..."
cat > config/__init__.py << 'EOF'
# Config module
EOF

cat > config/settings.py << 'EOF'
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
EOF

# Create __init__.py files
echo "📝 Creating __init__.py files..."
touch commands/__init__.py
touch models/__init__.py
touch config/__init__.py

# Create test files
echo "🧪 Creating test files..."
cat > tests/__init__.py << 'EOF'
# Tests module
EOF

cat > tests/test_nlp.py << 'EOF'
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
EOF

cat > tests/test_translation.py << 'EOF'
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
EOF

# Create pytest configuration
cat > pytest.ini << 'EOF'
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
asyncio_mode = auto
EOF

# Create startup script
echo "🚀 Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "🤖 Starting ROBOHR AI Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Create necessary directories
mkdir -p temp logs audio

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run tests (optional)
if [ "$1" == "--test" ]; then
    echo "🧪 Running tests..."
    python -m pytest tests/ -v
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed"
        exit 1
    fi
fi

# Start the service
echo "🚀 Starting AI service on port ${PORT:-8000}..."
if [ "$DEBUG" == "true" ]; then
    uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload --log-level debug
else
    uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
fi
EOF

chmod +x start.sh

# Create README
echo "📖 Creating README..."
cat > README.md << 'EOF'
# ROBOHR AI Service

AI-powered Natural Language Processing microservice for HRMS.

## Features

- 🗣️  **Speech-to-Text**: Convert voice commands to text
- 🔊 **Text-to-Speech**: Generate voice responses
- 🌍 **Multi-language Support**: 12+ languages supported
- 🧠 **NLP Command Processing**: Understand HR-related commands
- 🔄 **Translation**: Real-time translation between languages
- ⚡ **Fast API**: High-performance async API
- 📊 **Analytics**: Command processing analytics

## Quick Start

### Prerequisites
- Python 3.11+
- pip or conda

### Installation

1. **Clone/Setup:**
```bash
git clone <repository>
cd ai
./start.sh
```

2. **Manual Setup:**
```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn main:app --reload
```

### Usage

The AI service will be available at: `http://localhost:8000`

#### API Endpoints

- **Health Check**: `GET /health`
- **Process Command**: `POST /nlp/command`
- **Speech-to-Text**: `POST /speech-to-text`
- **Text-to-Speech**: `POST /text-to-speech`
- **Translate**: `POST /translate`
- **Capabilities**: `GET /capabilities`

#### Example Requests

```bash
# Process a command
curl -X POST "http://localhost:8000/nlp/command" \
  -H "Content-Type: application/json" \
  -d '{"text": "show my attendance", "lang": "en", "employee_id": 1}'

# Translate text
curl -X POST "http://localhost:8000/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "source_lang": "en", "target_lang": "es"}'
```

### Supported Commands

- **Attendance**: "show my attendance", "view attendance for John"
- **Clock In/Out**: "clock in", "clock out", "start work"
- **Leave Requests**: "request leave for tomorrow", "apply for vacation"
- **Payroll**: "show my payroll", "view salary information"
- **Employee Info**: "find employee John Doe", "show engineering team"
- **Reports**: "generate attendance report", "show analytics"

### Supported Languages

- English (en)
- Spanish (es) 
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Russian (ru)
- Arabic (ar)
- Hindi (hi)

## Configuration

Key environment variables in `.env`:

```bash
# Basic settings
DEBUG=true
PORT=8000

# AI Provider APIs (optional for production)
OPENAI_API_KEY=your-key
GOOGLE_TRANSLATE_API_KEY=your-key
AZURE_SPEECH_KEY=your-key

# Services
TRANSLATION_PROVIDER=mock  # or 'google', 'openai'
SPEECH_PROVIDER=mock       # or 'azure', 'google'
```

## Development

### Testing
```bash
python -m pytest tests/ -v
```

### Code Quality
```bash
black .
flake8 .
mypy .
```

### Docker
```bash
docker build -t robohr-ai .
docker run -p 8000:8000 robohr-ai
```

## Production Deployment

For production, uncomment the actual AI service dependencies in `requirements.txt` and configure proper API keys.

### With Docker Compose
```yaml
ai:
  build: ./ai
  ports:
    - "8000:8000"
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}
```

### Performance Tuning
- Use Redis for caching translations
- Enable Prometheus monitoring
- Use production-grade speech/NLP services
- Configure proper logging levels

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
EOF

echo ""
echo "✅ ROBOHR AI Service setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with API keys (optional for demo)"
echo "2. Run: ./start.sh"
echo "3. Test the service at: http://localhost:8000/docs"
echo ""
echo "🧪 Run tests: ./start.sh --test"
echo "🐳 Docker: docker build -t robohr-ai ."
echo ""
echo "📚 Check README.md for detailed documentation"