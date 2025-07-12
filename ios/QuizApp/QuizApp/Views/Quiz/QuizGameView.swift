import SwiftUI
import Combine

struct QuizGameView: View {
    @StateObject private var gameState: QuizGameState
    @StateObject private var quizService = QuizService.shared
    @Environment(\.presentationMode) var presentationMode
    
    @State private var showingExitAlert = false
    @State private var showingSessionSummary = false
    @State private var currentQuestion: Question?
    @State private var selectedAnswer: String?
    @State private var showingAnswerFeedback = false
    @State private var answerResponse: AnswerResponse?
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    
    init(session: GameSession) {
        _gameState = StateObject(wrappedValue: QuizGameState(session: session))
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header with progress and timer
                    headerView
                    
                    if let question = currentQuestion {
                        // Question content
                        questionView(question: question)
                        
                        Spacer()
                        
                        // Answer options
                        answerOptionsView(question: question)
                        
                        // Submit button
                        submitButtonView
                    } else {
                        // Loading state
                        Spacer()
                        VStack(spacing: 16) {
                            ProgressView()
                                .scaleEffect(1.5)
                            Text("Loading question...")
                                .font(.headline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    }
                    
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                            .padding(.bottom, 10)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .onAppear {
            loadNextQuestion()
        }
        .alert("Exit Quiz?", isPresented: $showingExitAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Exit", role: .destructive) {
                presentationMode.wrappedValue.dismiss()
            }
        } message: {
            Text("Your progress will be saved, but you'll need to restart the quiz.")
        }
        .fullScreenCover(isPresented: $showingAnswerFeedback) {
            if let response = answerResponse, let question = currentQuestion {
                AnswerFeedbackView(
                    question: question,
                    userAnswer: selectedAnswer ?? "",
                    response: response,
                    gameState: gameState,
                    onContinue: handleContinueAfterFeedback
                )
            }
        }
        .fullScreenCover(isPresented: $showingSessionSummary) {
            SessionSummaryView(session: gameState.session)
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 12) {
            // Progress bar
            HStack {
                Button(action: { showingExitAlert = true }) {
                    Image(systemName: "xmark")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Question counter
                Text("\(gameState.currentQuestionIndex + 1) of \(gameState.totalQuestions)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Score
                Text("Score: \(gameState.currentScore)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
            
            // Progress bar
            ProgressView(value: gameState.progressPercentage, total: 1.0)
                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                .scaleEffect(x: 1, y: 2, anchor: .center)
            
            // Timer
            HStack {
                Image(systemName: "timer")
                    .foregroundColor(timerColor)
                Text(timeRemainingText)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(timerColor)
                    .monospacedDigit()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(timerColor.opacity(0.1))
            .cornerRadius(20)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    // MARK: - Question View
    private func questionView(question: Question) -> some View {
        VStack(spacing: 16) {
            // Difficulty indicator
            HStack {
                Spacer()
                DifficultyBadge(level: question.difficultyLevel)
            }
            
            // Question text
            VStack(alignment: .leading, spacing: 12) {
                Text(question.questionText)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .multilineTextAlignment(.leading)
                    .lineSpacing(4)
                
                // Question image if available
                if let imageUrl = question.imageUrl, !imageUrl.isEmpty {
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .cornerRadius(12)
                    } placeholder: {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(.systemGray5))
                            .frame(height: 200)
                            .overlay(
                                ProgressView()
                            )
                    }
                    .frame(maxHeight: 250)
                }
                
                // Question hint if available
                if let hint = question.hint, !hint.isEmpty, gameState.showHint {
                    HStack {
                        Image(systemName: "lightbulb")
                            .foregroundColor(.yellow)
                        Text(hint)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .italic()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.yellow.opacity(0.1))
                    .cornerRadius(8)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    // MARK: - Answer Options View
    private func answerOptionsView(question: Question) -> some View {
        VStack(spacing: 12) {
            ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                AnswerOptionButton(
                    text: option,
                    letter: String(Character(UnicodeScalar(65 + index)!)), // A, B, C, D
                    isSelected: selectedAnswer == option,
                    isDisabled: isSubmitting
                ) {
                    selectedAnswer = option
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Submit Button View
    private var submitButtonView: some View {
        Button(action: submitAnswer) {
            HStack {
                if isSubmitting {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "checkmark")
                }
                Text(isSubmitting ? "Submitting..." : "Submit Answer")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(selectedAnswer != nil ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(selectedAnswer == nil || isSubmitting)
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Computed Properties
    private var timerColor: Color {
        let percentage = gameState.timeRemainingPercentage
        if percentage > 0.5 {
            return .green
        } else if percentage > 0.25 {
            return .orange
        } else {
            return .red
        }
    }
    
    private var timeRemainingText: String {
        let time = Int(gameState.timeRemaining)
        let minutes = time / 60
        let seconds = time % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    // MARK: - Methods
    private func loadNextQuestion() {
        guard !gameState.isQuizCompleted else {
            showingSessionSummary = true
            return
        }
        
        selectedAnswer = nil
        errorMessage = nil
        
        quizService.getNextQuestion(sessionId: gameState.session.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { question in
                    currentQuestion = question
                    gameState.startQuestionTimer()
                }
            )
            .store(in: &gameState.cancellables)
    }
    
    private func submitAnswer() {
        guard let answer = selectedAnswer,
              let question = currentQuestion else { return }
        
        isSubmitting = true
        errorMessage = nil
        
        let userAnswer = UserAnswer(
            questionId: question.id,
            selectedAnswer: answer,
            timeSpent: gameState.questionTimeSpent
        )
        
        quizService.submitAnswer(sessionId: gameState.session.id, answer: userAnswer)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isSubmitting = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { response in
                    isSubmitting = false
                    answerResponse = response
                    gameState.updateScore(response.totalScore)
                    gameState.stopTimer()
                    showingAnswerFeedback = true
                }
            )
            .store(in: &gameState.cancellables)
    }
    
    private func handleContinueAfterFeedback() {
        gameState.moveToNextQuestion()
        answerResponse = nil
        
        if gameState.isQuizCompleted {
            showingSessionSummary = true
        } else {
            loadNextQuestion()
        }
    }
}

// MARK: - Supporting Views
struct DifficultyBadge: View {
    let level: Int
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...5, id: \.self) { index in
                Circle()
                    .fill(index <= level ? difficultyColor : Color(.systemGray4))
                    .frame(width: 8, height: 8)
            }
            Text(difficultyText)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(difficultyColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(difficultyColor.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var difficultyColor: Color {
        switch level {
        case 1: return .green
        case 2: return .blue
        case 3: return .orange
        case 4: return .red
        case 5: return .purple
        default: return .gray
        }
    }
    
    private var difficultyText: String {
        switch level {
        case 1: return "Beginner"
        case 2: return "Easy"
        case 3: return "Medium"
        case 4: return "Hard"
        case 5: return "Expert"
        default: return "Unknown"
        }
    }
}

struct AnswerOptionButton: View {
    let text: String
    let letter: String
    let isSelected: Bool
    let isDisabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Letter indicator
                Text(letter)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(width: 30, height: 30)
                    .background(
                        Circle()
                            .fill(isSelected ? Color.blue : Color.blue.opacity(0.1))
                    )
                
                // Answer text
                Text(text)
                    .font(.body)
                    .multilineTextAlignment(.leading)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.blue : Color(.systemGray4), lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.6 : 1.0)
    }
}

#Preview {
    QuizGameView(
        session: GameSession(
            id: "preview",
            userId: "user1",
            sessionType: .solo,
            status: .active,
            config: QuizSessionConfig(categoryId: "1", difficulty: 3, questionCount: 10),
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            score: 0,
            startedAt: Date(),
            completedAt: nil
        )
    )
}