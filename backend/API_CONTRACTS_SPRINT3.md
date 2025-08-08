# Sprint 3 API Contracts - Progression System

## Base URL
```
https://api.quizapp.com/api/progression
```

## Authentication
All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. XP & Progression Endpoints

### Calculate XP for Game Session
**POST** `/calculate-xp`

Calculate XP earned from a completed game session.

**Request Body:**
```json
{
  "questionsCorrect": 8,
  "totalQuestions": 10,
  "difficulty": "medium",  // "easy" | "medium" | "hard"
  "timePerQuestion": 120,  // total time in seconds
  "categoryId": 1,
  "baseScore": 800
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "earnedXP": 270  // Calculated XP with all multipliers
  }
}
```

**Performance Target:** <100ms response time

---

### Add XP to User
**POST** `/add-xp`

Add earned XP to user's total and check for level ups.

**Request Body:**
```json
{
  "earnedXP": 270
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "earnedXP": 270,
    "totalXP": 1520,
    "level": 5,
    "currentLevelXP": 520,
    "nextLevelXP": 480,
    "progress": 0.52,
    "title": "Master",
    "leveledUp": true,
    "previousLevel": 4
  }
}
```

**WebSocket Events Triggered:**
- `progression:update` - Sent to user
- `progression:levelup` - Sent to user if leveled up
- `global:levelup` - Broadcast to all users if leveled up

---

### Get User Progression
**GET** `/me`

Get complete user progression data.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "player123",
      "level": 5,
      "totalXp": 1520,
      "currentLevelXp": 520,
      "nextLevelXp": 480,
      "levelProgress": 0.52,
      "title": "Master"
    },
    "statistics": {
      "questionsAnswered": 150,
      "correctAnswers": 120,
      "accuracy": 80,
      "currentStreak": 5,
      "longestStreak": 12,
      "perfectGames": 3,
      "totalTimePlayed": 3600,
      "achievementsEarned": 8,
      "categoriesPlayed": {
        "1": { "played": 10, "correct": 75, "totalTime": 600 }
      }
    },
    "recentAchievements": [
      {
        "name": "Quiz Master",
        "description": "Answer 100 questions correctly",
        "icon": "🎯",
        "rarity": "rare",
        "xpReward": 200,
        "earnedAt": "2025-01-08T10:30:00Z"
      }
    ]
  }
}
```

---

### Update Game Statistics
**POST** `/update-stats`

Update user statistics after game completion.

**Request Body:**
```json
{
  "questionsCorrect": 10,
  "totalQuestions": 10,
  "difficulty": "hard",
  "categoryId": 1,
  "timeTaken": 180,
  "perfectGame": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "questionsAnswered": 160,
    "correctAnswers": 130,
    "currentStreak": 6,
    "longestStreak": 12,
    "perfectGames": 4,
    "fastestAnswerTime": 3.2
  }
}
```

---

## 2. Achievement Endpoints

### Get All User Achievements
**GET** `/achievements`

Get all achievements with earned status.

**Response:** `200 OK`
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
          "name": "Perfect Score",
          "description": "Get 100% on a quiz",
          "icon": "💯",
          "rarity": "common",
          "xpReward": 50,
          "earned": true,
          "earnedAt": "2025-01-07T15:30:00Z",
          "progress": 100
        },
        {
          "id": 2,
          "name": "Speed Demon",
          "description": "Answer in under 3 seconds",
          "icon": "⚡",
          "rarity": "rare",
          "xpReward": 100,
          "earned": false,
          "progress": 0
        }
      ],
      "progression": [...],
      "streak": [...],
      "social": [...]
    }
  }
}
```

---

### Check & Grant Achievements
**POST** `/achievements/check`

Check if user earned new achievements after game.

**Request Body:**
```json
{
  "gameData": {
    "questionsCorrect": 10,
    "totalQuestions": 10,
    "perfectGame": true,
    "baseScore": 1000,
    "userLevel": 5
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "newAchievements": [
      {
        "name": "Perfect Score",
        "description": "Get 100% on a quiz",
        "icon": "💯",
        "xpReward": 50,
        "rarity": "common"
      }
    ]
  }
}
```

**WebSocket Event:**
- `achievement:unlocked` - Sent for each new achievement

---

## 3. Leaderboard Endpoints

### Get Leaderboard
**GET** `/leaderboard`

Get leaderboard entries.

**Query Parameters:**
- `type` (required): "daily" | "weekly" | "monthly" | "all_time"
- `categoryId` (optional): Filter by category
- `limit` (optional): Default 100
- `offset` (optional): Default 0

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "type": "weekly",
    "categoryId": null,
    "period": {
      "start": "2025-01-06T00:00:00Z",
      "end": "2025-01-13T00:00:00Z"
    },
    "entries": [
      {
        "rank": 1,
        "userId": 5,
        "username": "topPlayer",
        "avatarUrl": null,
        "level": 12,
        "title": "Grandmaster",
        "score": 5200,
        "xpEarned": 2100,
        "gamesPlayed": 25
      }
    ],
    "total": 150,
    "userRank": {
      "rank": 15,
      "score": 2800,
      "xpEarned": 900,
      "gamesPlayed": 12
    }
  }
}
```

**Performance:** Redis cached, <50ms for cached data

---

### Get User Rank
**GET** `/rank`

Get user's rank in specific leaderboard.

**Query Parameters:**
- `type`: "daily" | "weekly" | "monthly" | "all_time"
- `categoryId` (optional): Category filter

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rank": 15,
    "score": 2800,
    "xpEarned": 900,
    "gamesPlayed": 12,
    "totalEntries": 150,
    "percentile": 90
  }
}
```

---

## 4. WebSocket Events

### Connection
```javascript
const socket = io('wss://api.quizapp.com', {
  auth: {
    token: jwtToken
  }
});
```

### Subscribe to Leaderboards
```javascript
// Subscribe to leaderboard updates
socket.emit('leaderboard:subscribe', {
  type: 'weekly',
  categoryId: null,
  limit: 100
});

// Receive initial data
socket.on('leaderboard:initial', (data) => {
  // Full leaderboard data
});

// Receive real-time updates
socket.on('leaderboard:update', (data) => {
  // Updated leaderboard entries
});
```

### User Progression Events
```javascript
// XP and level updates
socket.on('progression:update', (data) => {
  // earnedXP, totalXP, level, progress
});

// Level up notification
socket.on('progression:levelup', (data) => {
  // level, previousLevel, title
});

// Achievement unlocked
socket.on('achievement:unlocked', (achievement) => {
  // name, description, icon, xpReward
});

// Rank changes
socket.on('rank:changed', (data) => {
  // type, oldRank, newRank, improved
});
```

### Global Events
```javascript
// Someone leveled up
socket.on('global:levelup', (data) => {
  // userId, username, newLevel
});

// Someone completed a quiz
socket.on('global:quizcomplete', (data) => {
  // userId, username, score, category
});

// Streak milestone
socket.on('global:streak', (data) => {
  // userId, username, streak
});

// Top 10 achievement
socket.on('global:topten', (data) => {
  // userId, rank, type
});
```

---

## 5. Performance Requirements

### Response Times
- XP Calculation: <100ms
- Statistics Aggregation: <100ms
- Achievement Checking: <50ms
- Leaderboard (cached): <50ms
- Leaderboard (uncached): <200ms
- Real-time Updates: <500ms propagation

### Concurrency
- Support 10,000+ concurrent WebSocket connections
- Handle 1,000+ concurrent API requests
- Process 100+ game completions per second

### Caching Strategy
- Redis caching for leaderboards
- Cache expiry:
  - Daily: 1 hour
  - Weekly: 2 hours
  - Monthly: 4 hours
  - All-time: 24 hours
- Automatic cache invalidation on updates

---

## 6. Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid XP amount"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 7. iOS Integration Notes

### Swift Models
```swift
struct ProgressionData: Codable {
    let earnedXP: Int
    let totalXP: Int
    let level: Int
    let currentLevelXP: Int
    let nextLevelXP: Int
    let progress: Double
    let title: String
    let leveledUp: Bool
    let previousLevel: Int?
}

struct Achievement: Codable {
    let id: Int
    let name: String
    let description: String
    let icon: String
    let rarity: String
    let xpReward: Int
    let earned: Bool
    let earnedAt: Date?
    let progress: Double
}

struct LeaderboardEntry: Codable {
    let rank: Int
    let userId: Int
    let username: String
    let avatarUrl: String?
    let level: Int
    let title: String
    let score: Int
    let xpEarned: Int
    let gamesPlayed: Int
}
```

### Best Practices
1. Cache leaderboard data locally for offline viewing
2. Debounce WebSocket subscriptions to prevent excessive connections
3. Show optimistic UI updates for XP gains
4. Queue achievement checks if offline
5. Use lazy loading for leaderboard pagination
6. Implement pull-to-refresh for manual updates

---

## 8. Testing Endpoints

### Reset User Stats (Development Only)
**POST** `/debug/reset-stats`

### Generate Test Leaderboard (Development Only)
**POST** `/debug/generate-leaderboard`

---

*Last Updated: Sprint 3 - Backend Agent*
*Performance Targets: All endpoints <100ms except uncached leaderboards*