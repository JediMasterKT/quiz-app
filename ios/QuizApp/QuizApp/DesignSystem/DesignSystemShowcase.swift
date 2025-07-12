import SwiftUI

struct DesignSystemShowcase: View {
    @State private var selectedTab = 0
    @State private var textFieldValue = ""
    @State private var emailValue = ""
    @State private var passwordValue = ""
    @State private var searchValue = ""
    @State private var progress = 0.65
    @State private var selectedAnswer = -1
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ColorsView()
                .tabItem {
                    Label("Colors", systemImage: "paintpalette")
                }
                .tag(0)
            
            TypographyView()
                .tabItem {
                    Label("Typography", systemImage: "textformat")
                }
                .tag(1)
            
            ComponentsView()
                .tabItem {
                    Label("Components", systemImage: "square.grid.2x2")
                }
                .tag(2)
            
            AnimationsView()
                .tabItem {
                    Label("Animations", systemImage: "wand.and.rays")
                }
                .tag(3)
            
            QuizComponentsView()
                .tabItem {
                    Label("Quiz", systemImage: "questionmark.circle")
                }
                .tag(4)
        }
    }
}

// MARK: - Colors View
struct ColorsView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: SpacingTokens.lg) {
                    ColorSection(title: "Brand Colors", colors: [
                        ("Primary", ColorTokens.Brand.primary),
                        ("Secondary", ColorTokens.Brand.secondary),
                        ("Tertiary", ColorTokens.Brand.tertiary)
                    ])
                    
                    ColorSection(title: "Semantic Colors", colors: [
                        ("Success", ColorTokens.Semantic.success),
                        ("Warning", ColorTokens.Semantic.warning),
                        ("Error", ColorTokens.Semantic.error),
                        ("Info", ColorTokens.Semantic.info)
                    ])
                    
                    ColorSection(title: "Difficulty Colors", colors: [
                        ("Beginner", ColorTokens.Difficulty.beginner),
                        ("Easy", ColorTokens.Difficulty.easy),
                        ("Intermediate", ColorTokens.Difficulty.intermediate),
                        ("Advanced", ColorTokens.Difficulty.advanced),
                        ("Expert", ColorTokens.Difficulty.expert)
                    ])
                    
                    ColorSection(title: "Category Colors", colors: [
                        ("Science", ColorTokens.Category.science),
                        ("History", ColorTokens.Category.history),
                        ("Geography", ColorTokens.Category.geography),
                        ("Literature", ColorTokens.Category.literature),
                        ("Sports", ColorTokens.Category.sports),
                        ("Entertainment", ColorTokens.Category.entertainment)
                    ])
                }
                .padding()
            }
            .navigationTitle("Colors")
        }
    }
}

struct ColorSection: View {
    let title: String
    let colors: [(String, Color)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: SpacingTokens.sm) {
            Text(title)
                .headline()
            
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: SpacingTokens.sm) {
                ForEach(colors, id: \.0) { name, color in
                    VStack(spacing: SpacingTokens.xs) {
                        RoundedRectangle(cornerRadius: RadiusTokens.md)
                            .fill(color)
                            .frame(height: 60)
                        Text(name)
                            .caption()
                    }
                }
            }
        }
    }
}

// MARK: - Typography View
struct TypographyView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: SpacingTokens.lg) {
                    Group {
                        Text("Hero Text Style")
                            .heroText()
                        
                        Text("Title 1 Style")
                            .title1()
                        
                        Text("Title 2 Style")
                            .title2()
                        
                        Text("Title 3 Style")
                            .title3()
                        
                        Text("Headline Style")
                            .headline()
                        
                        Text("Body Text Style - Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
                            .bodyText()
                        
                        Text("Body Bold Style")
                            .bodyBold()
                        
                        Text("Callout Style")
                            .callout()
                        
                        Text("Caption Style")
                            .caption()
                        
                        Text("Caption Bold Style")
                            .captionBold()
                        
                        Text("Footnote Style")
                            .footnote()
                        
                        Text("let code = \"Code Text Style\"")
                            .codeText()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .navigationTitle("Typography")
        }
    }
}

// MARK: - Components View
struct ComponentsView: View {
    @State private var textValue = ""
    @State private var emailValue = ""
    @State private var passwordValue = ""
    @State private var searchValue = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: SpacingTokens.xl) {
                    // Buttons
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Buttons")
                            .headline()
                        
                        DSButton.primary("Primary Button") {}
                        DSButton.secondary("Secondary Button") {}
                        DSButton("Tertiary", style: .tertiary) {}
                        DSButton("Destructive", style: .destructive) {}
                        DSButton("Ghost", style: .ghost) {}
                        DSButton("Loading", isLoading: true) {}
                        DSButton("Full Width", isFullWidth: true) {}
                    }
                    
                    Divider()
                    
                    // Cards
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Cards")
                            .headline()
                        
                        DSCard(style: .elevated) {
                            VStack(alignment: .leading) {
                                Text("Elevated Card")
                                    .headline()
                                Text("This is an elevated card with shadow")
                                    .caption()
                            }
                        }
                        
                        DSCategoryCard(
                            name: "Science",
                            description: "Explore the wonders of the natural world",
                            icon: Image(systemName: "atom"),
                            color: ColorTokens.Category.science,
                            questionCount: 250,
                            action: {}
                        )
                        
                        DSStatsCard(
                            title: "Total Score",
                            value: "2,456",
                            subtitle: "+125 this week",
                            icon: Image(systemName: "star.fill"),
                            color: ColorTokens.Semantic.warning
                        )
                    }
                    
                    Divider()
                    
                    // Text Fields
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Text Fields")
                            .headline()
                        
                        DSTextField(
                            text: $textValue,
                            placeholder: "Enter text",
                            label: "Standard Field",
                            helper: "This is helper text"
                        )
                        
                        DSEmailField(
                            email: $emailValue,
                            error: showError ? "Invalid email address" : nil
                        )
                        
                        DSPasswordField(
                            password: $passwordValue,
                            helper: "Must be at least 8 characters"
                        )
                        
                        DSSearchField(searchText: $searchValue)
                        
                        Toggle("Show Error States", isOn: $showError)
                            .padding(.top)
                    }
                }
                .padding()
            }
            .navigationTitle("Components")
        }
    }
}

// MARK: - Animations View
struct AnimationsView: View {
    @State private var triggerShake = false
    @State private var showConfetti = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: SpacingTokens.xl) {
                    // Loading Animations
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Loading Animations")
                            .headline()
                        
                        HStack(spacing: SpacingTokens.xl) {
                            LoadingDots()
                            DSLoadingSpinner()
                        }
                    }
                    
                    Divider()
                    
                    // Interactive Animations
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Interactive Animations")
                            .headline()
                        
                        DSButton("Shake Animation") {
                            triggerShake.toggle()
                        }
                        .shake(times: triggerShake ? 3 : 0)
                        
                        DSCard {
                            Text("Pulse Animation")
                                .headline()
                        }
                        .pulse()
                        
                        DSCard {
                            Text("Flip Me!")
                                .headline()
                        }
                        .flipOnTap()
                    }
                    
                    Divider()
                    
                    // Success Animations
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Success Animations")
                            .headline()
                        
                        HStack(spacing: SpacingTokens.xl) {
                            SuccessCheckmark()
                            
                            DSButton("Show Confetti") {
                                showConfetti.toggle()
                            }
                        }
                    }
                }
                .padding()
                .overlay {
                    if showConfetti {
                        ConfettiView()
                            .allowsHitTesting(false)
                            .onAppear {
                                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                    showConfetti = false
                                }
                            }
                    }
                }
            }
            .navigationTitle("Animations")
        }
    }
}

// MARK: - Quiz Components View
struct QuizComponentsView: View {
    @State private var selectedAnswer = -1
    @State private var showResult = false
    @State private var currentStep = 2
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: SpacingTokens.xl) {
                    // Progress Indicators
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Progress Indicators")
                            .headline()
                        
                        DSLinearProgress(progress: 65, total: 100, showLabel: true)
                        
                        HStack(spacing: SpacingTokens.xl) {
                            DSCircularProgress(progress: 75, total: 100, size: 80)
                            DSCircularProgress(progress: 45, total: 100, size: 80, progressColor: ColorTokens.Semantic.warning)
                        }
                        
                        DSStepProgress(
                            currentStep: currentStep,
                            totalSteps: 4,
                            stepLabels: ["Start", "Questions", "Review", "Complete"]
                        )
                        
                        DSSegmentedProgress(segments: 10, filledSegments: 7)
                    }
                    
                    Divider()
                    
                    // Question Components
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Question Components")
                            .headline()
                        
                        DSQuestionCard(
                            questionNumber: 3,
                            totalQuestions: 10,
                            questionText: "Which planet is known as the 'Red Planet' in our solar system?",
                            difficultyLevel: .intermediate,
                            timeRemaining: 45,
                            points: 100
                        )
                        
                        VStack(spacing: SpacingTokens.sm) {
                            ForEach(0..<4) { index in
                                DSAnswerOption(
                                    text: ["Venus", "Mars", "Jupiter", "Saturn"][index],
                                    index: index,
                                    isSelected: selectedAnswer == index,
                                    isCorrect: showResult ? (index == 1) : nil,
                                    action: {
                                        if !showResult {
                                            selectedAnswer = index
                                        }
                                    }
                                )
                            }
                        }
                        
                        DSButton.primary("Submit Answer", isFullWidth: true) {
                            showResult = true
                        }
                        .disabled(selectedAnswer == -1)
                    }
                    
                    Divider()
                    
                    // Achievement Progress
                    VStack(alignment: .leading, spacing: SpacingTokens.md) {
                        Text("Achievement Progress")
                            .headline()
                        
                        DSAchievementProgress(
                            title: "Quiz Master",
                            progress: 8,
                            total: 10,
                            icon: Image(systemName: "trophy.fill"),
                            color: ColorTokens.Semantic.warning,
                            isUnlocked: false
                        )
                        
                        DSAchievementProgress(
                            title: "Speed Demon",
                            progress: 5,
                            total: 5,
                            icon: Image(systemName: "bolt.fill"),
                            color: ColorTokens.Brand.secondary,
                            isUnlocked: true
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Quiz Components")
        }
    }
}

// MARK: - Preview
struct DesignSystemShowcase_Previews: PreviewProvider {
    static var previews: some View {
        DesignSystemShowcase()
    }
}