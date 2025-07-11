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
