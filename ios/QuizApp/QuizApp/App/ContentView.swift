import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: authService.isAuthenticated)
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            QuizHomeView()
                .tabItem {
                    Image(systemName: "questionmark.circle")
                    Text("Quiz")
                }
            
            MultiplayerView()
                .tabItem {
                    Image(systemName: "person.3")
                    Text("Multiplayer")
                }
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Profile")
                }
        }
    }
}

// Placeholder views for tabs
struct QuizHomeView: View {
    @StateObject private var quizService = QuizService.shared
    @State private var showingCategorySelection = false
    @State private var hasActiveSession = false
    @State private var activeSession: GameSession?
    @State private var showingQuizGame = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                    
                    Text("Quiz Challenge")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Test your knowledge and improve your skills")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)
                
                // Connection status
                if !quizService.isOnline {
                    HStack {
                        Image(systemName: "wifi.slash")
                            .foregroundColor(.orange)
                        Text("Offline Mode - Limited features available")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(16)
                }
                
                // Active session card
                if let session = activeSession {
                    ActiveSessionCard(session: session)
                }
                
                Spacer()
                
                // Main action buttons
                VStack(spacing: 16) {
                    Button(action: {
                        showingCategorySelection = true
                    }) {
                        HStack {
                            Image(systemName: "play.fill")
                            Text("Start New Quiz")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    
                    Button(action: resumeActiveSession) {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                            Text("Resume Quiz")
                                .fontWeight(.medium)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(hasActiveSession ? Color.green : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!hasActiveSession)
                    
                    HStack(spacing: 12) {
                        Button(action: {}) {
                            VStack {
                                Image(systemName: "trophy")
                                    .font(.title2)
                                Text("Leaderboard")
                                    .font(.caption)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        Button(action: {}) {
                            VStack {
                                Image(systemName: "chart.bar")
                                    .font(.title2)
                                Text("Statistics")
                                    .font(.caption)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.horizontal, 20)
            .navigationTitle("Quiz")
        }
        .fullScreenCover(isPresented: $showingCategorySelection) {
            CategorySelectionView()
        }
        .fullScreenCover(isPresented: $showingQuizGame) {
            if let session = activeSession {
                QuizGameView(session: session)
            }
        }
        .onAppear {
            checkForActiveSession()
        }
    }
    
    private func checkForActiveSession() {
        quizService.resumeActiveSession()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { session in
                    activeSession = session
                    hasActiveSession = session != nil
                }
            )
            .store(in: &quizService.cancellables)
    }
    
    private func resumeActiveSession() {
        guard let session = activeSession else { return }
        showingQuizGame = true
    }
}

struct ActiveSessionCard: View {
    let session: GameSession
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Active Quiz Session")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Text("In Progress")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .foregroundColor(.green)
                    .cornerRadius(8)
            }
            
            HStack {
                Text("Progress:")
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(session.currentQuestionIndex + 1) of \(session.totalQuestions)")
                    .fontWeight(.medium)
            }
            
            HStack {
                Text("Score:")
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(session.score)")
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
            }
            
            ProgressView(value: Double(session.currentQuestionIndex), total: Double(session.totalQuestions))
                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                .scaleEffect(x: 1, y: 2, anchor: .center)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.blue.opacity(0.3), lineWidth: 1)
        )
    }
}

struct MultiplayerView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "person.3.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.green)
                
                Text("Multiplayer")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Real-time multiplayer rooms coming in Sprint 4")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .navigationTitle("Multiplayer")
        }
    }
}

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let user = authService.currentUser {
                    VStack(spacing: 16) {
                        // Avatar placeholder
                        Circle()
                            .fill(Color.blue.opacity(0.1))
                            .frame(width: 100, height: 100)
                            .overlay(
                                Text(user.username.prefix(2).uppercased())
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            )
                        
                        Text("Welcome, \(user.username)!")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        if let firstName = user.firstName, let lastName = user.lastName {
                            Text("\(firstName) \(lastName)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.top, 20)
                    
                    // User stats
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Level:")
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(user.level)")
                                .foregroundColor(.blue)
                        }
                        
                        HStack {
                            Text("Total Score:")
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(user.totalScore)")
                                .foregroundColor(.blue)
                        }
                        
                        HStack {
                            Text("Games Played:")
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(user.gamesPlayed)")
                                .foregroundColor(.blue)
                        }
                        
                        HStack {
                            Text("Games Won:")
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(user.gamesWon)")
                                .foregroundColor(.blue)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    
                    Spacer()
                    
                    Button(action: {
                        authService.logout()
                    }) {
                        Text("Logout")
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.red)
                            .cornerRadius(10)
                    }
                }
            }
            .padding()
            .navigationTitle("Profile")
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AuthService())
    }
}