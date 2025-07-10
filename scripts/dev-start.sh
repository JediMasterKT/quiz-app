#!/bin/bash

# QuizApp Development Start Script
# This script starts all development services

set -e

echo "🚀 Starting QuizApp Development Services"
echo "========================================"

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "🔍 Checking service health..."
docker-compose ps

echo "✅ All services are starting!"
echo ""
echo "📋 Service Status:"
echo "  - Backend API: http://localhost:3000"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "📊 To view logs: docker-compose logs -f [service_name]"
echo "🛑 To stop services: docker-compose down"
echo ""
echo "🎯 Development workflow:"
echo "1. Backend is running in development mode with hot reload"
echo "2. Database migrations and seeding are automatic"
echo "3. Open ios/QuizApp.xcodeproj in Xcode for iOS development"