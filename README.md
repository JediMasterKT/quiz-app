# QuizApp

A premium quiz gaming app for iOS with solo and multiplayer modes. This project provides a comprehensive foundation for building a competitive quiz application with real-time features and robust authentication.

## 🚀 Project Status

### ✅ Sprint 1 Complete (Development Foundation)
- **Development Environment**: Full Docker setup with PostgreSQL and Redis
- **Database Schema**: Complete schema for users, questions, categories, sessions, and multiplayer rooms
- **Authentication System**: JWT-based authentication with secure password hashing
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **iOS Foundation**: SwiftUI app with authentication UI and secure token storage

### 📋 Current Sprint: Ready for Sprint 2 (Core Game Engine)
Next sprint will focus on question management, solo quiz gameplay, and scoring systems.

## 🏗️ Project Structure

```
quiz-app/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Authentication, questions, games
│   │   ├── models/          # Database models (User, Question, etc.)
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation, error handling
│   │   └── services/        # Business logic
│   ├── migrations/          # Database schema migrations
│   ├── seeders/            # Sample data
│   └── tests/              # Comprehensive test suite
├── ios/                    # iOS SwiftUI application
│   └── QuizApp/
│       ├── Models/         # Data models
│       ├── Views/          # SwiftUI views
│       ├── Services/       # Network and auth services
│       └── ViewModels/     # Business logic
├── docs/                   # Project documentation
│   ├── api/               # API documentation
│   ├── architecture/      # System design
│   └── development/       # Setup guides
├── scripts/               # Development utilities
└── .github/workflows/     # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- Xcode 14+ (for iOS development)

### Option 1: Automated Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/quiz-app.git
cd quiz-app

# Run the setup script
./scripts/dev-setup.sh

# Start all services
./scripts/dev-start.sh
```

### Option 2: Manual Setup
```bash
# 1. Start database services
docker-compose up -d postgres redis

# 2. Setup backend
cd backend
npm install
cp .env.example .env
npm run db:setup
npm run dev

# 3. Setup iOS (in another terminal)
# Open ios/QuizApp.xcodeproj in Xcode
```

## 🔧 Available Scripts

### Backend Scripts
```bash
# Development
npm run dev              # Start with hot reload
npm run test            # Run test suite
npm run test:watch      # Watch mode testing
npm run test:coverage   # Coverage reports

# Database
npm run migrate         # Run migrations
npm run seed           # Seed sample data
npm run db:reset       # Reset database
npm run db:setup       # Setup fresh database

# Docker
npm run docker:dev     # Start DB services
npm run docker:stop    # Stop all services
npm run docker:logs    # View logs

# Utilities
npm run health         # Check server health
npm run clean          # Clean dependencies
```

### Project Scripts
```bash
# Development workflow
./scripts/dev-setup.sh    # Initial setup
./scripts/dev-start.sh    # Start all services
./scripts/dev-stop.sh     # Stop all services
./scripts/dev-reset.sh    # Reset everything
```

## 📊 Current Features

### ✅ Implemented Features

#### Backend API
- **Authentication System**
  - User registration with validation
  - JWT-based login system
  - Password reset functionality
  - Protected routes middleware
  - Comprehensive test coverage (47 tests)

- **Database Layer**
  - PostgreSQL with Sequelize ORM
  - Complete schema for all features
  - Database migrations and seeders
  - User management and statistics

- **Security**
  - bcrypt password hashing
  - JWT token authentication
  - Input validation and sanitization
  - CORS and security headers
  - Error handling middleware

#### iOS Application
- **Authentication UI**
  - Login and registration screens
  - Secure token storage (Keychain)
  - Form validation and error handling
  - Reactive UI with Combine

- **Architecture**
  - SwiftUI with MVVM pattern
  - Network layer with Combine
  - Environment-based configuration
  - Secure credential management

#### DevOps & Infrastructure
- **CI/CD Pipeline**
  - GitHub Actions for automated testing
  - Backend testing with PostgreSQL/Redis
  - iOS build validation
  - Code coverage reporting

- **Development Environment**
  - Docker Compose for local development
  - Automated setup scripts
  - Hot reload for backend development
  - Database management tools

### 🔄 In Progress / Next Sprint
- Question management system
- Solo quiz gameplay engine
- Scoring and progression system
- Enhanced iOS quiz UI
- Real-time multiplayer foundation

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1
- **Database**: PostgreSQL 14 with Sequelize ORM
- **Cache**: Redis 7
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS

### iOS
- **Framework**: SwiftUI (iOS 15+)
- **Language**: Swift 5.7+
- **Architecture**: MVVM with ObservableObject
- **Networking**: URLSession + Combine
- **Storage**: Core Data + Keychain
- **State Management**: Combine + Environment Objects

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose
- **Code Quality**: ESLint, SwiftLint (planned)
- **Monitoring**: Health checks, logging
- **Deployment**: Production-ready configuration

## 📈 Development Workflow

### Git Workflow
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: Feature branches
- **hotfix/**: Emergency fixes

### Commit Convention
```
type(scope): description

- Detailed explanation
- Reference to ticket (QA-XXX)
- Breaking changes noted
```

### Pull Request Process
1. Create feature branch from develop
2. Implement with tests
3. Ensure CI passes
4. Request code review
5. Merge to develop

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Health Check
- `GET /health` - Server health status

### Coming Next Sprint
- `GET /api/questions` - Get questions by category
- `POST /api/games` - Start new game session
- `GET /api/categories` - Get question categories

## 🧪 Testing

### Backend Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Coverage**: 47 comprehensive tests covering:
- Authentication flows
- Input validation
- Password security
- JWT token handling
- Database operations
- Error handling

### iOS Testing
```bash
# Run from Xcode
Product > Test
```

## 🔐 Security

### Authentication
- JWT tokens with configurable expiration
- bcrypt password hashing (salt rounds: 12)
- Secure token storage in iOS Keychain
- Protected route middleware

### Input Validation
- Email format validation
- Password strength requirements
- Input sanitization
- SQL injection prevention

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Request size limits
- Error message sanitization

## 🚀 Deployment

### Development
```bash
./scripts/dev-start.sh
```

### Production (Planned)
- Docker containerization
- Environment-based configuration
- SSL/TLS certificates
- Load balancing
- Database connection pooling

## 📚 Documentation

- [API Documentation](docs/api/)
- [Architecture Overview](docs/architecture/)
- [Development Setup](docs/development/)
- [Database Schema](docs/database/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/QA-XXX-description`
3. Commit changes: `git commit -m 'feat(auth): add password reset'`
4. Push to branch: `git push origin feature/QA-XXX-description`
5. Create Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For questions or issues:
1. Check existing documentation
2. Review GitHub issues
3. Create new issue with detailed description

---

**Sprint 1 Complete** ✅ | **Ready for Sprint 2** 🚀 | **Foundation Solid** 💪