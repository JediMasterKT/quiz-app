#!/bin/bash

# QuizApp Development Stop Script
# This script stops all development services

set -e

echo "🛑 Stopping QuizApp Development Services"
echo "========================================"

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🐳 Stopping Docker services..."
docker-compose down

echo "🧹 Cleaning up..."
docker system prune -f

echo "✅ All services stopped!"
echo ""
echo "💡 To restart services: ./scripts/dev-start.sh"
echo "🔄 To reset everything: ./scripts/dev-reset.sh"