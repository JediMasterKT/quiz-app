import Foundation
import Combine

class QuizGameState: ObservableObject {
    @Published var session: GameSession
    @Published var currentScore: Int = 0
    @Published var currentQuestionIndex: Int = 0
    @Published var timeRemaining: Double = 30.0
    @Published var isTimerActive: Bool = false
    @Published var showHint: Bool = false
    
    private var questionStartTime: Date?
    private var timer: Timer?
    var cancellables = Set<AnyCancellable>()
    
    let totalQuestions: Int
    
    init(session: GameSession) {
        self.session = session
        self.currentScore = session.score
        self.currentQuestionIndex = session.currentQuestionIndex
        self.totalQuestions = session.totalQuestions
    }
    
    deinit {
        stopTimer()
    }
    
    // MARK: - Timer Management
    func startQuestionTimer() {
        questionStartTime = Date()
        timeRemaining = 30.0 // Default time limit
        isTimerActive = true
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                self?.updateTimer()
            }
        }
    }
    
    func stopTimer() {
        timer?.invalidate()
        timer = nil
        isTimerActive = false
    }
    
    private func updateTimer() {
        guard isTimerActive, let startTime = questionStartTime else { return }
        
        let elapsed = Date().timeIntervalSince(startTime)
        let totalTime = 30.0 // Default time limit
        timeRemaining = max(0, totalTime - elapsed)
        
        if timeRemaining <= 0 {
            stopTimer()
            // Timer expired - notify views
        }
    }
    
    // MARK: - Game State
    var progressPercentage: Double {
        return Double(currentQuestionIndex) / Double(totalQuestions)
    }
    
    var timeRemainingPercentage: Double {
        let totalTime = 30.0 // Default time limit
        return timeRemaining / totalTime
    }
    
    var questionTimeSpent: Double {
        guard let startTime = questionStartTime else { return 0 }
        return Date().timeIntervalSince(startTime)
    }
    
    var isQuizCompleted: Bool {
        return currentQuestionIndex >= totalQuestions
    }
    
    var isLastQuestion: Bool {
        return currentQuestionIndex == totalQuestions - 1
    }
    
    // MARK: - Actions
    func moveToNextQuestion() {
        currentQuestionIndex += 1
        showHint = false
    }
    
    func updateScore(_ newScore: Int) {
        currentScore = newScore
    }
    
    func toggleHint() {
        showHint.toggle()
    }
}

// MARK: - QuizGameState uses models from Quiz.swift
// All model definitions moved to Quiz.swift for consistency