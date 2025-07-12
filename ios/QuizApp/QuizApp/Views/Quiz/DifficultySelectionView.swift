import SwiftUI

struct DifficultySelectionView: View {
    let category: QuizCategory
    @StateObject private var quizService = QuizService.shared
    @State private var selectedDifficulty: Int = 3
    @State private var questionCount: Int = 10
    @State private var timeLimit: Int = 30
    @State private var randomizeQuestions: Bool = true
    @State private var isStartingQuiz = false
    @State private var showingQuizView = false
    @State private var quizSession: GameSession?
    @State private var errorMessage: String?
    @Environment(\.presentationMode) var presentationMode
    
    private let difficulties: [(level: Int, name: String, description: String, color: Color)] = [
        (1, "Beginner", "Easy questions to get started", .green),
        (2, "Easy", "Simple questions with basic concepts", .blue),
        (3, "Medium", "Balanced difficulty for most players", .orange),
        (4, "Hard", "Challenging questions for experts", .red),
        (5, "Expert", "Only for true masters", .purple)
    ]
    
    private let questionCounts = [5, 10, 15, 20, 25]
    private let timeLimits = [15, 30, 45, 60, 90, 120] // seconds per question
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    gradient: Gradient(colors: [categoryColor.opacity(0.1), categoryColor.opacity(0.05)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Header
                        VStack(spacing: 8) {
                            Text(category.name)
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            Text("Configure your quiz settings")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            if let description = category.description {
                                Text(description)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.top, 4)
                            }
                        }
                        .padding(.top, 20)
                        
                        // Connection status
                        if !quizService.isOnline {
                            HStack {
                                Image(systemName: "wifi.slash")
                                    .foregroundColor(.orange)
                                Text("Offline Mode - Limited questions available")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(16)
                        }
                        
                        // Difficulty Selection
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Difficulty Level")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            VStack(spacing: 8) {
                                ForEach(difficulties, id: \.level) { difficulty in
                                    DifficultyCard(
                                        difficulty: difficulty,
                                        isSelected: selectedDifficulty == difficulty.level
                                    ) {
                                        selectedDifficulty = difficulty.level
                                    }
                                }
                            }
                        }
                        
                        // Question Count
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Number of Questions")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            HStack(spacing: 12) {
                                ForEach(questionCounts, id: \.self) { count in
                                    Button("\(count)") {
                                        questionCount = count
                                    }
                                    .frame(width: 50, height: 40)
                                    .background(questionCount == count ? categoryColor : Color(.systemGray5))
                                    .foregroundColor(questionCount == count ? .white : .primary)
                                    .cornerRadius(8)
                                    .fontWeight(.semibold)
                                }
                                Spacer()
                            }
                        }
                        
                        // Time Limit
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Time per Question")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(timeLimits, id: \.self) { limit in
                                        Button("\(limit)s") {
                                            timeLimit = limit
                                        }
                                        .frame(width: 60, height: 40)
                                        .background(timeLimit == limit ? categoryColor : Color(.systemGray5))
                                        .foregroundColor(timeLimit == limit ? .white : .primary)
                                        .cornerRadius(8)
                                        .fontWeight(.semibold)
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                        }
                        
                        // Quiz Options
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Options")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Toggle("Randomize Questions", isOn: $randomizeQuestions)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        }
                        
                        // Quiz Summary
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Quiz Summary")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            VStack(spacing: 4) {
                                HStack {
                                    Text("Category:")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(category.name)
                                        .fontWeight(.medium)
                                }
                                
                                HStack {
                                    Text("Difficulty:")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(difficulties.first { $0.level == selectedDifficulty }?.name ?? "Medium")
                                        .fontWeight(.medium)
                                }
                                
                                HStack {
                                    Text("Questions:")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text("\(questionCount)")
                                        .fontWeight(.medium)
                                }
                                
                                HStack {
                                    Text("Estimated Time:")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text("\(estimatedTime)")
                                        .fontWeight(.medium)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                        
                        // Error message
                        if let errorMessage = errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 20)
                        }
                        
                        // Start Quiz Button
                        Button(action: startQuiz) {
                            HStack {
                                if isStartingQuiz {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "play.fill")
                                }
                                Text(isStartingQuiz ? "Starting Quiz..." : "Start Quiz")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(categoryColor)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(isStartingQuiz)
                        .padding(.top, 8)
                        
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationTitle("Quiz Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showingQuizView) {
            if let session = quizSession {
                QuizGameView(session: session)
            }
        }
    }
    
    private var categoryColor: Color {
        if let colorCode = category.colorCode {
            return Color(hex: colorCode) ?? .blue
        }
        return .blue
    }
    
    private var estimatedTime: String {
        let totalSeconds = questionCount * timeLimit
        let minutes = totalSeconds / 60
        let seconds = totalSeconds % 60
        
        if minutes > 0 {
            return seconds > 0 ? "\(minutes)m \(seconds)s" : "\(minutes)m"
        } else {
            return "\(seconds)s"
        }
    }
    
    private func startQuiz() {
        isStartingQuiz = true
        errorMessage = nil
        
        let config = QuizSessionConfig(
            categoryId: category.id,
            difficulty: selectedDifficulty,
            questionCount: questionCount,
            timeLimit: timeLimit,
            randomize: randomizeQuestions
        )
        
        quizService.startSoloQuiz(config: config)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isStartingQuiz = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { session in
                    isStartingQuiz = false
                    quizSession = session
                    showingQuizView = true
                }
            )
            .store(in: &quizService.cancellables)
    }
}

struct DifficultyCard: View {
    let difficulty: (level: Int, name: String, description: String, color: Color)
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Difficulty indicator
                ZStack {
                    Circle()
                        .fill(difficulty.color.opacity(0.2))
                        .frame(width: 40, height: 40)
                    
                    Text("\(difficulty.level)")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(difficulty.color)
                }
                
                // Difficulty info
                VStack(alignment: .leading, spacing: 2) {
                    Text(difficulty.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Text(difficulty.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Selection indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(difficulty.color)
                        .font(.title2)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? difficulty.color.opacity(0.1) : Color(.systemGray6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? difficulty.color : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    DifficultySelectionView(
        category: QuizCategory(
            id: "1",
            name: "Science",
            description: "Test your knowledge of scientific concepts",
            iconUrl: nil,
            colorCode: "#007AFF",
            questionCount: 50,
            displayOrder: 1,
            isActive: true
        )
    )
}