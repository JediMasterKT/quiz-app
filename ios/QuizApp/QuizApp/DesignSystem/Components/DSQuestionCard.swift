import SwiftUI

// MARK: - Question Card
public struct DSQuestionCard: View {
    let questionNumber: Int
    let totalQuestions: Int
    let questionText: String
    let imageUrl: String?
    let difficultyLevel: DifficultyLevel
    let timeRemaining: Int?
    let points: Int
    
    public enum DifficultyLevel: Int {
        case beginner = 1
        case easy = 2
        case intermediate = 3
        case advanced = 4
        case expert = 5
        
        var color: Color {
            switch self {
            case .beginner: return ColorTokens.Difficulty.beginner
            case .easy: return ColorTokens.Difficulty.easy
            case .intermediate: return ColorTokens.Difficulty.intermediate
            case .advanced: return ColorTokens.Difficulty.advanced
            case .expert: return ColorTokens.Difficulty.expert
            }
        }
        
        var label: String {
            switch self {
            case .beginner: return "Beginner"
            case .easy: return "Easy"
            case .intermediate: return "Intermediate"
            case .advanced: return "Advanced"
            case .expert: return "Expert"
            }
        }
    }
    
    public init(
        questionNumber: Int,
        totalQuestions: Int,
        questionText: String,
        imageUrl: String? = nil,
        difficultyLevel: DifficultyLevel,
        timeRemaining: Int? = nil,
        points: Int
    ) {
        self.questionNumber = questionNumber
        self.totalQuestions = totalQuestions
        self.questionText = questionText
        self.imageUrl = imageUrl
        self.difficultyLevel = difficultyLevel
        self.timeRemaining = timeRemaining
        self.points = points
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Question \(questionNumber) of \(totalQuestions)")
                    .caption()
                    .foregroundColor(ColorTokens.Text.secondary)
                
                Spacer()
                
                DifficultyBadge(level: difficultyLevel)
            }
            .padding(SpacingTokens.md)
            
            // Question Content
            VStack(spacing: SpacingTokens.md) {
                if let imageUrl = imageUrl {
                    // Placeholder for image
                    RoundedRectangle(cornerRadius: RadiusTokens.md)
                        .fill(ColorTokens.Surface.tertiary)
                        .frame(height: 200)
                        .overlay(
                            Image(systemName: "photo")
                                .font(.system(size: 40))
                                .foregroundColor(ColorTokens.Text.tertiary)
                        )
                }
                
                Text(questionText)
                    .bodyText()
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, SpacingTokens.md)
            .padding(.bottom, SpacingTokens.md)
            
            // Footer
            HStack {
                // Points
                HStack(spacing: SpacingTokens.xs) {
                    Image(systemName: "star.fill")
                        .font(.system(size: SizeTokens.Icon.xs))
                        .foregroundColor(ColorTokens.Semantic.warning)
                    Text("\(points) points")
                        .caption()
                        .foregroundColor(ColorTokens.Text.secondary)
                }
                
                Spacer()
                
                // Timer
                if let timeRemaining = timeRemaining {
                    TimerDisplay(seconds: timeRemaining)
                }
            }
            .padding(SpacingTokens.md)
            .background(ColorTokens.Surface.secondary)
        }
        .background(ColorTokens.Surface.primary)
        .cornerRadius(RadiusTokens.Component.card)
        .shadow(color: ShadowTokens.md.color, radius: ShadowTokens.md.radius, y: ShadowTokens.md.y)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Question \(questionNumber) of \(totalQuestions): \(questionText)")
        .accessibilityHint("\(difficultyLevel.label) difficulty, worth \(points) points")
    }
}

// MARK: - Answer Option Card
public struct DSAnswerOption: View {
    let text: String
    let index: Int
    let isSelected: Bool
    let isCorrect: Bool?
    let isDisabled: Bool
    let action: () -> Void
    
    public init(
        text: String,
        index: Int,
        isSelected: Bool = false,
        isCorrect: Bool? = nil,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.text = text
        self.index = index
        self.isSelected = isSelected
        self.isCorrect = isCorrect
        self.isDisabled = isDisabled
        self.action = action
    }
    
    private var backgroundColor: Color {
        if let isCorrect = isCorrect {
            return isCorrect ? ColorTokens.Semantic.success.opacity(0.15) : ColorTokens.Semantic.error.opacity(0.15)
        } else if isSelected {
            return ColorTokens.Brand.primary.opacity(0.15)
        } else {
            return ColorTokens.Surface.secondary
        }
    }
    
    private var borderColor: Color {
        if let isCorrect = isCorrect {
            return isCorrect ? ColorTokens.Semantic.success : ColorTokens.Semantic.error
        } else if isSelected {
            return ColorTokens.Brand.primary
        } else {
            return ColorTokens.Neutral.gray300
        }
    }
    
    private var optionLabel: String {
        ["A", "B", "C", "D", "E"][safe: index] ?? String(index + 1)
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: SpacingTokens.md) {
                // Option Label
                ZStack {
                    Circle()
                        .fill(isSelected ? borderColor : ColorTokens.Surface.tertiary)
                        .frame(width: 32, height: 32)
                    
                    Text(optionLabel)
                        .captionBold()
                        .foregroundColor(isSelected ? .white : ColorTokens.Text.secondary)
                }
                
                // Option Text
                Text(text)
                    .bodyText()
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                // Result Icon
                if let isCorrect = isCorrect {
                    Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.system(size: SizeTokens.Icon.md))
                        .foregroundColor(isCorrect ? ColorTokens.Semantic.success : ColorTokens.Semantic.error)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(SpacingTokens.md)
            .background(backgroundColor)
            .cornerRadius(RadiusTokens.md)
            .overlay(
                RoundedRectangle(cornerRadius: RadiusTokens.md)
                    .stroke(borderColor, lineWidth: isSelected || isCorrect != nil ? 2 : 1)
            )
            .scaleEffect(isSelected && isCorrect == nil ? 1.02 : 1.0)
            .animation(AnimationTokens.Spring.snappy, value: isSelected)
            .animation(AnimationTokens.Spring.bouncy, value: isCorrect)
        }
        .disabled(isDisabled || isCorrect != nil)
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("Option \(optionLabel): \(text)")
        .accessibilityHint(isSelected ? "Selected" : "Tap to select")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

// MARK: - Timer Display
public struct TimerDisplay: View {
    let seconds: Int
    
    private var displayTime: String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
    
    private var timerColor: Color {
        if seconds <= 10 {
            return ColorTokens.Semantic.error
        } else if seconds <= 30 {
            return ColorTokens.Semantic.warning
        } else {
            return ColorTokens.Text.secondary
        }
    }
    
    public var body: some View {
        HStack(spacing: SpacingTokens.xs) {
            Image(systemName: "clock.fill")
                .font(.system(size: SizeTokens.Icon.xs))
            Text(displayTime)
                .caption()
                .fontWeight(.semibold)
        }
        .foregroundColor(timerColor)
        .padding(.horizontal, SpacingTokens.xs)
        .padding(.vertical, SpacingTokens.xxs)
        .background(timerColor.opacity(0.15))
        .cornerRadius(RadiusTokens.Component.badge)
        .animation(AnimationTokens.Spring.smooth, value: seconds)
        .accessibilityLabel("Time remaining: \(displayTime)")
    }
}

// MARK: - Difficulty Badge
public struct DifficultyBadge: View {
    let level: DSQuestionCard.DifficultyLevel
    
    public var body: some View {
        HStack(spacing: SpacingTokens.xxs) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= level.rawValue ? "star.fill" : "star")
                    .font(.system(size: 10))
                    .foregroundColor(level.color)
            }
            Text(level.label)
                .caption()
                .foregroundColor(level.color)
        }
        .padding(.horizontal, SpacingTokens.xs)
        .padding(.vertical, SpacingTokens.xxs)
        .background(level.color.opacity(0.15))
        .cornerRadius(RadiusTokens.Component.badge)
        .accessibilityLabel("\(level.label) difficulty")
    }
}

// MARK: - Question Type Badge
public struct QuestionTypeBadge: View {
    let type: QuestionType
    
    public enum QuestionType {
        case multipleChoice
        case trueFalse
        case fillBlank
        case essay
        
        var icon: String {
            switch self {
            case .multipleChoice: return "list.bullet"
            case .trueFalse: return "checkmark.circle"
            case .fillBlank: return "text.cursor"
            case .essay: return "text.alignleft"
            }
        }
        
        var label: String {
            switch self {
            case .multipleChoice: return "Multiple Choice"
            case .trueFalse: return "True/False"
            case .fillBlank: return "Fill in the Blank"
            case .essay: return "Essay"
            }
        }
    }
    
    public var body: some View {
        HStack(spacing: SpacingTokens.xs) {
            Image(systemName: type.icon)
                .font(.system(size: SizeTokens.Icon.xs))
            Text(type.label)
                .caption()
        }
        .foregroundColor(ColorTokens.Text.secondary)
        .padding(.horizontal, SpacingTokens.xs)
        .padding(.vertical, SpacingTokens.xxs)
        .background(ColorTokens.Surface.tertiary)
        .cornerRadius(RadiusTokens.Component.badge)
        .accessibilityLabel("\(type.label) question")
    }
}

// MARK: - Result Card
public struct DSResultCard: View {
    let isCorrect: Bool
    let correctAnswer: String?
    let explanation: String?
    let pointsEarned: Int
    let onContinue: () -> Void
    
    public init(
        isCorrect: Bool,
        correctAnswer: String? = nil,
        explanation: String? = nil,
        pointsEarned: Int,
        onContinue: @escaping () -> Void
    ) {
        self.isCorrect = isCorrect
        self.correctAnswer = correctAnswer
        self.explanation = explanation
        self.pointsEarned = pointsEarned
        self.onContinue = onContinue
    }
    
    public var body: some View {
        VStack(spacing: SpacingTokens.lg) {
            // Result Icon
            ZStack {
                Circle()
                    .fill(isCorrect ? ColorTokens.Semantic.success : ColorTokens.Semantic.error)
                    .frame(width: 80, height: 80)
                
                Image(systemName: isCorrect ? "checkmark" : "xmark")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)
            }
            .scaleEffect(1.2)
            .animation(AnimationTokens.Spring.bouncy, value: isCorrect)
            
            // Result Text
            VStack(spacing: SpacingTokens.xs) {
                Text(isCorrect ? "Correct!" : "Incorrect")
                    .title2()
                    .foregroundColor(ColorTokens.Text.primary)
                
                if isCorrect {
                    Text("+\(pointsEarned) points")
                        .headline()
                        .foregroundColor(ColorTokens.Semantic.success)
                } else if let correctAnswer = correctAnswer {
                    Text("Correct answer: \(correctAnswer)")
                        .bodyText()
                        .foregroundColor(ColorTokens.Text.secondary)
                }
            }
            
            // Explanation
            if let explanation = explanation {
                VStack(alignment: .leading, spacing: SpacingTokens.xs) {
                    Text("Explanation")
                        .captionBold()
                        .foregroundColor(ColorTokens.Text.secondary)
                    
                    Text(explanation)
                        .callout()
                        .foregroundColor(ColorTokens.Text.primary)
                        .multilineTextAlignment(.leading)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(SpacingTokens.md)
                .background(ColorTokens.Surface.tertiary)
                .cornerRadius(RadiusTokens.md)
            }
            
            // Continue Button
            DSButton.primary("Continue", isFullWidth: true, action: onContinue)
        }
        .padding(SpacingTokens.lg)
        .background(ColorTokens.Surface.primary)
        .cornerRadius(RadiusTokens.Component.card)
        .shadow(color: ShadowTokens.lg.color, radius: ShadowTokens.lg.radius, y: ShadowTokens.lg.y)
        .onAppear {
            HapticFeedback.trigger(isCorrect ? .success : .error)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(isCorrect ? "Correct answer" : "Incorrect answer")
        .accessibilityHint(explanation ?? "")
    }
}

// MARK: - Preview
struct DSQuestionCard_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: SpacingTokens.lg) {
                DSQuestionCard(
                    questionNumber: 3,
                    totalQuestions: 10,
                    questionText: "Which planet is known as the 'Red Planet' in our solar system?",
                    difficultyLevel: .intermediate,
                    timeRemaining: 45,
                    points: 100
                )
                
                VStack(spacing: SpacingTokens.sm) {
                    DSAnswerOption(text: "Venus", index: 0, action: {})
                    DSAnswerOption(text: "Mars", index: 1, isSelected: true, action: {})
                    DSAnswerOption(text: "Jupiter", index: 2, action: {})
                    DSAnswerOption(text: "Saturn", index: 3, isCorrect: false, action: {})
                }
                
                DSResultCard(
                    isCorrect: true,
                    explanation: "Mars is called the 'Red Planet' because of its reddish appearance, which is caused by iron oxide (rust) on its surface.",
                    pointsEarned: 100,
                    onContinue: {}
                )
            }
            .padding()
        }
    }
}