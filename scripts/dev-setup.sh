#!/bin/bash

# QuizApp Development Setup Script
# This script sets up the development environment for the QuizApp project

set -e

echo "🚀 Setting up QuizApp Development Environment"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Setting up database..."
cd backend
cp .env.example .env
echo "Running database migrations..."
npm run migrate
echo "Seeding database with initial data..."
npm run seed
cd ..

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. Open ios/QuizApp.xcodeproj in Xcode"
echo "3. Build and run the iOS app"
echo ""
echo "📚 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Reset database: npm run migrate:undo && npm run migrate && npm run seed"
echo ""
echo "🌐 Backend will be available at: http://localhost:3000"
echo "🗄️ Database: localhost:5432"
echo "🔑 Redis: localhost:6379"