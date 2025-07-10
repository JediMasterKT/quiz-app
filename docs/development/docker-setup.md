# Docker Development Setup

This guide covers the Docker-based development environment for the QuizApp project.

## Overview

The project uses Docker Compose to orchestrate the following services:
- **PostgreSQL 14**: Primary database
- **Redis 7**: Caching and session storage
- **Backend API**: Node.js/Express application (optional)

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for containers

## Quick Start

### 1. Start Database Services Only
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check service status
docker-compose ps
```

### 2. Start All Services (Including Backend)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Using Development Scripts
```bash
# Automated setup
./scripts/dev-setup.sh

# Start all services
./scripts/dev-start.sh

# Stop all services
./scripts/dev-stop.sh

# Reset everything
./scripts/dev-reset.sh
```

## Service Configuration

### PostgreSQL
- **Image**: postgres:14
- **Port**: 5432
- **Database**: quiz_app_dev
- **User**: quiz_user
- **Password**: quiz_password
- **Volume**: Persistent data storage

### Redis
- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: Persistent data storage
- **Configuration**: Default Redis configuration

### Backend API (Optional)
- **Build**: Custom Node.js image
- **Port**: 3000
- **Environment**: Development mode with hot reload
- **Dependencies**: Waits for PostgreSQL and Redis health checks

## Docker Compose Commands

### Service Management
```bash
# Start services
docker-compose up -d [service_name]

# Stop services
docker-compose down

# Restart services
docker-compose restart [service_name]

# View service status
docker-compose ps

# View logs
docker-compose logs -f [service_name]
```

### Container Management
```bash
# Execute command in container
docker-compose exec postgres psql -U quiz_user -d quiz_app_dev

# Access container shell
docker-compose exec backend /bin/sh

# View container resource usage
docker-compose exec backend top
```

### Volume Management
```bash
# List volumes
docker volume ls

# Remove volumes (will delete data)
docker-compose down -v

# Backup database
docker-compose exec postgres pg_dump -U quiz_user quiz_app_dev > backup.sql
```

## Development Workflow

### 1. Backend Development
```bash
# Option A: Use Docker for backend too
docker-compose up -d

# Option B: Use Docker for DB only, run backend locally
docker-compose up -d postgres redis
cd backend
npm run dev
```

### 2. Database Management
```bash
# Reset database
docker-compose exec backend npm run db:reset

# Run migrations
docker-compose exec backend npm run migrate

# Seed data
docker-compose exec backend npm run seed

# Access database directly
docker-compose exec postgres psql -U quiz_user -d quiz_app_dev
```

### 3. Testing
```bash
# Run tests in container
docker-compose exec backend npm test

# Run tests with coverage
docker-compose exec backend npm run test:coverage
```

## Environment Variables

### Database Configuration
```env
DB_HOST=postgres
DB_USERNAME=quiz_user
DB_PASSWORD=quiz_password
DB_NAME=quiz_app_dev
```

### Redis Configuration
```env
REDIS_URL=redis://redis:6379
```

### Backend Configuration
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Health Checks

All services include health checks:

### PostgreSQL
- Command: `pg_isready -U quiz_user -d quiz_app_dev`
- Interval: 30s
- Timeout: 10s
- Retries: 5

### Redis
- Command: `redis-cli ping`
- Interval: 30s
- Timeout: 10s
- Retries: 5

### Backend API
- Command: `curl -f http://localhost:3000/health`
- Interval: 30s
- Timeout: 10s
- Retries: 5

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :5432
lsof -i :6379
lsof -i :3000

# Stop conflicting services
brew services stop postgresql
brew services stop redis
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U quiz_user -d quiz_app_dev -c "SELECT 1;"
```

#### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend

# Rebuild backend image
docker-compose build backend
```

### Performance Issues

#### Slow Database Queries
```bash
# Check database performance
docker-compose exec postgres psql -U quiz_user -d quiz_app_dev -c "SELECT * FROM pg_stat_activity;"
```

#### Memory Usage
```bash
# Check container memory usage
docker stats

# Adjust memory limits in docker-compose.yml
```

### Data Persistence

#### Backup Data
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U quiz_user quiz_app_dev > backup.sql

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
```

#### Restore Data
```bash
# Restore PostgreSQL
docker-compose exec -T postgres psql -U quiz_user -d quiz_app_dev < backup.sql

# Restore Redis
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb
```

## Production Considerations

### Security
- Change default passwords
- Use Docker secrets for sensitive data
- Enable SSL/TLS for database connections
- Restrict network access

### Performance
- Use connection pooling
- Configure resource limits
- Monitor container metrics
- Implement log rotation

### Backup Strategy
- Automated database backups
- Volume snapshots
- Disaster recovery procedures

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## Support

For Docker-related issues:
1. Check service logs: `docker-compose logs [service]`
2. Verify service health: `docker-compose ps`
3. Review this documentation
4. Check Docker and Docker Compose versions
5. Create issue with detailed error information