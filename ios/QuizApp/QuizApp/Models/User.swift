import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let firstName: String?
    let lastName: String?
    let avatarUrl: String?
    let level: Int
    let totalScore: Int
    let gamesPlayed: Int
    let gamesWon: Int
    let lastLogin: Date?
    let isActive: Bool
    let emailVerified: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, username, email, level
        case firstName = "first_name"
        case lastName = "last_name"
        case avatarUrl = "avatar_url"
        case totalScore = "total_score"
        case gamesPlayed = "games_played"
        case gamesWon = "games_won"
        case lastLogin = "last_login"
        case isActive = "is_active"
        case emailVerified = "email_verified"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct AuthResponse: Codable {
    let success: Bool
    let message: String
    let data: AuthData?
    let errors: [ValidationError]?
}

struct AuthData: Codable {
    let user: User
    let token: String
}

struct ValidationError: Codable {
    let type: String
    let value: String
    let msg: String
    let path: String
    let location: String
}

struct RegisterRequest: Codable {
    let username: String
    let email: String
    let password: String
    let firstName: String?
    let lastName: String?
    
    enum CodingKeys: String, CodingKey {
        case username, email, password
        case firstName = "firstName"
        case lastName = "lastName"
    }
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}