# Authentication API Documentation

## Overview
The QuizApp authentication system provides secure user registration, login, and session management using JWT tokens.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication Flow
1. User registers or logs in
2. Server returns JWT token
3. Client stores token securely (iOS Keychain)
4. Client includes token in Authorization header for protected routes

## Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-50 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, mixed case + numbers)",
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "level": 1,
      "totalScore": 0,
      "gamesPlayed": 0,
      "gamesWon": 0,
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- 400: Validation errors
- 409: User already exists

### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "string (valid email)",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "level": 1,
      "totalScore": 0,
      "gamesPlayed": 0,
      "gamesWon": 0,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- 400: Validation errors
- 401: Invalid credentials
- 403: Account deactivated

### GET /auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "level": 1,
      "totalScore": 0,
      "gamesPlayed": 0,
      "gamesWon": 0,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- 401: Invalid or missing token

### POST /auth/forgot-password
Request password reset instructions.

**Request Body:**
```json
{
  "email": "string (valid email)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

**Error Responses:**
- 400: Validation errors
- 404: User not found

### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "string (reset token from email)",
  "newPassword": "string (min 8 chars, mixed case + numbers)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- 400: Invalid or expired token, validation errors

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Passwords are hashed using bcrypt with salt rounds of 12

### JWT Token
- Signed with HS256 algorithm
- Default expiration: 7 days
- Contains user ID, username, and email
- Must be included in Authorization header as "Bearer <token>"

### Rate Limiting
- Registration: 5 attempts per 15 minutes per IP
- Login: 10 attempts per 15 minutes per IP
- Password reset: 3 attempts per hour per IP

## Error Response Format
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Validation error message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials/token)
- 403: Forbidden (account deactivated)
- 404: Not Found
- 409: Conflict (duplicate user)
- 500: Internal Server Error

## Usage Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### iOS Swift Examples

**Register:**
```swift
let registerData = RegisterRequest(
    username: "johndoe",
    email: "john@example.com",
    password: "Password123",
    firstName: "John",
    lastName: "Doe"
)

authService.register(
    username: registerData.username,
    email: registerData.email,
    password: registerData.password,
    firstName: registerData.firstName,
    lastName: registerData.lastName
)
```

**Login:**
```swift
authService.login(email: "john@example.com", password: "Password123")
```

**Include Token in Requests:**
```swift
var request = URLRequest(url: url)
if let token = TokenManager.shared.getToken() {
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
}
```