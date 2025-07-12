import Foundation
import Combine
import Network

// MARK: - API Response Wrapper
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let message: String
    let data: T
}

// MARK: - Quiz API Endpoints
extension APIEndpoint {
    case categories
    case questions(categoryId: String?, difficulty: Int?)
    case startSoloQuiz
    case submitAnswer(sessionId: String)
    case getSessionState(sessionId: String)
    case getNextQuestion(sessionId: String)
    case abandonSession(sessionId: String)
    case resumeSession
    case sessionHistory
    case sessionStats(sessionId: String)
    case quizConfig
    case leaderboard
    
    var quizPath: String {
        switch self {
        case .categories: 
            return "/categories"
        case .questions(let categoryId, let difficulty):
            var path = "/questions/quiz"
            var params: [String] = []
            if let categoryId = categoryId {
                params.append("categoryId=\(categoryId)")
            }
            if let difficulty = difficulty {
                params.append("difficultyLevel=\(difficulty)")
            }
            if !params.isEmpty {
                path += "?" + params.joined(separator: "&")
            }
            return path
        case .startSoloQuiz:
            return "/games/solo/start"
        case .submitAnswer(let sessionId):
            return "/games/\(sessionId)/answer"
        case .getSessionState(let sessionId):
            return "/games/\(sessionId)/state"
        case .getNextQuestion(let sessionId):
            return "/games/\(sessionId)/next-question"
        case .abandonSession(let sessionId):
            return "/games/\(sessionId)/abandon"
        case .resumeSession:
            return "/games/resume"
        case .sessionHistory:
            return "/games/sessions"
        case .sessionStats(let sessionId):
            return "/games/\(sessionId)/stats"
        case .quizConfig:
            return "/games/config"
        case .leaderboard:
            return "/games/leaderboard"
        }
    }
}

// MARK: - Quiz Service
class QuizService: ObservableObject {
    static let shared = QuizService()
    
    @Published var isOnline: Bool = true
    @Published var connectionStatus: NetworkConnectionStatus = .connected
    
    private let networkMonitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "NetworkMonitor")
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        startNetworkMonitoring()
    }
    
    deinit {
        stopNetworkMonitoring()
    }
    
    // MARK: - Network Monitoring
    private func startNetworkMonitoring() {
        networkMonitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isOnline = path.status == .satisfied
                self?.connectionStatus = path.status == .satisfied ? .connected : .disconnected
            }
        }
        networkMonitor.start(queue: monitorQueue)
    }
    
    private func stopNetworkMonitoring() {
        networkMonitor.cancel()
    }
    
    // MARK: - Categories
    func getCategories() -> AnyPublisher<[Category], QuizError> {
        // Try cache first
        if let cachedCategories = getCachedCategories() {
            return Just(cachedCategories)
                .setFailureType(to: QuizError.self)
                .eraseToAnyPublisher()
        }
        
        // If online, fetch from server
        guard isOnline else {
            return Fail(error: QuizError.offline)
                .eraseToAnyPublisher()
        }
        
        return makeWrappedRequest(
            endpoint: .categories,
            method: .GET,
            responseType: CategoriesResponse.self
        )
        .map { $0.categories }
        .handleEvents(receiveOutput: { [weak self] categories in
            self?.cacheCategories(categories)
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Questions  
    func getQuestions(categoryId: String? = nil, difficulty: Int? = nil) -> AnyPublisher<[Question], QuizError> {
        // Try cache first for offline capability
        if !isOnline {
            let cachedQuestions = getCachedQuestions(categoryId: categoryId, difficulty: difficulty)
            return Just(cachedQuestions)
                .setFailureType(to: QuizError.self)
                .eraseToAnyPublisher()
        }
        
        return makeWrappedRequest(
            endpoint: .questions(categoryId: categoryId, difficulty: difficulty),
            method: .GET,
            responseType: QuestionsResponse.self
        )
        .map { $0.questions }
        .handleEvents(receiveOutput: { [weak self] questions in
            self?.cacheQuestions(questions, categoryId: categoryId, difficulty: difficulty)
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Quiz Session Management
    func startSoloQuiz(config: QuizSessionConfig) -> AnyPublisher<GameSession, QuizError> {
        guard isOnline else {
            return startOfflineQuiz(config: config)
        }
        
        return makeWrappedRequest(
            endpoint: .startSoloQuiz,
            method: .POST,
            body: config,
            responseType: GameSession.self
        )
        .handleEvents(receiveOutput: { [weak self] session in
            self?.cacheSession(session)
        })
        .eraseToAnyPublisher()
    }
    
    func submitAnswer(sessionId: String, answer: UserAnswerWithMetadata) -> AnyPublisher<AnswerResponse, QuizError> {
        // If offline, queue for sync later
        if !isOnline {
            return submitOfflineAnswer(sessionId: sessionId, answer: answer)
        }
        
        return makeWrappedRequest(
            endpoint: .submitAnswer(sessionId: sessionId),
            method: .POST,
            body: answer.backendRequest,
            responseType: AnswerSubmissionResponse.self
        )
        .map { response in
            AnswerResponse(
                isCorrect: response.questionResult.isCorrect,
                correctAnswer: response.questionResult.correctAnswer,
                explanation: response.questionResult.explanation,
                points: response.questionResult.points,
                timeBonus: 0, // Calculate if needed
                totalScore: response.sessionProgress.currentScore
            )
        }
        .handleEvents(receiveOutput: { [weak self] response in
            self?.updateCachedSession(sessionId: sessionId, with: response)
        })
        .eraseToAnyPublisher()
    }
    
    func getSessionState(sessionId: String) -> AnyPublisher<GameSession, QuizError> {
        // Try cache first
        if let cachedSession = getCachedSession(sessionId: sessionId) {
            return Just(cachedSession)
                .setFailureType(to: QuizError.self)
                .eraseToAnyPublisher()
        }
        
        guard isOnline else {
            return Fail(error: QuizError.sessionNotFound)
                .eraseToAnyPublisher()
        }
        
        return makeRequest(
            endpoint: .getSessionState(sessionId: sessionId),
            method: .GET,
            responseType: GameSession.self
        )
    }
    
    func getNextQuestion(sessionId: String) -> AnyPublisher<Question, QuizError> {
        guard isOnline else {
            return getNextOfflineQuestion(sessionId: sessionId)
        }
        
        return makeRequest(
            endpoint: .getNextQuestion(sessionId: sessionId),
            method: .GET,
            responseType: Question.self
        )
    }
    
    func resumeActiveSession() -> AnyPublisher<GameSession?, QuizError> {
        // Check cache first for offline sessions
        if let activeSession = getActiveOfflineSession() {
            return Just(activeSession)
                .setFailureType(to: QuizError.self)
                .eraseToAnyPublisher()
        }
        
        guard isOnline else {
            return Just(nil)
                .setFailureType(to: QuizError.self)
                .eraseToAnyPublisher()
        }
        
        return makeRequest(
            endpoint: .resumeSession,
            method: .GET,
            responseType: GameSession?.self
        )
    }
    
    // MARK: - Configuration
    func getQuizConfig() -> AnyPublisher<QuizConfig, QuizError> {
        return makeRequest(
            endpoint: .quizConfig,
            method: .GET,
            responseType: QuizConfig.self
        )
    }
    
    // MARK: - Statistics
    func getSessionStats(sessionId: String) -> AnyPublisher<SessionStats, QuizError> {
        return makeRequest(
            endpoint: .sessionStats(sessionId: sessionId),
            method: .GET,
            responseType: SessionStats.self
        )
    }
    
    // MARK: - Background Sync
    func syncPendingData() -> AnyPublisher<Void, QuizError> {
        guard isOnline else {
            return Fail(error: QuizError.offline)
                .eraseToAnyPublisher()
        }
        
        return syncOfflineAnswers()
            .flatMap { [weak self] _ in
                self?.syncOfflineSessions() ?? Just(()).setFailureType(to: QuizError.self).eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - Private Network Helper
private extension QuizService {
    func makeWrappedRequest<T: Codable>(
        endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, QuizError> {
        
        let baseURL = "http://localhost:3000/api"
        guard let url = URL(string: baseURL + endpoint.quizPath) else {
            return Fail(error: QuizError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header if token exists
        if let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if provided
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                return Fail(error: QuizError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: APIResponse<T>.self, decoder: JSONDecoder.dateDecoder)
            .map { $0.data }
            .mapError { error in
                if error is DecodingError {
                    return QuizError.decodingError
                }
                if let urlError = error as? URLError {
                    switch urlError.code {
                    case .notConnectedToInternet, .networkConnectionLost:
                        return QuizError.offline
                    case .timedOut:
                        return QuizError.timeout
                    default:
                        return QuizError.networkError(urlError.localizedDescription)
                    }
                }
                return QuizError.networkError(error.localizedDescription)
            }
            .eraseToAnyPublisher()
    }
    
    func makeRequest<T: Codable>(
        endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, QuizError> {
        
        let baseURL = "http://localhost:3000/api"
        guard let url = URL(string: baseURL + endpoint.quizPath) else {
            return Fail(error: QuizError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header if token exists
        if let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if provided
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                return Fail(error: QuizError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: T.self, decoder: JSONDecoder.dateDecoder)
            .mapError { error in
                if error is DecodingError {
                    return QuizError.decodingError
                }
                if let urlError = error as? URLError {
                    switch urlError.code {
                    case .notConnectedToInternet, .networkConnectionLost:
                        return QuizError.offline
                    case .timedOut:
                        return QuizError.timeout
                    default:
                        return QuizError.networkError(urlError.localizedDescription)
                    }
                }
                return QuizError.networkError(error.localizedDescription)
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - Backend Response Models
struct CategoriesResponse: Codable {
    let categories: [Category]
    let count: Int
}

struct QuestionsResponse: Codable {
    let questions: [Question]
    let count: Int
    let hasMore: Bool
}

// MARK: - Offline Support
private extension QuizService {
    func getCachedCategories() -> [Category]? {
        let cached = CoreDataManager.shared.getCachedCategories()
        return cached.isEmpty ? nil : cached
    }
    
    func cacheCategories(_ categories: [Category]) {
        CoreDataManager.shared.cacheCategories(categories)
    }
    
    func getCachedQuestions(categoryId: String?, difficulty: Int?) -> [Question] {
        let config = QuizConfig(
            categoryId: categoryId.flatMap { Int($0) },
            difficultyLevel: difficulty,
            questionCount: 50
        )
        return CoreDataManager.shared.getCachedQuestions(for: config)
    }
    
    func cacheQuestions(_ questions: [Question], categoryId: String?, difficulty: Int?) {
        let config = QuizConfig(
            categoryId: categoryId.flatMap { Int($0) },
            difficultyLevel: difficulty,
            questionCount: questions.count
        )
        CoreDataManager.shared.cacheQuestions(questions, for: config)
    }
    
    func startOfflineQuiz(config: QuizSessionConfig) -> AnyPublisher<GameSession, QuizError> {
        // Create offline session using Quiz.swift GameSession
        let session = Quiz.GameSession(
            id: UUID().uuidString,
            userId: 1, // Use actual user ID from auth
            sessionType: .solo,
            status: .active,
            categoryId: config.categoryId.flatMap { Int($0) },
            difficultyLevel: config.difficulty,
            totalQuestions: config.questionCount,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            startedAt: Date(),
            completedAt: nil,
            totalTimeSpent: nil
        )
        
        CoreDataManager.shared.saveUserProgress(session)
        
        return Just(session)
            .setFailureType(to: QuizError.self)
            .eraseToAnyPublisher()
    }
    
    func submitOfflineAnswer(sessionId: String, answer: UserAnswerWithMetadata) -> AnyPublisher<AnswerResponse, QuizError> {
        // Simulate answer validation offline
        guard let question = getCachedQuestion(id: answer.questionId) else {
            return Fail(error: QuizError.questionNotFound)
                .eraseToAnyPublisher()
        }
        
        let isCorrect = answer.selectedAnswer == question.correctAnswer ?? ""
        let points = isCorrect ? question.points : 0
        
        let response = AnswerResponse(
            isCorrect: isCorrect,
            correctAnswer: question.correctAnswer ?? "",
            explanation: question.explanation,
            points: points,
            timeBonus: 0, // Calculate based on time if needed
            totalScore: 0 // Update with running total
        )
        
        // Queue for sync when online
        queueOfflineAnswer(sessionId: sessionId, answer: answer, response: response)
        
        return Just(response)
            .setFailureType(to: QuizError.self)
            .eraseToAnyPublisher()
    }
    
    func getNextOfflineQuestion(sessionId: String) -> AnyPublisher<Question, QuizError> {
        guard let session = getCachedSession(sessionId: sessionId),
              let config = session.config else {
            return Fail(error: QuizError.sessionNotFound)
                .eraseToAnyPublisher()
        }
        
        let questions = getCachedQuestions(
            categoryId: config.categoryId,
            difficulty: config.difficulty
        )
        
        guard session.currentQuestionIndex < questions.count else {
            return Fail(error: QuizError.noMoreQuestions)
                .eraseToAnyPublisher()
        }
        
        let question = questions[session.currentQuestionIndex]
        return Just(question)
            .setFailureType(to: QuizError.self)
            .eraseToAnyPublisher()
    }
    
    func getCachedSession(sessionId: String) -> GameSession? {
        return CoreDataManager.shared.getUserProgress(sessionId: sessionId)
    }
    
    func cacheSession(_ session: GameSession) {
        CoreDataManager.shared.saveUserProgress(session)
    }
    
    func updateCachedSession(sessionId: String, with response: AnswerResponse) {
        CoreDataManager.shared.updateSession(sessionId: sessionId, with: response)
    }
    
    func getActiveOfflineSession() -> GameSession? {
        return CoreDataManager.shared.getActiveSession()
    }
    
    func getCachedQuestion(id: String) -> Question? {
        return CoreDataManager.shared.getQuestion(id: id)
    }
    
    func queueOfflineAnswer(sessionId: String, answer: UserAnswerWithMetadata, response: AnswerResponse) {
        let userAnswer = Quiz.UserAnswer(
            questionId: Int(answer.questionId) ?? 0,
            selectedAnswer: answer.selectedAnswer,
            timeSpent: answer.timeSpent,
            submittedAt: answer.timestamp
        )
        CoreDataManager.shared.queueOfflineAnswer(sessionId: sessionId, answer: userAnswer, response: response)
    }
    
    func syncOfflineAnswers() -> AnyPublisher<Void, QuizError> {
        let offlineAnswers = CoreDataManager.shared.getPendingOfflineAnswers()
        
        let publishers = offlineAnswers.map { offlineAnswer in
            self.makeRequest(
                endpoint: .submitAnswer(sessionId: offlineAnswer.sessionId),
                method: .POST,
                body: offlineAnswer.answer,
                responseType: AnswerResponse.self
            )
            .handleEvents(receiveOutput: { _ in
                CoreDataManager.shared.markOfflineAnswerSynced(offlineAnswer.id)
            })
            .map { _ in () }
            .eraseToAnyPublisher()
        }
        
        return Publishers.MergeMany(publishers)
            .collect()
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    func syncOfflineSessions() -> AnyPublisher<Void, QuizError> {
        // Sync any locally created sessions with the server
        let offlineSessions = CoreDataManager.shared.getUnsyncedSessions()
        
        let publishers = offlineSessions.map { session in
            self.makeRequest(
                endpoint: .startSoloQuiz,
                method: .POST,
                body: session.config,
                responseType: GameSession.self
            )
            .handleEvents(receiveOutput: { serverSession in
                CoreDataManager.shared.updateSessionWithServerId(localId: session.id, serverSession: serverSession)
            })
            .map { _ in () }
            .eraseToAnyPublisher()
        }
        
        return Publishers.MergeMany(publishers)
            .collect()
            .map { _ in () }
            .eraseToAnyPublisher()
    }
}

// MARK: - Supporting Types
enum NetworkConnectionStatus {
    case connected
    case disconnected
    case unknown
}

enum QuizError: LocalizedError {
    case invalidURL
    case encodingError
    case decodingError
    case networkError(String)
    case offline
    case timeout
    case sessionNotFound
    case questionNotFound
    case noMoreQuestions
    case unauthorized
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .encodingError:
            return "Failed to encode request"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let message):
            return "Network error: \(message)"
        case .offline:
            return "You are currently offline. Some features may be limited."
        case .timeout:
            return "Request timed out"
        case .sessionNotFound:
            return "Quiz session not found"
        case .questionNotFound:
            return "Question not found"
        case .noMoreQuestions:
            return "No more questions available"
        case .unauthorized:
            return "You are not authorized to perform this action"
        case .serverError(let message):
            return "Server error: \(message)"
        }
    }
}

// MARK: - Request/Response Models
struct QuizSessionConfig: Codable {
    let categoryId: String?
    let difficulty: Int?
    let questionCount: Int
    let timeLimit: Int?
    let randomize: Bool
    
    init(categoryId: String? = nil, difficulty: Int? = nil, questionCount: Int = 10, timeLimit: Int? = nil, randomize: Bool = true) {
        self.categoryId = categoryId
        self.difficulty = difficulty
        self.questionCount = questionCount
        self.timeLimit = timeLimit
        self.randomize = randomize
    }
}

struct UserAnswer: Codable {
    let answer: String
    let timeSpent: Int?
    
    init(questionId: String, selectedAnswer: String, timeSpent: Double) {
        self.answer = selectedAnswer
        self.timeSpent = Int(timeSpent.rounded())
    }
}

struct UserAnswerWithMetadata {
    let questionId: String
    let selectedAnswer: String
    let timeSpent: Double
    let timestamp: Date
    
    init(questionId: String, selectedAnswer: String, timeSpent: Double) {
        self.questionId = questionId
        self.selectedAnswer = selectedAnswer
        self.timeSpent = timeSpent
        self.timestamp = Date()
    }
    
    var backendRequest: UserAnswer {
        UserAnswer(questionId: questionId, selectedAnswer: selectedAnswer, timeSpent: timeSpent)
    }
}

struct AnswerResponse: Codable {
    let isCorrect: Bool
    let correctAnswer: String
    let explanation: String?
    let points: Int
    let timeBonus: Int
    let totalScore: Int
}

struct SessionStats: Codable {
    let sessionId: String
    let totalQuestions: Int
    let correctAnswers: Int
    let totalScore: Int
    let accuracy: Double
    let averageTime: Double
    let categoryBreakdown: [String: CategoryStats]
    let difficultyBreakdown: [Int: DifficultyStats]
}

struct CategoryStats: Codable {
    let correct: Int
    let total: Int
    let accuracy: Double
}

struct DifficultyStats: Codable {
    let correct: Int
    let total: Int
    let accuracy: Double
    let averageTime: Double
}

struct QuizConfig: Codable {
    let maxQuestions: Int
    let timeLimit: TimeLimit
    let difficulties: [Int]
    let scoring: ScoringConfig
}

struct TimeLimit: Codable {
    let min: Int
    let max: Int
    let defaultValue: Int
}

struct ScoringConfig: Codable {
    let basePoints: Int
    let difficultyMultiplier: [Int: Double]
    let timeBonus: TimeBonusConfig
}

struct TimeBonusConfig: Codable {
    let fastThreshold: Double
    let bonusPercentage: Double
    let penaltyThreshold: Double
    let penaltyPercentage: Double
}