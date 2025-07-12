import SwiftUI

struct AnswerFeedbackView: View {
    let question: Question
    let userAnswer: String
    let response: AnswerResponse
    let gameState: QuizGameState
    let onContinue: () -> Void
    
    @State private var showingExplanation = false
    @State private var animateScore = false
    
    var body: some View {
        ZStack {
            // Background with result color
            LinearGradient(
                gradient: Gradient(colors: resultColors),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 24) {
                Spacer()
                
                // Result icon and text
                VStack(spacing: 16) {
                    // Large result icon with animation
                    Image(systemName: response.isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(response.isCorrect ? .green : .red)
                        .scaleEffect(animateScore ? 1.2 : 1.0)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: animateScore)
                    
                    // Result text
                    Text(response.isCorrect ? "Correct!" : "Incorrect")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    // Points earned
                    if response.points > 0 {
                        HStack {
                            Text("+\(response.points)")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                            Text("points")
                                .font(.title3)
                                .foregroundColor(.secondary)
                        }
                        .scaleEffect(animateScore ? 1.1 : 1.0)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.2), value: animateScore)
                    }
                    
                    // Time bonus if applicable
                    if response.timeBonus > 0 {
                        HStack {
                            Image(systemName: "bolt.fill")
                                .foregroundColor(.yellow)
                            Text("Speed Bonus: +\(response.timeBonus)")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.yellow)
                        }
                        .scaleEffect(animateScore ? 1.1 : 1.0)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.4), value: animateScore)
                    }
                }
                
                // Answer details
                VStack(alignment: .leading, spacing: 16) {
                    // Question (abbreviated)
                    Text(question.questionText)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                        .padding(.horizontal, 20)
                    
                    // Answer comparison
                    VStack(spacing: 12) {
                        // User's answer
                        AnswerComparisonRow(
                            label: "Your Answer:",
                            answer: userAnswer,
                            isCorrect: response.isCorrect,
                            isUserAnswer: true
                        )
                        
                        // Correct answer (if user was wrong)
                        if !response.isCorrect {
                            AnswerComparisonRow(
                                label: "Correct Answer:",
                                answer: response.correctAnswer,
                                isCorrect: true,
                                isUserAnswer: false
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.vertical, 20)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                )
                .padding(.horizontal, 20)
                
                // Explanation section
                if let explanation = response.explanation, !explanation.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Button(action: { 
                            withAnimation(.easeInOut(duration: 0.3)) {
                                showingExplanation.toggle()
                            }
                        }) {
                            HStack {
                                Image(systemName: "lightbulb")
                                    .foregroundColor(.orange)
                                Text("Explanation")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                Spacer()
                                Image(systemName: showingExplanation ? "chevron.up" : "chevron.down")
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.orange.opacity(0.1))
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        if showingExplanation {
                            Text(explanation)
                                .font(.body)
                                .foregroundColor(.primary)
                                .multilineTextAlignment(.leading)
                                .padding(.horizontal, 20)
                                .padding(.bottom, 16)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color(.systemBackground))
                                )
                                .transition(.opacity.combined(with: .scale))
                        }
                    }
                    .padding(.horizontal, 20)
                }
                
                Spacer()
                
                // Progress indicator
                VStack(spacing: 8) {
                    HStack {
                        Text("Question \(gameState.currentQuestionIndex + 1) of \(gameState.totalQuestions)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("Score: \(response.totalScore)")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                    }
                    
                    ProgressView(value: Double(gameState.currentQuestionIndex + 1), total: Double(gameState.totalQuestions))
                        .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                        .scaleEffect(x: 1, y: 2, anchor: .center)
                }
                .padding(.horizontal, 20)
                
                // Continue button
                Button(action: {
                    onContinue()
                }) {
                    HStack {
                        Text(gameState.isLastQuestion ? "Finish Quiz" : "Next Question")
                            .fontWeight(.semibold)
                        if !gameState.isLastQuestion {
                            Image(systemName: "arrow.right")
                        } else {
                            Image(systemName: "flag.checkered")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
        }
        .onAppear {
            // Trigger animations
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6)) {
                animateScore = true
            }
        }
    }
    
    private var resultColors: [Color] {
        if response.isCorrect {
            return [Color.green.opacity(0.1), Color.blue.opacity(0.1)]
        } else {
            return [Color.red.opacity(0.1), Color.orange.opacity(0.1)]
        }
    }
}

struct AnswerComparisonRow: View {
    let label: String
    let answer: String
    let isCorrect: Bool
    let isUserAnswer: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(isCorrect ? .green : .red)
                .font(.title2)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Text(answer)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
            }
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isCorrect ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
        )
    }
}

#Preview {
    AnswerFeedbackView(
        question: Question(
            id: "1",
            categoryId: "science",
            questionText: "What is the chemical symbol for gold?",
            questionType: .multipleChoice,
            options: ["Au", "Ag", "Fe", "Cu"],
            correctAnswer: "Au",
            explanation: "Au comes from the Latin word 'aurum' meaning gold.",
            difficultyLevel: 2,
            imageUrl: nil,
            timeLimit: 30,
            points: 100,
            hint: "Think about the periodic table",
            usageCount: 0,
            successRate: 0.0
        ),
        userAnswer: "Au",
        response: AnswerResponse(
            isCorrect: true,
            correctAnswer: "Au",
            explanation: "Au comes from the Latin word 'aurum' meaning gold.",
            points: 100,
            timeBonus: 20,
            totalScore: 120
        ),
        gameState: QuizGameState(session: GameSession(
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
        )),
        onContinue: {}
    )
}