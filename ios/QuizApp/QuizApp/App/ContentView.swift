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
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "questionmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                
                Text("Quiz Mode")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Solo quiz gameplay coming in Sprint 2")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .navigationTitle("Quiz")
        }
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