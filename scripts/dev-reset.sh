#!/bin/bash

# QuizApp Development Reset Script
# This script resets the entire development environment

set -e

echo "🔄 Resetting QuizApp Development Environment"
echo "==========================================="

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🛑 Stopping all services..."
docker-compose down -v

echo "🧹 Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

echo "📦 Reinstalling backend dependencies..."
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..

echo "🐳 Starting fresh services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "🗄️ Resetting database..."
cd backend
npm run migrate:undo:all || true
npm run migrate
npm run seed
cd ..

echo "✅ Development environment reset complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. Open ios/QuizApp.xcodeproj in Xcode"
echo "3. Build and run the iOS app"