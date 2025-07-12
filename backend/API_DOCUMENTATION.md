# Quiz App Backend API Documentation

## User Progression & Gamification System

### Overview
The progression system tracks user XP, levels, achievements, and leaderboard rankings. All progression updates are broadcast in real-time via WebSocket.

### Base URL
```
http://localhost:3000/api
```

### Authentication
All progression endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Progression Endpoints

#### Get User Progression
```http
GET /api/progression/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "player123",
      "level": 5,
      "totalXp": 850,
      "currentLevelXp": 350,
      "nextLevelXp": 450,
      "levelProgress": 0.44,
      "title": "Scholar"
    },
    "statistics": {
      "totalXp": 850,
      "questionsAnswered": 120,
      "correctAnswers": 95,
      "perfectGames": 3,
      "currentStreak": 5,
      "longestStreak": 12,
      "accuracy": "79.17",
      "achievementsEarned": 8
    },
    "recentAchievements": [
      {
        "name": "Quiz Master",
        "description": "Answer 100 questions correctly",
        "icon": "brain",
        "rarity": "common",
        "xpReward": 100,
        "earnedAt": "2025-07-12T10:30:00Z"
      }
    ]
  }
}
```

#### Get User Achievements
```http
GET /api/progression/achievements
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 25,
      "earned": 8,
      "progress": 32
    },
    "achievements": {
      "gameplay": [
        {
          "id": 1,
          "code": "first_perfect",
          "name": "Perfect Score",
          "description": "Get a perfect score in any quiz",
          "icon": "star",
          "rarity": "common",
          "earned": true,
          "earnedAt": "2025-07-10T15:20:00Z",
          "progress": 100
        }
      ],
      "progression": [...],
      "streak": [...],
      "social": [...],
      "special": [...]
    }
  }
}
```

#### Check Achievements
```http
POST /api/progression/achievements/check
```

**Request Body:**
```json
{
  "context": {
    "gameScore": 1000,
    "perfectGame": true,
    "difficulty": "hard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": 5,
        "name": "Speed Demon",
        "description": "Answer a question in under 3 seconds",
        "xpReward": 75
      }
    ],
    "count": 1
  }
}
```

### Leaderboard Endpoints

#### Get Leaderboard
```http
GET /api/progression/leaderboard?type=weekly&categoryId=1&limit=100&offset=0
```

**Query Parameters:**
- `type`: `daily`, `weekly`, `monthly`, `all_time` (default: `weekly`)
- `categoryId`: Filter by category (optional)
- `limit`: Number of entries (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "weekly",
    "categoryId": 1,
    "period": {
      "start": "2025-07-07T00:00:00Z",
      "end": "2025-07-14T00:00:00Z"
    },
    "entries": [
      {
        "rank": 1,
        "userId": 42,
        "username": "topPlayer",
        "avatarUrl": "https://...",
        "level": 15,
        "title": "Sage",
        "score": 15420,
        "xpEarned": 3200,
        "gamesPlayed": 28
      }
    ],
    "total": 523,
    "limit": 100,
    "offset": 0
  }
}
```

#### Get User Rank
```http
GET /api/progression/rank?type=weekly&categoryId=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 23,
    "score": 8540,
    "xpEarned": 1250,
    "gamesPlayed": 15,
    "totalEntries": 523,
    "percentile": 96
  }
}
```

#### Get Top Players
```http
GET /api/progression/top-players?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": 42,
      "username": "champion",
      "avatarUrl": "https://...",
      "level": 25,
      "title": "Quiz God",
      "totalXp": 72580,
      "gamesPlayed": 1250,
      "accuracy": "87.5"
    }
  ]
}
```

### Game Endpoints

#### Complete Quiz
```http
POST /api/game/complete
```

**Request Body:**
```json
{
  "categoryId": 1,
  "questionsAnswered": 10,
  "correctAnswers": 8,
  "score": 800,
  "timeTaken": 120,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 123,
      "score": 800,
      "xpEarned": 120,
      "won": true
    },
    "progression": {
      "earnedXP": 120,
      "totalXP": 970,
      "level": 6,
      "leveledUp": true,
      "previousLevel": 5,
      "title": "Adept"
    },
    "achievements": [
      {
        "name": "Level 5",
        "description": "Reach level 5",
        "xpReward": 100
      }
    ],
    "stats": {
      "totalScore": 15420,
      "gamesPlayed": 52,
      "gamesWon": 41,
      "winRate": "78.85"
    }
  }
}
```

#### Get Game History
```http
GET /api/game/history?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 123,
        "score": 800,
        "questionsAnswered": 10,
        "correctAnswers": 8,
        "timeTaken": 120,
        "won": true,
        "xpEarned": 120,
        "category": {
          "id": 1,
          "name": "General Knowledge",
          "icon": "book"
        },
        "createdAt": "2025-07-12T10:30:00Z"
      }
    ],
    "total": 52,
    "limit": 10,
    "offset": 0
  }
}
```

## WebSocket Events

### Connection
Connect with authentication:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events You Can Listen To

#### Progression Update
```javascript
socket.on('progression:update', (data) => {
  // Real-time XP and level updates
  console.log('XP earned:', data.earnedXP);
  console.log('New level:', data.level);
});
```

#### Achievement Unlocked
```javascript
socket.on('achievement:unlocked', (data) => {
  // New achievement notification
  console.log('Achievement:', data.achievement.name);
});
```

#### Level Up
```javascript
socket.on('progression:levelup', (data) => {
  // Level up celebration
  console.log('Level up!', data.level);
});
```

#### Leaderboard Updates
```javascript
// Join leaderboard room
socket.emit('join:leaderboard', 'weekly');

// Listen for updates
socket.on('leaderboard:update', (data) => {
  console.log('Leaderboard updated:', data);
});
```

#### Global Events
```javascript
// Someone leveled up
socket.on('global:levelup', (data) => {
  console.log(`${data.username} reached level ${data.newLevel}!`);
});

// Quiz completed
socket.on('global:quizcomplete', (data) => {
  console.log(`${data.username} scored ${data.score} in ${data.category}`);
});

// Streak milestone
socket.on('global:streak', (data) => {
  console.log(`${data.username} has a ${data.streak} day streak!`);
});
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "categoryId",
      "message": "Category ID must be an integer"
    }
  ]
}
```

## Rate Limiting

- API endpoints: 100 requests per minute per user
- WebSocket events: 50 emissions per minute per user

## XP Calculation

XP is calculated based on:
- Base XP: 10 per correct answer
- Difficulty multipliers: Easy (1x), Medium (1.5x), Hard (2x)
- Performance bonuses:
  - Perfect game: 1.5x
  - Fast answers (<10s avg): 1.2x
  - Active streak: 1.1x
- Additional XP from achievements

## Level Progression

Levels follow an exponential curve:
- Level 1: 0-100 XP
- Level 2: 101-250 XP
- Level 3: 251-500 XP
- ...continuing up to Level 25

Each level grants:
- New title
- XP multiplier bonus
- Daily bonus rewards
- Unlock new achievements