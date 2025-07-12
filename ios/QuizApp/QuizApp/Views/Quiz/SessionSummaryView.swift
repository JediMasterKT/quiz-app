import SwiftUI

struct SessionSummaryView: View {
    let session: GameSession
    @StateObject private var quizService = QuizService.shared
    @State private var sessionStats: SessionStats?
    @State private var isLoading = true
    @State private var showingShareSheet = false
    @State private var shareText = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Header with celebration
                        VStack(spacing: 16) {
                            // Celebration icon
                            Image(systemName: celebrationIcon)
                                .font(.system(size: 80))
                                .foregroundColor(performanceColor)
                            
                            Text("Quiz Complete!")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            Text(performanceMessage)
                                .font(.title3)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.top, 20)
                        
                        // Main score card
                        scoreCard
                        
                        if isLoading {
                            ProgressView("Loading detailed stats...")
                                .padding()
                        } else {
                            // Detailed statistics
                            if let stats = sessionStats {
                                detailedStatsView(stats: stats)
                            }
                            
                            // Performance breakdown
                            performanceBreakdownView
                        }
                        
                        // Action buttons
                        actionButtonsView
                        
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationTitle("Quiz Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: shareResults) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
        }
        .onAppear {
            loadDetailedStats()
            generateShareText()
        }
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(items: [shareText])
        }
    }
    
    // MARK: - Score Card
    private var scoreCard: some View {
        VStack(spacing: 16) {
            // Final score
            VStack(spacing: 8) {
                Text("Final Score")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                Text("\(session.score)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(performanceColor)
            }
            
            // Key metrics
            HStack(spacing: 20) {
                StatItem(
                    title: "Accuracy",
                    value: "\(Int(accuracy))%",
                    icon: "target",
                    color: .blue
                )
                
                StatItem(
                    title: "Questions",
                    value: "\(session.answers.count)/\(totalQuestions)",
                    icon: "questionmark.circle",
                    color: .orange
                )
                
                StatItem(
                    title: "Time",
                    value: formattedDuration,
                    icon: "clock",
                    color: .green
                )
            }
        }
        .padding(.vertical, 24)
        .padding(.horizontal, 20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 12, x: 0, y: 6)
        )
    }
    
    // MARK: - Detailed Stats View
    private func detailedStatsView(stats: SessionStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Performance Breakdown")
                .font(.headline)
                .fontWeight(.semibold)
            
            // Category breakdown
            if !stats.categoryBreakdown.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("By Category")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(Array(stats.categoryBreakdown.keys.sorted()), id: \.self) { category in
                        if let categoryStats = stats.categoryBreakdown[category] {
                            CategoryPerformanceRow(
                                category: category,
                                stats: categoryStats
                            )
                        }
                    }
                }
            }
            
            // Difficulty breakdown
            if !stats.difficultyBreakdown.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("By Difficulty")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    ForEach(Array(stats.difficultyBreakdown.keys.sorted()), id: \.self) { difficulty in
                        if let difficultyStats = stats.difficultyBreakdown[difficulty] {
                            DifficultyPerformanceRow(
                                difficulty: difficulty,
                                stats: difficultyStats
                            )
                        }
                    }
                }
            }
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
    
    // MARK: - Performance Breakdown
    private var performanceBreakdownView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Session Analysis")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                PerformanceMetricRow(
                    label: "Correct Answers",
                    value: "\(correctAnswers) out of \(session.answers.count)",
                    percentage: accuracy / 100,
                    color: .green
                )
                
                PerformanceMetricRow(
                    label: "Average Time per Question",
                    value: formattedAverageTime,
                    percentage: nil,
                    color: .blue
                )
                
                if let config = session.config {
                    PerformanceMetricRow(
                        label: "Difficulty Level",
                        value: difficultyName(config.difficulty ?? 3),
                        percentage: nil,
                        color: difficultyColor(config.difficulty ?? 3)
                    )
                }
            }
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
    
    // MARK: - Action Buttons
    private var actionButtonsView: some View {
        VStack(spacing: 12) {
            // Play again button
            Button(action: playAgain) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Play Again")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            
            HStack(spacing: 12) {
                // New category button
                Button(action: newCategory) {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("New Category")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                
                // View leaderboard button
                Button(action: viewLeaderboard) {
                    HStack {
                        Image(systemName: "trophy")
                        Text("Leaderboard")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    private var correctAnswers: Int {
        session.answers.count { $0.isCorrect }
    }
    
    private var totalQuestions: Int {
        session.config?.questionCount ?? session.answers.count
    }
    
    private var accuracy: Double {
        guard !session.answers.isEmpty else { return 0 }
        return Double(correctAnswers) / Double(session.answers.count) * 100
    }
    
    private var performanceColor: Color {
        switch accuracy {
        case 90...100: return .green
        case 75..<90: return .blue
        case 60..<75: return .orange
        default: return .red
        }
    }
    
    private var celebrationIcon: String {
        switch accuracy {
        case 90...100: return "trophy.fill"
        case 75..<90: return "star.fill"
        case 60..<75: return "hand.thumbsup.fill"
        default: return "lightbulb.fill"
        }
    }
    
    private var performanceMessage: String {
        switch accuracy {
        case 90...100: return "Outstanding performance! You're a quiz master!"
        case 75..<90: return "Great job! You really know your stuff!"
        case 60..<75: return "Good work! Keep practicing to improve!"
        default: return "Don't give up! Every expert was once a beginner."
        }
    }
    
    private var formattedDuration: String {
        guard let startedAt = session.startedAt,
              let completedAt = session.completedAt else {
            return "Unknown"
        }
        
        let duration = completedAt.timeIntervalSince(startedAt)
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return "\(minutes):\(String(format: "%02d", seconds))"
    }
    
    private var formattedAverageTime: String {
        guard !session.answers.isEmpty else { return "N/A" }
        
        let totalTime = session.answers.reduce(0) { $0 + $1.timeSpent }
        let averageTime = totalTime / Double(session.answers.count)
        return String(format: "%.1fs", averageTime)
    }
    
    // MARK: - Methods
    private func loadDetailedStats() {
        quizService.getSessionStats(sessionId: session.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                },
                receiveValue: { stats in
                    sessionStats = stats
                    isLoading = false
                }
            )
            .store(in: &quizService.cancellables)
    }
    
    private func generateShareText() {
        shareText = """
        🎯 Quiz Results
        
        Score: \(session.score) points
        Accuracy: \(Int(accuracy))%
        Questions: \(correctAnswers)/\(session.answers.count) correct
        
        \(performanceMessage)
        
        Try the quiz yourself!
        """
    }
    
    private func shareResults() {
        showingShareSheet = true
    }
    
    private func playAgain() {
        // Dismiss and restart with same settings
        presentationMode.wrappedValue.dismiss()
        // Implementation would restart quiz with same config
    }
    
    private func newCategory() {
        // Dismiss and go to category selection
        presentationMode.wrappedValue.dismiss()
        // Implementation would show category selection
    }
    
    private func viewLeaderboard() {
        // Show leaderboard view
        // Implementation would show leaderboard
    }
    
    private func difficultyName(_ level: Int) -> String {
        switch level {
        case 1: return "Beginner"
        case 2: return "Easy"
        case 3: return "Medium"
        case 4: return "Hard"
        case 5: return "Expert"
        default: return "Unknown"
        }
    }
    
    private func difficultyColor(_ level: Int) -> Color {
        switch level {
        case 1: return .green
        case 2: return .blue
        case 3: return .orange
        case 4: return .red
        case 5: return .purple
        default: return .gray
        }
    }
}

// MARK: - Supporting Views
struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct CategoryPerformanceRow: View {
    let category: String
    let stats: CategoryStats
    
    var body: some View {
        HStack {
            Text(category.capitalized)
                .font(.body)
                .foregroundColor(.primary)
            
            Spacer()
            
            Text("\(stats.correct)/\(stats.total)")
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Text("\(Int(stats.accuracy))%")
                .font(.body)
                .fontWeight(.semibold)
                .foregroundColor(stats.accuracy >= 75 ? .green : .orange)
                .frame(width: 50, alignment: .trailing)
        }
        .padding(.vertical, 4)
    }
}

struct DifficultyPerformanceRow: View {
    let difficulty: Int
    let stats: DifficultyStats
    
    var body: some View {
        HStack {
            HStack {
                ForEach(1...5, id: \.self) { level in
                    Circle()
                        .fill(level <= difficulty ? difficultyColor : Color(.systemGray4))
                        .frame(width: 6, height: 6)
                }
                Text(difficultyName)
                    .font(.body)
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            Text("\(stats.correct)/\(stats.total)")
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Text("\(Int(stats.accuracy))%")
                .font(.body)
                .fontWeight(.semibold)
                .foregroundColor(stats.accuracy >= 75 ? .green : .orange)
                .frame(width: 50, alignment: .trailing)
        }
        .padding(.vertical, 4)
    }
    
    private var difficultyColor: Color {
        switch difficulty {
        case 1: return .green
        case 2: return .blue
        case 3: return .orange
        case 4: return .red
        case 5: return .purple
        default: return .gray
        }
    }
    
    private var difficultyName: String {
        switch difficulty {
        case 1: return "Beginner"
        case 2: return "Easy"
        case 3: return "Medium"
        case 4: return "Hard"
        case 5: return "Expert"
        default: return "Unknown"
        }
    }
}

struct PerformanceMetricRow: View {
    let label: String
    let value: String
    let percentage: Double?
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.body)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(value)
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
            
            if let percentage = percentage {
                ProgressView(value: percentage)
                    .progressViewStyle(LinearProgressViewStyle(tint: color))
                    .scaleEffect(x: 1, y: 1.5, anchor: .center)
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    SessionSummaryView(
        session: GameSession(
            id: "preview",
            userId: "user1",
            sessionType: .solo,
            status: .completed,
            config: QuizSessionConfig(categoryId: "1", difficulty: 3, questionCount: 10),
            questions: [],
            currentQuestionIndex: 10,
            answers: Array(repeating: UserQuizAnswer(
                questionId: "1",
                selectedAnswer: "A",
                correctAnswer: "A",
                isCorrect: true,
                timeSpent: 15.5,
                points: 100
            ), count: 8) + Array(repeating: UserQuizAnswer(
                questionId: "2",
                selectedAnswer: "B",
                correctAnswer: "A",
                isCorrect: false,
                timeSpent: 25.0,
                points: 0
            ), count: 2),
            score: 800,
            startedAt: Date().addingTimeInterval(-300),
            completedAt: Date()
        )
    )
}