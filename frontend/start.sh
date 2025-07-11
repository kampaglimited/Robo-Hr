#!/bin/bash

echo "⚛️  Starting ROBOHR Frontend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install additional Tailwind plugins if needed
if ! npm list @tailwindcss/forms > /dev/null 2>&1; then
    echo "🎨 Installing Tailwind CSS plugins..."
    npm install -D @tailwindcss/forms @tailwindcss/typography
fi

# Start the development server
echo "🚀 Starting development server..."
npm start
