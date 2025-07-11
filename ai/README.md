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
