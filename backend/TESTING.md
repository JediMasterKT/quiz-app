# 🧪 Quiz App Testing Guide

## Overview
We follow Test-Driven Development (TDD) principles. Write tests first, then code to make them pass.

## Test Suites

### 1. TDD Core Tests (`npm run test:tdd`)
**File**: `test-tdd.js`  
**Coverage**: Authentication, Progression, Categories, Game Start  
**Tests**: 15 tests covering core functionality

#### What it tests:
- ✅ User registration with validation
- ✅ Login with username OR email
- ✅ JWT token authentication
- ✅ User profile retrieval
- ✅ Initial progression state
- ✅ XP calculation
- ✅ Level progression
- ✅ Categories listing
- ✅ Game session creation

### 2. Progression System Tests (`npm run test:progression`)
**File**: `test-progression-suite.js`  
**Coverage**: Complete progression system validation  
**Tests**: 9 comprehensive tests

#### What it tests:
- ✅ Initial state (Level 1, 0 XP)
- ✅ XP calculation for different difficulties
- ✅ Level progression boundaries
- ✅ Multiple level ups in single action
- ✅ XP persistence across requests
- ✅ Statistics updates
- ✅ Invalid XP rejection
- ✅ Concurrent XP updates (transaction safety)
- ✅ Max level boundary handling

### 3. Integration Tests (`npm run test:integration`)
**File**: `test-integration.js`  
**Coverage**: End-to-end feature testing  
**Tests**: 10 integration scenarios

### 4. Demo Verification (`npm run verify`)
**File**: `verify-demo.js`  
**Purpose**: Quick health check of all features

## Running Tests

### Quick Commands
```bash
# Run all tests
npm run test:all

# Run specific test suite
npm run test:tdd          # Core TDD tests
npm run test:progression  # Progression tests
npm run test:integration  # Integration tests

# Verify demo is working
npm run verify

# Run with watch mode (Jest tests)
npm run test:watch
```

### Before Committing
Always run:
```bash
npm run test:all
```

## Test Database Setup

### Local Development
1. Ensure PostgreSQL is running
2. Create test database:
```sql
CREATE DATABASE quiz_test;
```

3. Run migrations:
```bash
npm run migrate
```

### CI/CD
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Integration branches

## Writing New Tests

### TDD Workflow
1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

### Test Structure
```javascript
runner.test('should do something specific', async () => {
  // Arrange
  const input = { /* test data */ };
  
  // Act
  const { response, data } = await request('/endpoint', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  
  // Assert
  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
});
```

## Performance Targets

### Backend APIs
- Authentication: < 200ms
- Progression calculations: < 100ms
- Database queries: < 50ms
- WebSocket updates: < 500ms

### Test Execution
- TDD suite: < 10 seconds
- Progression suite: < 15 seconds
- Full test run: < 30 seconds

## Troubleshooting

### Common Issues

1. **Tests fail with "Server not running"**
   - Start server: `npm start`
   - Check port 3000 is free

2. **Database connection errors**
   - Check PostgreSQL is running
   - Verify `.env` configuration
   - Run migrations: `npm run migrate`

3. **Redis connection errors**
   - Start Redis: `redis-server`
   - Check port 6379 is free

4. **Concurrent test failures**
   - Tests use transactions for isolation
   - Each test creates unique user
   - Check for port conflicts

## Coverage Goals

- **Minimum**: 80% code coverage
- **Target**: 95% for critical paths
- **Required**: 100% for authentication & payments

## Test Data Management

### Isolation
- Each test creates its own user
- Usernames include timestamps
- No shared state between tests

### Cleanup
- Transactions auto-rollback on failure
- Test users persist (useful for debugging)
- Run `npm run db:reset` to clean database

## Continuous Integration

### GitHub Actions
- Runs on every push/PR
- PostgreSQL & Redis services included
- Parallel test execution
- Results in PR comments

### Local Pre-commit
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
npm run test:all || exit 1
```

## Best Practices

1. **Test user-facing behavior**, not implementation
2. **Use descriptive test names** that explain the requirement
3. **Keep tests fast** - mock external services
4. **Test edge cases** - negative numbers, empty strings, nulls
5. **Test concurrency** - multiple simultaneous requests
6. **Document WHY** when skipping tests

## Questions?

- Check test files for examples
- Run tests with verbose output
- Review CI logs for failures
- Ask team for clarification

---

*Remember: If it's not tested, it's broken!* 🚀