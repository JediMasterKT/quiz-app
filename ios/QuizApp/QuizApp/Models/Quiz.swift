import Foundation

// MARK: - Quiz Models

struct Category: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let description: String?
    let iconUrl: String?
    let colorCode: String
    let questionCount: Int?
    let questionsByDifficulty: [String: Int]?
    
    // Helper for display
    var displayColor: String {
        return colorCode.hasPrefix("#") ? colorCode : "#\(colorCode)"
    }
}

struct Question: Codable, Identifiable, Hashable {
    let id: Int
    let categoryId: Int
    let questionText: String
    let questionType: QuestionType
    let options: [String]
    let difficultyLevel: Int // 1-5 scale
    let points: Int
    let timeLimit: Int // seconds
    let imageUrl: String?
    let audioUrl: String?
    let hint: String?
    let category: Category?
    let usageCount: Int?
    let successRate: Double?
    
    // Only included in quiz validation responses
    let correctAnswer: String?
    let explanation: String?
    
    // Computed properties
    var difficultyDisplayName: String {
        DifficultyLevel.fromInt(difficultyLevel)?.displayName ?? "Unknown"
    }
    
    var difficultyColor: String {
        DifficultyLevel.fromInt(difficultyLevel)?.color ?? "#999999"
    }
    
    var estimatedPoints: Int {
        let multiplier = DifficultyLevel.fromInt(difficultyLevel)?.pointsMultiplier ?? 1.0
        return Int(Double(points) * multiplier)
    }
}

enum QuestionType: String, Codable, CaseIterable {
    case multipleChoice = "multiple_choice"
    case trueFalse = "true_false"
    case fillBlank = "fill_blank"
    case essay = "essay"
    
    var displayName: String {
        switch self {
        case .multipleChoice:
            return "Multiple Choice"
        case .trueFalse:
            return "True/False"
        case .fillBlank:
            return "Fill in the Blank"
        case .essay:
            return "Essay"
        }
    }
}

enum DifficultyLevel: Int, Codable, CaseIterable {
    case beginner = 1
    case easy = 2
    case intermediate = 3
    case advanced = 4
    case expert = 5
    
    var displayName: String {
        switch self {
        case .beginner:
            return "Beginner"
        case .easy:
            return "Easy"
        case .intermediate:
            return "Intermediate"
        case .advanced:
            return "Advanced"
        case .expert:
            return "Expert"
        }
    }
    
    var description: String {
        switch self {
        case .beginner:
            return "Perfect for getting started"
        case .easy:
            return "Basic questions for beginners"
        case .intermediate:
            return "Intermediate level questions"
        case .advanced:
            return "Advanced questions for experts"
        case .expert:
            return "Expert level challenges"
        }
    }
    
    var color: String {
        switch self {
        case .beginner:
            return "#4CAF50" // Green
        case .easy:
            return "#8BC34A" // Light Green
        case .intermediate:
            return "#FF9800" // Orange
        case .advanced:
            return "#FF5722" // Deep Orange
        case .expert:
            return "#F44336" // Red
        }
    }
    
    var pointsMultiplier: Double {
        switch self {
        case .beginner:
            return 1.0
        case .easy:
            return 1.2
        case .intermediate:
            return 1.5
        case .advanced:
            return 1.8
        case .expert:
            return 2.0
        }
    }
    
    static func fromInt(_ value: Int) -> DifficultyLevel? {
        return DifficultyLevel(rawValue: value)
    }
}

struct QuizConfig: Codable {
    let categoryId: Int?
    let difficultyLevel: Int? // 1-5 scale
    let questionCount: Int
    
    init(categoryId: Int? = nil, difficultyLevel: Int? = nil, questionCount: Int = 10) {
        self.categoryId = categoryId
        self.difficultyLevel = difficultyLevel
        self.questionCount = questionCount
    }
    
    var difficulty: DifficultyLevel? {
        guard let level = difficultyLevel else { return nil }
        return DifficultyLevel.fromInt(level)
    }
}

// MARK: - Game Session Models

struct GameSession: Codable, Identifiable {
    let id: String
    let userId: Int
    let sessionType: SessionType
    let status: SessionStatus
    let categoryId: Int?
    let difficultyLevel: Int?
    let totalQuestions: Int
    let currentQuestionIndex: Int
    let score: Int
    let correctAnswers: Int
    let incorrectAnswers: Int
    let startedAt: Date
    let completedAt: Date?
    let totalTimeSpent: Int?
    
    var progress: SessionProgress {
        SessionProgress(
            current: currentQuestionIndex + 1,
            total: totalQuestions,
            percentage: Int((Double(currentQuestionIndex + 1) / Double(totalQuestions)) * 100)
        )
    }
    
    var accuracy: Int {
        let totalAnswered = correctAnswers + incorrectAnswers
        return totalAnswered > 0 ? Int((Double(correctAnswers) / Double(totalAnswered)) * 100) : 0
    }
    
    var isComplete: Bool {
        return status == .completed || currentQuestionIndex >= totalQuestions
    }
    
    var canContinue: Bool {
        return status == .active && currentQuestionIndex < totalQuestions
    }
    
    var difficulty: DifficultyLevel? {
        guard let level = difficultyLevel else { return nil }
        return DifficultyLevel.fromInt(level)
    }
}

enum SessionType: String, Codable {
    case solo = "solo"
    case multiplayer = "multiplayer"
}

enum SessionStatus: String, Codable {
    case active = "active"
    case completed = "completed"
    case abandoned = "abandoned"
    case expired = "expired"
    
    var displayName: String {
        switch self {
        case .active:
            return "In Progress"
        case .completed:
            return "Completed"
        case .abandoned:
            return "Abandoned"
        case .expired:
            return "Expired"
        }
    }
}

struct SessionProgress: Codable {
    let current: Int
    let total: Int
    let percentage: Int
}

// MARK: - Quiz Response Models

struct QuizStartResponse: Codable {
    let sessionId: String
    let status: SessionStatus
    let totalQuestions: Int
    let currentQuestionIndex: Int
    let score: Int
    let question: Question
    let progress: SessionProgress
}

struct AnswerSubmissionResponse: Codable {
    let sessionId: String
    let questionResult: QuestionResult
    let sessionProgress: SessionProgressUpdate
    let sessionComplete: Bool?
    let nextQuestion: Question?
    let progress: SessionProgress?
    let finalStats: SessionStats?
}

struct QuestionResult: Codable {
    let questionId: Int
    let userAnswer: String
    let correctAnswer: String
    let isCorrect: Bool
    let points: Int
    let explanation: String?
    let hint: String?
}

struct SessionProgressUpdate: Codable {
    let currentScore: Int
    let correctAnswers: Int
    let incorrectAnswers: Int
    let questionsCompleted: Int
    let totalQuestions: Int
    let percentage: Int
}

struct SessionStats: Codable {
    let sessionId: String
    let finalScore: Int
    let totalQuestions: Int
    let questionsAnswered: Int?
    let correctAnswers: Int
    let incorrectAnswers: Int
    let accuracy: Int
    let totalTimeSpent: Int
    let averageTimePerQuestion: Int
    let completedAt: Date
    let status: SessionStatus
    let progress: SessionProgress?
    let categoryBreakdown: [String: CategoryPerformance]?
    let difficultyBreakdown: [String: DifficultyPerformance]?
}

struct CategoryPerformance: Codable {
    let correct: Int
    let total: Int
    let percentage: Int
}

struct DifficultyPerformance: Codable {
    let correct: Int
    let total: Int
    let percentage: Int
}

// MARK: - Answer Tracking

struct UserAnswer {
    let questionId: Int
    let selectedAnswer: String
    let timeSpent: TimeInterval
    let submittedAt: Date
    
    var timeSpentSeconds: Int {
        Int(timeSpent.rounded())
    }
}

// MARK: - Quiz Configuration Response

struct QuizConfigResponse: Codable {
    let questionCounts: [Int]
    let difficulties: [DifficultyConfig]
    let sessionTypes: [SessionTypeConfig]
    let maxQuestionCount: Int
    let defaultQuestionCount: Int
    let timeouts: TimeoutConfig
}

struct DifficultyConfig: Codable {
    let value: Int
    let label: String
    let description: String
    
    var difficulty: DifficultyLevel? {
        return DifficultyLevel.fromInt(value)
    }
}

struct SessionTypeConfig: Codable {
    let value: String
    let label: String
    let description: String
}

struct TimeoutConfig: Codable {
    let maxSessionDuration: Int
    let maxQuestionTime: Int
    let defaultQuestionTime: Int
}

// MARK: - Local Game State

class GameState: ObservableObject {
    @Published var currentSession: GameSession?
    @Published var currentQuestion: Question?
    @Published var progress: SessionProgress?
    @Published var isLoading: Bool = false
    @Published var hasActiveSession: Bool = false
    
    // Question timing
    @Published var questionStartTime: Date?
    @Published var timeRemaining: Int = 30
    @Published var totalTimeForQuestion: Int = 30
    
    // User's current answer selection
    @Published var selectedAnswer: String?
    @Published var hasSubmittedAnswer: Bool = false
    
    // Session results
    @Published var lastQuestionResult: QuestionResult?
    @Published var sessionComplete: Bool = false
    @Published var finalStats: SessionStats?
    
    // Error handling
    @Published var errorMessage: String?
    @Published var showError: Bool = false
    
    func startQuestion(_ question: Question) {
        self.currentQuestion = question
        self.questionStartTime = Date()
        self.timeRemaining = question.timeLimit
        self.totalTimeForQuestion = question.timeLimit
        self.selectedAnswer = nil
        self.hasSubmittedAnswer = false
        self.lastQuestionResult = nil
        self.errorMessage = nil
        self.showError = false
        
        // Start countdown timer
        startTimer()
    }
    
    func selectAnswer(_ answer: String) {
        guard !hasSubmittedAnswer else { return }
        self.selectedAnswer = answer
    }
    
    func calculateTimeSpent() -> TimeInterval {
        guard let startTime = questionStartTime else { return 0 }
        return Date().timeIntervalSince(startTime)
    }
    
    func submitAnswer() {
        hasSubmittedAnswer = true
        stopTimer()
    }
    
    func reset() {
        stopTimer()
        currentSession = nil
        currentQuestion = nil
        progress = nil
        questionStartTime = nil
        timeRemaining = 30
        totalTimeForQuestion = 30
        selectedAnswer = nil
        hasSubmittedAnswer = false
        lastQuestionResult = nil
        sessionComplete = false
        finalStats = nil
        hasActiveSession = false
        errorMessage = nil
        showError = false
    }
    
    func showError(_ message: String) {
        self.errorMessage = message
        self.showError = true
    }
    
    // Timer management
    private var timer: Timer?
    
    private func startTimer() {
        stopTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if self.timeRemaining > 0 {
                    self.timeRemaining -= 1
                } else {
                    self.handleTimeUp()
                }
            }
        }
    }
    
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
    
    private func handleTimeUp() {
        stopTimer()
        if !hasSubmittedAnswer {
            // Auto-submit when time runs out
            hasSubmittedAnswer = true
            // The view layer should handle the actual submission
        }
    }
    
    deinit {
        stopTimer()
    }
}

// MARK: - Quiz Errors

enum QuizError: Error, LocalizedError {
    case noActiveSession
    case invalidConfiguration
    case networkError
    case sessionExpired
    case invalidQuestion
    case timeExpired
    case validationError(String)
    
    var errorDescription: String? {
        switch self {
        case .noActiveSession:
            return "No active quiz session found"
        case .invalidConfiguration:
            return "Invalid quiz configuration"
        case .networkError:
            return "Network error occurred"
        case .sessionExpired:
            return "Quiz session has expired"
        case .invalidQuestion:
            return "Invalid question data"
        case .timeExpired:
            return "Time limit exceeded"
        case .validationError(let message):
            return message
        }
    }
}