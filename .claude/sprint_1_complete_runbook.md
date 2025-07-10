# QuizApp Sprint 1 Complete Runbook

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Walkthrough](#architecture-walkthrough)
3. [Getting Started Guide](#getting-started-guide)
4. [Feature Deep Dive](#feature-deep-dive)
5. [Database Guide](#database-guide)
6. [API Testing Guide](#api-testing-guide)
7. [Code Navigation](#code-navigation)
8. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
9. [Development Workflow](#development-workflow)
10. [Testing Guide](#testing-guide)

---

## 📋 Project Overview

The QuizApp is a premium iOS quiz gaming application with solo and multiplayer modes. Sprint 1 established the foundational infrastructure including authentication, database design, and development environment.

### Current Status
- ✅ **Sprint 1 Complete**: Development foundation established
- 🚀 **Ready for Sprint 2**: Core game engine development

### Tech Stack
- **Backend**: Node.js 18+, Express 5.1, PostgreSQL 14, Redis 7, JWT
- **iOS**: SwiftUI, Combine, Keychain, URLSession
- **DevOps**: GitHub Actions, Docker Compose, Jest testing

---

## 🏗️ Architecture Walkthrough

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   iOS SwiftUI   │───▶│  Node.js API    │───▶│   PostgreSQL    │
│      App        │    │     Server      │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Keychain     │    │      JWT        │    │      Redis      │
│   (Security)    │    │  Authentication │    │     (Cache)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure Deep Dive

```
quiz-app/
├── .claude/                    # AI Assistant context (this file)
├── .github/workflows/          # CI/CD automation
│   ├── backend.yml            # Backend testing pipeline
│   └── ios.yml                # iOS build/test pipeline
├── backend/                   # Node.js Express API
│   ├── src/                   # Source code
│   │   ├── app.js            # Main application entry
│   │   ├── controllers/       # Business logic handlers
│   │   ├── middleware/        # Security, validation, errors
│   │   ├── models/           # Database models (Sequelize)
│   │   ├── routes/           # API endpoint definitions
│   │   ├── services/         # Business logic services (empty)
│   │   └── utils/            # Helper utilities (empty)
│   ├── config/               # Database & environment config
│   ├── migrations/           # Database schema versions
│   ├── seeders/              # Sample data scripts
│   ├── tests/                # Test suites
│   ├── .env                  # Environment variables (local)
│   ├── .env.example          # Environment template
│   ├── Dockerfile            # Container definition
│   └── package.json          # Dependencies & scripts
├── ios/                       # iOS SwiftUI Application
│   ├── QuizApp/
│   │   ├── App/              # Main app entry points
│   │   ├── Models/           # Data models
│   │   ├── Views/            # SwiftUI user interface
│   │   ├── Services/         # Network & authentication
│   │   └── README.md         # iOS setup guide
├── docs/                      # Project documentation
│   ├── api/                  # API endpoint documentation
│   ├── development/          # Setup & workflow guides
│   └── sprints/              # Sprint tracking
├── scripts/                   # Development automation
│   ├── dev-setup.sh          # Initial environment setup
│   ├── dev-start.sh          # Start all services
│   ├── dev-stop.sh           # Stop all services
│   └── dev-reset.sh          # Reset environment
├── docker-compose.yml         # Multi-service container setup
└── README.md                 # Main project overview
```

---

## 🚀 Getting Started Guide

### Prerequisites Checklist
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed (`psql --version`)
- [ ] Homebrew installed (macOS)
- [ ] Git installed
- [ ] Xcode 14+ (for iOS development)

### Option 1: Quick Setup (Recommended)
```bash
# 1. Clone the repository
git clone <repository-url>
cd quiz-app

# 2. Run automated setup
./scripts/dev-setup.sh

# 3. Start development environment
./scripts/dev-start.sh
```

### Option 2: Manual Setup (Step-by-Step)

#### Step 1: Start PostgreSQL
```bash
# Install PostgreSQL (if not installed)
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify PostgreSQL is running
pg_isready
```

#### Step 2: Create Database and User
```bash
# Create user
createuser quiz_user

# Create databases
createdb -O quiz_user quiz_app_dev
createdb -O quiz_user quiz_app_test

# Set user password
psql -d postgres -c "ALTER USER quiz_user PASSWORD 'quiz_password';"

# Test connection
psql -U quiz_user -d quiz_app_dev -c "SELECT current_database(), current_user;"
```

#### Step 3: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Test server startup
npm start
```

#### Step 4: Verification
```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return: {"success":true,"message":"Quiz App API is running","timestamp":"..."}
```

---

## 🎯 Feature Deep Dive

### 1. Authentication System

#### Overview
Complete JWT-based authentication with secure password hashing, token management, and protected routes.

#### Features Implemented
- **User Registration**: Email/username validation, password hashing
- **User Login**: Credential verification, JWT token generation
- **Password Reset**: Token-based password reset flow
- **Protected Routes**: JWT middleware for secure endpoints
- **iOS Integration**: Keychain-based secure token storage

#### Key Files
```
backend/src/
├── controllers/authController.js  # Authentication business logic
├── middleware/auth.js            # JWT token validation
├── middleware/validation.js      # Input validation rules
├── models/User.js               # User data model
└── routes/auth.js               # Authentication endpoints

ios/QuizApp/
├── Services/AuthService.swift   # Authentication service
├── Services/TokenManager.swift  # Secure token storage
├── Services/NetworkService.swift # HTTP client
└── Views/Authentication/        # Login/Register UI
```

#### API Endpoints
```
POST /api/auth/register      # Create new user account
POST /api/auth/login         # Authenticate user
GET  /api/auth/profile       # Get user profile (protected)
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password with token
GET  /health                 # Server health check
```

### 2. Database Schema

#### Overview
Comprehensive PostgreSQL schema supporting all planned features including solo gameplay, multiplayer rooms, and user progression.

#### Tables Overview
1. **users**: User accounts and authentication
2. **categories**: Quiz categories (Technology, Business, etc.)
3. **questions**: Quiz questions with metadata
4. **game_sessions**: Solo and multiplayer game tracking
5. **rooms**: Multiplayer room management
6. **room_participants**: Room membership tracking

#### Key Relationships
```
users (1) ←→ (many) game_sessions
categories (1) ←→ (many) questions
rooms (1) ←→ (many) room_participants
users (1) ←→ (many) room_participants
```

### 3. iOS Application

#### Overview
SwiftUI-based iOS application with modern architecture patterns, reactive programming, and secure storage.

#### Architecture Pattern
- **MVVM**: Model-View-ViewModel pattern
- **Reactive**: Combine framework for data flow
- **Secure Storage**: Keychain for sensitive data
- **Network Layer**: URLSession with Combine publishers

#### Key Components
- **AuthService**: Centralized authentication management
- **NetworkService**: HTTP client with JWT handling
- **TokenManager**: Secure Keychain token storage
- **LoginView/RegisterView**: Authentication UI

---

## 🗄️ Database Guide

### Database Connection
```bash
# Connect to development database
psql -U quiz_user -d quiz_app_dev

# Connect to test database
psql -U quiz_user -d quiz_app_test
```

### Common Database Commands
```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- View all users
SELECT id, username, email, created_at FROM users;

-- View all categories
SELECT * FROM categories;

-- Check migration status
SELECT * FROM "SequelizeMeta";
```

### Migration Management
```bash
# View migration status
npm run migrate:status

# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all

# Reset database completely
npm run db:reset
```

### Seeding Data
```bash
# Seed all data
npm run seed

# Undo all seeds
npm run seed:undo

# Reset and reseed
npm run db:reset
```

---

## 🔧 API Testing Guide

### Using cURL

#### 1. Health Check
```bash
curl -X GET http://localhost:3000/health
```

#### 2. User Registration
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

#### 3. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

#### 4. Protected Endpoint (using token from login)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Using Postman

#### Collection Setup
1. Create new collection: "QuizApp API"
2. Set base URL variable: `{{baseURL}}` = `http://localhost:3000`
3. Set authorization token variable: `{{authToken}}`

#### Environment Variables
```json
{
  "baseURL": "http://localhost:3000",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Expected Responses

#### Successful Registration
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "level": 1,
      "totalScore": 0,
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

---

## 🧭 Code Navigation

### Backend Code Structure

#### 1. Main Application (`src/app.js`)
```javascript
// Key sections:
// - Express setup and middleware
// - Database connection
// - Route registration
// - Error handling
// - Server startup
```

#### 2. Authentication Controller (`src/controllers/authController.js`)
```javascript
// Key methods:
register()      // User registration
login()         // User authentication
getProfile()    // Get user profile
forgotPassword() // Password reset request
resetPassword()  // Password reset confirmation
```

#### 3. User Model (`src/models/User.js`)
```javascript
// Key features:
// - Sequelize model definition
// - Password hashing hooks
// - Instance methods (comparePassword, generateJWT)
// - JSON serialization (removes sensitive fields)
```

#### 4. Authentication Middleware (`src/middleware/auth.js`)
```javascript
// Key function:
authenticateToken() // JWT token validation for protected routes
```

### iOS Code Structure

#### 1. Authentication Service (`Services/AuthService.swift`)
```swift
// Key methods:
register()      // User registration
login()         // User authentication
logout()        // Clear authentication state
checkAuthStatus() // Validate stored token
```

#### 2. Network Service (`Services/NetworkService.swift`)
```swift
// Key features:
// - Generic HTTP client
// - JWT token handling
// - Error handling
// - Combine publishers
```

#### 3. Token Manager (`Services/TokenManager.swift`)
```swift
// Key methods:
saveToken()     // Store token securely
getToken()      // Retrieve stored token
removeToken()   // Clear stored token
```

---

## 🚨 Common Issues & Troubleshooting

### Database Issues

#### Issue: "Connection refused" to PostgreSQL
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it
brew services start postgresql@14

# Check for port conflicts
lsof -i :5432
```

#### Issue: "Database does not exist"
```bash
# Recreate databases
createdb -O quiz_user quiz_app_dev
createdb -O quiz_user quiz_app_test
```

#### Issue: "Permission denied for user quiz_user"
```bash
# Reset user permissions
psql -d postgres -c "ALTER USER quiz_user CREATEDB;"
psql -d postgres -c "ALTER USER quiz_user PASSWORD 'quiz_password';"
```

### Backend Server Issues

#### Issue: "Port 3000 already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### Issue: "TypeError: Missing parameter name"
This is related to Express route patterns. Check for:
- Wildcard routes (`app.use('*', ...)`)
- Invalid route patterns
- Solution: Use `app.use((req, res) => ...)` for catch-all routes

#### Issue: "JWT token invalid"
```bash
# Check JWT_SECRET in .env file
cat .env | grep JWT_SECRET

# Ensure JWT_SECRET is set and not empty
```

### Migration Issues

#### Issue: "Migration already exists"
```bash
# Check migration status
npm run migrate:status

# Rollback if needed
npm run migrate:undo

# Then re-run
npm run migrate
```

#### Issue: "Column already exists"
```bash
# Reset database completely
npm run db:reset
```

### iOS Build Issues

#### Issue: Xcode project not found
The iOS project structure exists but needs to be created in Xcode:
1. Open Xcode
2. Create new iOS project
3. Copy Swift files from `ios/QuizApp/QuizApp/` directory
4. Configure project settings (iOS 15+, SwiftUI)

#### Issue: Network requests failing
Check:
- Backend server is running (`curl http://localhost:3000/health`)
- Network permissions in iOS project
- Simulator network settings

### Test Suite Issues

#### Issue: Tests timing out
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

#### Issue: Database connection in tests
```bash
# Ensure test database exists
createdb -O quiz_user quiz_app_test

# Set NODE_ENV
NODE_ENV=test npm test
```

---

## 🔄 Development Workflow

### Daily Development Setup
```bash
# 1. Start development environment
./scripts/dev-start.sh

# 2. Run backend in development mode
cd backend && npm run dev

# 3. Open iOS project in Xcode
open ios/QuizApp.xcodeproj
```

### Making Changes

#### Backend Changes
1. Edit files in `backend/src/`
2. Server auto-reloads with nodemon
3. Test changes: `curl http://localhost:3000/api/...`
4. Run tests: `npm test`

#### Database Changes
1. Create migration: `npx sequelize-cli migration:generate --name description`
2. Edit migration file in `migrations/`
3. Run migration: `npm run migrate`
4. Update model in `src/models/`

#### iOS Changes
1. Edit Swift files in Xcode
2. Build and run in simulator
3. Test authentication flow
4. Check network requests in debugger

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/QA-XXX-description

# Make changes and commit
git add .
git commit -m "feat(auth): add password validation"

# Push and create PR
git push origin feature/QA-XXX-description
```

### Code Quality Checks
```bash
# Backend testing
npm test

# Backend linting (when configured)
npm run lint

# Test coverage
npm run test:coverage

# iOS testing (in Xcode)
⌘ + U
```

---

## 🧪 Testing Guide

### Running Backend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── auth.test.js        # Authentication endpoint tests
├── setup.js            # Test environment setup
└── [future tests]      # Additional test files
```

### Understanding Test Results
```bash
# Example output:
✓ should register a new user successfully (304 ms)
✓ should return validation errors for invalid data (13 ms)
✗ should return validation error for invalid email (239 ms)

# Coverage report:
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   73.8  |   55.22  |  70.83  |  74.51  |
```

### Manual Testing Checklist

#### Authentication Flow
- [ ] User can register with valid data
- [ ] Registration fails with invalid data
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Protected endpoints require valid JWT
- [ ] Invalid JWT tokens are rejected
- [ ] Password reset flow works

#### Database Operations
- [ ] Migrations run successfully
- [ ] Seed data populates correctly
- [ ] Database constraints work
- [ ] User data is stored securely

#### iOS Authentication (when Xcode project is set up)
- [ ] Login screen displays correctly
- [ ] Registration form validates input
- [ ] Successful login stores token
- [ ] Token is used for API requests
- [ ] Logout clears stored token

---

## 📊 Monitoring & Debugging

### Backend Logging
```bash
# View server logs
tail -f server.log

# Database query logging (in development)
# Check console output when running server
```

### Database Monitoring
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'quiz_app_dev';

-- Check table sizes
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename = 'users';
```

### Performance Monitoring
```bash
# Check database query performance
npm run dev  # Watch console for slow queries

# Monitor API response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/health
```

### Debugging Tips

#### Backend Debugging
1. Add `console.log()` statements
2. Use debugger: `node --inspect src/app.js`
3. Check middleware execution order
4. Verify environment variables: `console.log(process.env)`

#### Database Debugging
1. Enable query logging in development
2. Use `EXPLAIN ANALYZE` for slow queries
3. Check foreign key constraints
4. Verify data types and constraints

#### iOS Debugging
1. Use Xcode debugger and breakpoints
2. Check network requests in Network tab
3. Verify Keychain operations
4. Test on different simulators/devices

---

## 🎯 Next Steps for Sprint 2

### Immediate Tasks
1. **Question Management API**
   - CRUD operations for questions
   - Category-based filtering
   - Difficulty level management

2. **Solo Quiz Engine**
   - Game session management
   - Scoring algorithms
   - Question selection logic

3. **iOS Quiz UI**
   - Question display components
   - Answer selection interface
   - Score tracking views

### Codebase Preparation
- Review and clean up any Sprint 1 technical debt
- Ensure all tests pass before new development
- Set up additional test databases if needed
- Plan API endpoints for quiz functionality

### Development Environment
- Confirm PostgreSQL is running smoothly
- Verify backend server stability
- Complete iOS Xcode project setup
- Test CI/CD pipeline functionality

---

## 📚 Additional Resources

### Documentation
- [API Documentation](../docs/api/)
- [Database Schema](../docs/database/)
- [Architecture Overview](../docs/architecture/)

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize ORM Guide](https://sequelize.org/)
- [SwiftUI Documentation](https://developer.apple.com/swiftui/)
- [JWT.io](https://jwt.io/) for token debugging

### Development Tools
- **Postman**: API testing
- **TablePlus/pgAdmin**: Database management
- **Xcode**: iOS development
- **VS Code**: Backend development

---

*This runbook was generated for Sprint 1 completion. Update as the project evolves through subsequent sprints.*