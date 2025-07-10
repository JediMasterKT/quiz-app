# QuizApp Backend

Node.js/Express API server for the QuizApp.

## Setup

```bash
npm install
docker-compose up -d  # Start PostgreSQL and Redis
npm run migrate       # Run database migrations
npm run seed          # Seed initial data
npm run dev          # Start development server
```

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile (protected)
- POST /api/auth/forgot-password - Password reset request
- POST /api/auth/reset-password - Password reset

### Questions (Coming in Sprint 2)
- GET /api/questions - Get questions with filtering
- POST /api/questions - Create new question (admin)

### Games (Coming in Sprint 2)
- POST /api/games - Create game session
- GET /api/games/:id - Get game session
- PUT /api/games/:id - Update game session

### Rooms (Coming in Sprint 4)
- POST /api/rooms - Create quiz room
- GET /api/rooms/:code - Join quiz room
- WebSocket /ws/rooms/:code - Real-time room communication

## Environment Variables

Create a `.env` file based on `.env.example`:

```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USERNAME=quiz_user
DB_PASSWORD=quiz_password
DB_NAME=quiz_app_dev
DB_NAME_TEST=quiz_app_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Testing

```bash
npm test        # Run all tests
npm run test:watch  # Watch mode
```

## Database Management

```bash
npm run migrate     # Run migrations
npm run migrate:undo # Undo last migration
npm run seed        # Run seed data
npm run seed:undo   # Undo seed data
```