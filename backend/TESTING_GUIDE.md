# Quiz App Backend Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Quiz App backend API, including automated tests and manual testing scenarios.

## Prerequisites

1. **Database Setup**
   ```bash
   npm run docker:dev  # Start PostgreSQL and Redis
   npm run migrate     # Run database migrations
   npm run seed        # Seed with sample data
   ```

2. **Environment**
   ```bash
   cp .env.example .env  # Configure environment variables
   npm install           # Install dependencies
   ```

## Running Automated Tests

### Full Test Suite
```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Run in watch mode
```

### Individual Test Files
```bash
npm test -- auth.test.js                    # Authentication tests
npm test -- cacheService.test.js           # Cache service tests
npm test -- syncService.basic.test.js      # Sync service tests
npm test -- storageService.test.js         # Storage service tests
npm test -- api.integration.test.js        # API integration tests
```

## Manual Testing Procedures

### 1. Server Health Check

**Endpoint:** `GET /health`
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Quiz App API is running",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

### 2. Authentication Flow

#### Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Save the token from response for subsequent requests**

#### Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Categories API

#### Get All Categories
```bash
curl -X GET http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Questions API

#### Get Questions
```bash
# All questions
curl -X GET http://localhost:3000/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by category
curl -X GET "http://localhost:3000/api/questions?categoryId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by difficulty  
curl -X GET "http://localhost:3000/api/questions?difficultyLevel=3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Limit results
curl -X GET "http://localhost:3000/api/questions?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Randomize
curl -X GET "http://localhost:3000/api/questions?randomize=true&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Game Sessions API

#### Create Game Session
```bash
curl -X POST http://localhost:3000/api/games/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "solo",
    "categoryId": 1,
    "difficultyLevel": 3,
    "totalQuestions": 10
  }'
```

#### Get User Sessions
```bash
curl -X GET http://localhost:3000/api/games/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Admin API Testing

**Note:** Requires admin user token

#### Cache Management
```bash
# Get cache statistics
curl -X GET http://localhost:3000/api/admin/cache/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Clear cache
curl -X DELETE http://localhost:3000/api/admin/cache/clear \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Force cache warming
curl -X POST http://localhost:3000/api/admin/cache/warm \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Warm specific category
curl -X POST http://localhost:3000/api/admin/cache/warm \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId": 1}'
```

#### Sync Management
```bash
# Get sync status
curl -X GET http://localhost:3000/api/admin/sync/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Force sync
curl -X POST http://localhost:3000/api/admin/sync/force \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update sync interval
curl -X PUT http://localhost:3000/api/admin/sync/interval \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 300000}'

# Clear conflict history
curl -X DELETE http://localhost:3000/api/admin/sync/conflicts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Storage Management
```bash
# Get storage status
curl -X GET http://localhost:3000/api/admin/storage/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update storage limit
curl -X PUT http://localhost:3000/api/admin/storage/limit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limitMB": 100}'

# Generate storage report
curl -X GET http://localhost:3000/api/admin/storage/report \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Find duplicate questions
curl -X GET http://localhost:3000/api/admin/storage/duplicates \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Perform storage cleanup
curl -X POST http://localhost:3000/api/admin/storage/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Optimize storage
curl -X POST http://localhost:3000/api/admin/storage/optimize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Performance Testing

### Cache Performance
1. **Cold Cache Test**: Clear cache and measure question retrieval times
2. **Warm Cache Test**: Repeat same requests and measure improvement
3. **Cache Hit Rate**: Monitor cache statistics during normal usage

### Load Testing
```bash
# Using Apache Bench (install: brew install httpd)
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:3000/api/questions?limit=10
```

### Memory Usage
```bash
# Monitor server memory
ps aux | grep node

# Check cache size
curl -X GET http://localhost:3000/api/admin/cache/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Error Scenarios Testing

### Authentication Errors
```bash
# No token
curl -X GET http://localhost:3000/api/questions

# Invalid token
curl -X GET http://localhost:3000/api/questions \
  -H "Authorization: Bearer invalid-token"

# Expired token (manually test with old token)
```

### Authorization Errors
```bash
# Regular user accessing admin endpoint
curl -X GET http://localhost:3000/api/admin/cache/stats \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Validation Errors
```bash
# Invalid registration data
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "invalid-email",
    "password": "123"
  }'
```

### Rate Limiting (if implemented)
```bash
# Rapid requests to same endpoint
for i in {1..100}; do
  curl -X GET http://localhost:3000/api/questions \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

## Database Testing

### Data Integrity
1. Create questions with various difficulty levels
2. Verify fair randomization algorithm
3. Test question usage tracking
4. Validate game session state management

### Migration Testing
```bash
# Reset database
npm run db:reset

# Test individual migrations
npm run migrate
npm run migrate:undo
```

## Cache System Testing

### Redis Connection
1. **With Redis**: Start Redis and test full caching
2. **Without Redis**: Stop Redis and test memory fallback
3. **Redis Failure**: Simulate Redis failure during operation

### Cache Strategies
1. **24-hour refresh**: Test cache expiration and refresh
2. **Background warming**: Verify cache warming on startup
3. **Invalidation**: Test cache invalidation on data updates

## Sync System Testing

### Background Sync
1. Start application and monitor sync logs
2. Create data conflicts and verify resolution
3. Test sync interval adjustments
4. Verify stuck session cleanup

## Storage Management Testing

### Storage Limits
1. **Current Usage**: Verify storage calculation accuracy
2. **Threshold Alerts**: Test warning and cleanup thresholds  
3. **Cleanup Process**: Verify old data removal
4. **Growth Projection**: Test projection calculations

## Common Issues and Solutions

### API Timeouts
- Check database connection
- Verify Redis connectivity
- Monitor server logs for errors

### Authentication Failures  
- Verify JWT secret configuration
- Check token expiration settings
- Validate user account status

### Cache Issues
- Clear cache and test fresh data
- Check Redis memory usage
- Verify cache key generation

### Performance Issues
- Monitor database query performance
- Check cache hit rates
- Review sync interval settings

## Expected Performance Metrics

- **Question API**: < 200ms response time (cached)
- **Authentication**: < 500ms response time
- **Cache Hit Rate**: > 80% after warm-up
- **Storage Usage**: < 50MB total
- **Sync Interval**: 5 minutes default

## Monitoring and Logging

### Log Files
- Application logs: `backend/server.log`
- Error logs: Console output
- Database logs: PostgreSQL logs

### Key Metrics
- API response times
- Cache hit/miss ratios
- Storage usage trends
- Sync success rates
- Active user sessions

## Troubleshooting Checklist

1. ✅ Server starts without errors
2. ✅ Database connection established  
3. ✅ Redis connection (or fallback to memory)
4. ✅ Authentication flow works
5. ✅ Questions API returns data
6. ✅ Cache system functioning
7. ✅ Admin endpoints accessible
8. ✅ Background services running
9. ✅ Storage monitoring active
10. ✅ Performance within targets