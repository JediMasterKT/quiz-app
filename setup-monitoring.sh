#!/bin/bash

set -e

echo "🚀 Setting up Performance Monitoring Stack for Quiz App"
echo "======================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create network if it doesn't exist
if ! docker network ls | grep -q "quiz-app-network"; then
    echo "📦 Creating Docker network..."
    docker network create quiz-app-network
fi

# Check if main services are running
if ! docker-compose ps | grep -q "backend"; then
    echo "⚠️  Main application services are not running."
    echo "Please run 'docker-compose up -d' first to start the main services."
    exit 1
fi

# Start monitoring stack
echo "🔧 Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Checking service status..."
echo "----------------------------"

# Function to check if service is accessible
check_service() {
    local service=$1
    local port=$2
    local url=$3
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$url" | grep -q "200\|302"; then
        echo "✅ $service is running at http://localhost:$port"
    else
        echo "❌ $service is not accessible at http://localhost:$port"
    fi
}

check_service "Prometheus" 9090 "/-/healthy"
check_service "Grafana" 3001 "/api/health"
check_service "AlertManager" 9093 "/#/alerts"

echo ""
echo "📈 Performance Monitoring Setup Complete!"
echo "========================================"
echo ""
echo "🔗 Access Points:"
echo "  - Grafana Dashboard: http://localhost:3001"
echo "    Username: admin"
echo "    Password: admin"
echo "  - Prometheus: http://localhost:9090"
echo "  - AlertManager: http://localhost:9093"
echo ""
echo "📊 Available Dashboards:"
echo "  - Quiz App Performance Dashboard"
echo ""
echo "⚡ Metrics are being collected for:"
echo "  - API response times and throughput"
echo "  - Database performance"
echo "  - Redis cache hit rates"
echo "  - System resources (CPU, Memory)"
echo "  - Container metrics"
echo ""
echo "🔔 Alerts configured for:"
echo "  - High response times (>500ms)"
echo "  - High error rates (>5%)"
echo "  - Service downtime"
echo "  - Resource exhaustion"
echo ""
echo "To stop monitoring: docker-compose -f docker-compose.monitoring.yml down"
echo "To view logs: docker-compose -f docker-compose.monitoring.yml logs -f [service-name]"