import SwiftUI

// MARK: - Design System
// This file serves as the main entry point for the QuizApp Design System
// Import this file to access all design tokens, components, and utilities

// Re-export all tokens
public typealias DSColors = ColorTokens
public typealias DSTypography = TypographyTokens
public typealias DSSpacing = SpacingTokens
public typealias DSSize = SizeTokens
public typealias DSRadius = RadiusTokens
public typealias DSShadow = ShadowTokens
public typealias DSAnimation = AnimationTokens

// MARK: - Design System Configuration
public struct DesignSystem {
    public static let version = "1.0.0"
    public static let name = "QuizApp Design System"
    
    // MARK: - Performance Settings
    public struct Performance {
        public static let targetFPS = 60
        public static let maxMemoryUsage = 150 // MB
        public static let viewRenderingTarget = 100 // ms
        public static let animationDuration = DSAnimation.Duration.normal
    }
    
    // MARK: - Accessibility Settings
    public struct Accessibility {
        public static let minimumTouchTarget: CGFloat = 44
        public static let minimumContrastRatio: Double = 4.5
        public static let supportsDynamicType = true
        public static let supportsVoiceOver = true
        public static let supportsReduceMotion = true
    }
    
    // MARK: - Theme Configuration
    public enum Theme {
        case light
        case dark
        case system
        
        public var colorScheme: ColorScheme? {
            switch self {
            case .light: return .light
            case .dark: return .dark
            case .system: return nil
            }
        }
    }
}

// MARK: - Environment Values
private struct DesignSystemThemeKey: EnvironmentKey {
    static let defaultValue = DesignSystem.Theme.system
}

extension EnvironmentValues {
    public var designSystemTheme: DesignSystem.Theme {
        get { self[DesignSystemThemeKey.self] }
        set { self[DesignSystemThemeKey.self] = newValue }
    }
}

// MARK: - View Extensions
extension View {
    public func designSystemTheme(_ theme: DesignSystem.Theme) -> some View {
        self
            .environment(\.designSystemTheme, theme)
            .preferredColorScheme(theme.colorScheme)
    }
    
    // Apply all design system defaults
    public func applyDesignSystem() -> some View {
        self
            .accentColor(DSColors.Brand.primary)
            .font(DSTypography.TextStyle.body)
    }
}

// MARK: - Component Library
public struct DSComponents {
    // Foundation Components
    public typealias Button = DSButton
    public typealias Card = DSCard
    public typealias InteractiveCard = DSInteractiveCard
    public typealias TextField = DSTextField
    public typealias EmailField = DSEmailField
    public typealias PasswordField = DSPasswordField
    public typealias SearchField = DSSearchField
    
    // Quiz Components
    public typealias QuestionCard = DSQuestionCard
    public typealias AnswerOption = DSAnswerOption
    public typealias ResultCard = DSResultCard
    public typealias CategoryCard = DSCategoryCard
    public typealias StatsCard = DSStatsCard
    
    // Progress Components
    public typealias LinearProgress = DSLinearProgress
    public typealias CircularProgress = DSCircularProgress
    public typealias StepProgress = DSStepProgress
    public typealias SegmentedProgress = DSSegmentedProgress
    public typealias AchievementProgress = DSAchievementProgress
    public typealias LoadingSpinner = DSLoadingSpinner
    
    // Badges and Indicators
    public typealias DifficultyBadge = DifficultyBadge
    public typealias QuestionTypeBadge = QuestionTypeBadge
    public typealias TimerDisplay = TimerDisplay
}

// MARK: - Utilities
public struct DSUtilities {
    // Animation Utilities
    public typealias Animations = AnimationPresets
    public typealias LoadingDots = LoadingDots
    public typealias SuccessCheckmark = SuccessCheckmark
    public typealias ConfettiView = ConfettiView
    
    // Accessibility Utilities
    public typealias Accessibility = AccessibilityUtilities
    public typealias VoiceOver = VoiceOverUtilities
    public typealias ColorContrast = ColorContrastChecker
    public typealias Haptics = HapticFeedback
}

// MARK: - Preview Helper
#if DEBUG
public struct DesignSystemPreview<Content: View>: View {
    let content: () -> Content
    
    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }
    
    public var body: some View {
        Group {
            content()
                .applyDesignSystem()
                .previewDisplayName("Light Mode")
                .preferredColorScheme(.light)
            
            content()
                .applyDesignSystem()
                .previewDisplayName("Dark Mode")
                .preferredColorScheme(.dark)
            
            content()
                .applyDesignSystem()
                .previewDisplayName("Accessibility - Large Text")
                .environment(\.sizeCategory, .accessibilityLarge)
        }
    }
}
#endif