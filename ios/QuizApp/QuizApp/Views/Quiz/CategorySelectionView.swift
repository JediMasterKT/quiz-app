import SwiftUI

struct CategorySelectionView: View {
    @StateObject private var quizService = QuizService.shared
    @State private var categories: [QuizCategory] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var selectedCategory: QuizCategory?
    @State private var showingDifficultySelection = false
    
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
                
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Text("Choose a Category")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("Select a topic to test your knowledge")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Connection status indicator
                    if !quizService.isOnline {
                        HStack {
                            Image(systemName: "wifi.slash")
                                .foregroundColor(.orange)
                            Text("Offline Mode")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(16)
                    }
                    
                    if isLoading {
                        // Loading state
                        Spacer()
                        ProgressView("Loading categories...")
                            .font(.headline)
                        Spacer()
                    } else if let errorMessage = errorMessage {
                        // Error state
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.red)
                            
                            Text("Oops!")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            Text(errorMessage)
                                .font(.body)
                                .multilineTextAlignment(.center)
                                .foregroundColor(.secondary)
                            
                            Button("Try Again") {
                                loadCategories()
                            }
                            .buttonStyle(PrimaryButtonStyle())
                        }
                        .padding(.horizontal, 40)
                    } else {
                        // Categories grid
                        ScrollView {
                            LazyVGrid(columns: [
                                GridItem(.flexible(), spacing: 12),
                                GridItem(.flexible(), spacing: 12)
                            ], spacing: 16) {
                                ForEach(categories, id: \.id) { category in
                                    CategoryCard(
                                        category: category,
                                        isSelected: selectedCategory?.id == category.id
                                    ) {
                                        selectedCategory = category
                                        showingDifficultySelection = true
                                    }
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                        
                        Spacer()
                        
                        // Random category button
                        Button(action: startRandomQuiz) {
                            HStack {
                                Image(systemName: "shuffle")
                                Text("Random Category")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            loadCategories()
        }
        .sheet(isPresented: $showingDifficultySelection) {
            if let category = selectedCategory {
                DifficultySelectionView(category: category)
            }
        }
        .onChange(of: quizService.isOnline) { isOnline in
            if isOnline && categories.isEmpty {
                loadCategories()
            }
        }
    }
    
    private func loadCategories() {
        isLoading = true
        errorMessage = nil
        
        quizService.getCategories()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { loadedCategories in
                    categories = loadedCategories
                    isLoading = false
                }
            )
            .store(in: &quizService.cancellables)
    }
    
    private func startRandomQuiz() {
        guard !categories.isEmpty else { return }
        selectedCategory = categories.randomElement()
        showingDifficultySelection = true
    }
}

struct CategoryCard: View {
    let category: QuizCategory
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                // Category icon
                ZStack {
                    Circle()
                        .fill(categoryColor.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    if let iconUrl = category.iconUrl, !iconUrl.isEmpty {
                        AsyncImage(url: URL(string: iconUrl)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            Image(systemName: categoryIcon)
                                .font(.system(size: 24))
                                .foregroundColor(categoryColor)
                        }
                        .frame(width: 30, height: 30)
                    } else {
                        Image(systemName: categoryIcon)
                            .font(.system(size: 24))
                            .foregroundColor(categoryColor)
                    }
                }
                
                // Category name
                Text(category.name)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.primary)
                
                // Question count
                if let questionCount = category.questionCount {
                    Text("\(questionCount) questions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Description (if available)
                if let description = category.description, !description.isEmpty {
                    Text(description)
                        .font(.caption2)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
            .padding(.vertical, 16)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity)
            .frame(height: 160)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? categoryColor : Color.clear, lineWidth: 2)
            )
            .scaleEffect(isSelected ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isSelected)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var categoryColor: Color {
        if let colorCode = category.colorCode {
            return Color(hex: colorCode) ?? .blue
        }
        return .blue
    }
    
    private var categoryIcon: String {
        // Map category names to SF Symbol icons
        switch category.name.lowercased() {
        case let name where name.contains("science"):
            return "atom"
        case let name where name.contains("history"):
            return "clock"
        case let name where name.contains("geography"):
            return "globe"
        case let name where name.contains("sports"):
            return "sportscourt"
        case let name where name.contains("music"):
            return "music.note"
        case let name where name.contains("art"):
            return "paintbrush"
        case let name where name.contains("literature"):
            return "book"
        case let name where name.contains("math"):
            return "function"
        case let name where name.contains("technology"):
            return "desktopcomputer"
        case let name where name.contains("nature"):
            return "leaf"
        default:
            return "questionmark.circle"
        }
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Color Extension
extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    CategorySelectionView()
}