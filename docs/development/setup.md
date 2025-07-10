# Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Redis**: 7.0 or higher
- **Docker**: 20.10 or higher (optional, for containerized development)
- **Xcode**: 14.0 or higher (for iOS development)
- **iOS**: 15.0 or higher (minimum deployment target)

### Development Tools
- **Git**: Latest version
- **VS Code**: Recommended editor with extensions:
  - ESLint
  - Prettier
  - Swift (for iOS development)
  - PostgreSQL Explorer
  - Docker

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/quiz-app.git
cd quiz-app
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
# NODE_ENV=development
# PORT=3000
# DB_HOST=localhost
# DB_USERNAME=quiz_user
# DB_PASSWORD=quiz_password
# DB_NAME=quiz_app_dev
# DB_NAME_TEST=quiz_app_test
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-super-secret-jwt-key-change-in-production
# JWT_EXPIRES_IN=7d
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# From project root
docker-compose up -d

# This will start PostgreSQL and Redis containers
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

#### Option B: Manual Installation
```bash
# Install PostgreSQL
brew install postgresql
brew services start postgresql

# Install Redis
brew install redis
brew services start redis

# Create database and user
psql postgres
CREATE USER quiz_user WITH PASSWORD 'quiz_password';
CREATE DATABASE quiz_app_dev OWNER quiz_user;
CREATE DATABASE quiz_app_test OWNER quiz_user;
GRANT ALL PRIVILEGES ON DATABASE quiz_app_dev TO quiz_user;
GRANT ALL PRIVILEGES ON DATABASE quiz_app_test TO quiz_user;
\q
```

### 4. Run Database Migrations and Seeds
```bash
# From backend directory
npm run migrate
npm run seed
```

### 5. Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3000`

### 6. iOS Setup

#### Create Xcode Project
1. Open Xcode
2. Create new iOS project:
   - Product Name: `QuizApp`
   - Interface: SwiftUI
   - Language: Swift
   - Use Core Data: Yes (optional)
   - Bundle Identifier: `com.yourcompany.quizapp`
   - Minimum iOS Version: 15.0

#### Import Swift Files
1. Copy Swift files from `ios/QuizApp/QuizApp/` to your Xcode project
2. Organize files according to the folder structure:
   - `App/` - Main app and content view
   - `Models/` - Data models
   - `Views/` - UI components
   - `Services/` - Networking and authentication
   - `Utilities/` - Helper functions

#### Configure Network Settings
Update the base URL in `NetworkService.swift`:
```swift
private let baseURL = "http://localhost:3000/api" // Development
```

For device testing, use your computer's IP address:
```swift
private let baseURL = "http://192.168.1.100:3000/api" // Replace with your IP
```

### 7. Test the Setup

#### Backend Tests
```bash
# From backend directory
npm test

# Run tests in watch mode
npm run test:watch
```

#### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Login user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

#### iOS App Testing
1. Build and run in iOS Simulator
2. Test user registration flow
3. Test login flow
4. Verify token storage and authentication

## Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

### Backend Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Run database migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Seed database
npm run seed
```

### iOS Development
1. Open Xcode project
2. Make changes to Swift files
3. Build and test in simulator
4. Use Xcode's built-in testing tools

## Environment Configuration

### Backend Environment Variables
```env
# Required
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USERNAME=quiz_user
DB_PASSWORD=quiz_password
DB_NAME=quiz_app_dev
DB_NAME_TEST=quiz_app_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key

# Optional
JWT_EXPIRES_IN=7d
```

### iOS Configuration
Update network settings in `NetworkService.swift` for different environments:
```swift
#if DEBUG
private let baseURL = "http://localhost:3000/api"
#else
private let baseURL = "https://your-production-domain.com/api"
#endif
```

## Common Issues and Solutions

### Backend Issues

#### Database Connection Error
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql

# Check connection
psql -h localhost -U quiz_user -d quiz_app_dev
```

#### Redis Connection Error
```bash
# Check if Redis is running
brew services list | grep redis

# Restart Redis
brew services restart redis

# Test connection
redis-cli ping
```

#### Migration Errors
```bash
# Check migration status
npm run migrate -- --status

# Run specific migration
npm run migrate -- --to migration-name.js

# Reset database (WARNING: This will delete all data)
npm run migrate:undo:all
npm run migrate
```

### iOS Issues

#### Network Connection Issues
- Ensure backend is running on correct port
- Check IP address for device testing
- Verify iOS simulator can reach localhost
- For device testing, use computer's IP address

#### Xcode Build Issues
- Clean build folder: Product → Clean Build Folder
- Reset simulator: Device → Erase All Content and Settings
- Check iOS deployment target matches minimum version

#### Token Storage Issues
- Verify Keychain access in iOS simulator
- Check TokenManager implementation
- Ensure proper error handling for token operations

## Performance Optimization

### Backend
- Use database indexing for frequently queried fields
- Implement caching for static data
- Use connection pooling for database
- Monitor API response times

### iOS
- Use lazy loading for large datasets
- Implement proper image caching
- Use SwiftUI's built-in performance features
- Monitor memory usage

## Debugging

### Backend Debugging
```bash
# Enable detailed logging
NODE_ENV=development npm run dev

# Use debugger
node --inspect-brk src/app.js

# View logs
tail -f logs/app.log
```

### iOS Debugging
- Use Xcode's built-in debugger
- Add breakpoints in Swift code
- Monitor network requests in Network tab
- Use print statements for debugging

## Next Steps

After completing the setup:

1. **Sprint 2**: Implement question management and solo quiz gameplay
2. **Sprint 3**: Add user progression system and UI polish
3. **Sprint 4**: Implement basic multiplayer functionality
4. **Sprint 5**: Prepare for App Store submission

For more detailed information, see:
- [API Documentation](../api/authentication.md)
- [Database Schema](../database/schema.md)
- [Testing Guide](../testing/guide.md)
- [Deployment Guide](../deployment/guide.md)