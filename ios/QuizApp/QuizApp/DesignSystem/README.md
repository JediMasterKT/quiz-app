# QuizApp Design System

A comprehensive SwiftUI design system optimized for 60fps performance and full accessibility support.

## Overview

The QuizApp Design System provides:
- **Core Design Tokens**: Colors, typography, spacing, shadows, and animations
- **Foundation Components**: Buttons, cards, text fields, and more
- **Quiz Components**: Question cards, answer options, progress indicators
- **Animation Utilities**: 60fps optimized animations and transitions
- **Accessibility**: Full VoiceOver support, Dynamic Type, and WCAG compliance

## Performance Targets

- View rendering: <100ms
- Animation frame rate: 60fps sustained
- Memory usage: <150MB peak
- App launch time: <2 seconds
- 100% VoiceOver support

## Usage

### Import the Design System

```swift
import SwiftUI
// Import the main design system file
import DesignSystem
```

### Using Design Tokens

```swift
// Colors
Text("Hello")
    .foregroundColor(DSColors.Brand.primary)

// Typography
Text("Title")
    .title1()

// Spacing
VStack(spacing: DSSpacing.md) {
    // Content
}

// Shadows
.shadow(
    color: DSShadow.md.color,
    radius: DSShadow.md.radius,
    y: DSShadow.md.y
)
```

### Using Components

```swift
// Button
DSButton.primary("Get Started") {
    // Action
}

// Card
DSCard {
    Text("Card Content")
}

// Progress Indicator
DSLinearProgress(
    progress: 75,
    total: 100,
    showLabel: true
)

// Question Card
DSQuestionCard(
    questionNumber: 1,
    totalQuestions: 10,
    questionText: "What is SwiftUI?",
    difficultyLevel: .intermediate,
    timeRemaining: 30,
    points: 100
)
```

### Animations

```swift
// Loading animation
LoadingDots()

// Success animation
SuccessCheckmark()

// Custom animations
Text("Animated")
    .pulse()
    .shake(times: 3)
```

### Accessibility

```swift
// Add accessibility labels
DSButton("Submit") {}
    .accessibilityElement(
        label: "Submit answer",
        hint: "Double tap to submit your answer"
    )

// Haptic feedback
HapticFeedback.trigger(.success)

// VoiceOver announcements
VoiceOverUtilities.announce("Answer submitted successfully")
```

## Component Library

### Foundation Components
- `DSButton` - Customizable buttons with multiple styles
- `DSCard` - Card containers with elevation styles
- `DSTextField` - Text input fields with validation
- `DSEmailField` - Email-specific input field
- `DSPasswordField` - Secure password input
- `DSSearchField` - Search input with clear button

### Progress Components
- `DSLinearProgress` - Horizontal progress bars
- `DSCircularProgress` - Circular progress indicators
- `DSStepProgress` - Step-by-step progress indicator
- `DSSegmentedProgress` - Segmented progress bars
- `DSAchievementProgress` - Achievement tracking UI
- `DSLoadingSpinner` - Loading spinner animation

### Quiz Components
- `DSQuestionCard` - Question display card
- `DSAnswerOption` - Answer selection buttons
- `DSResultCard` - Result display with feedback
- `DSCategoryCard` - Category selection cards
- `DSStatsCard` - Statistics display cards

## Design Tokens

### Color Palette
- **Brand Colors**: Primary, Secondary, Tertiary
- **Semantic Colors**: Success, Warning, Error, Info
- **Difficulty Colors**: Beginner to Expert (5 levels)
- **Category Colors**: 10 predefined category colors
- **Neutral Colors**: 11-step grayscale

### Typography Scale
- Hero, Title (1-3), Headline, Body, Callout, Caption, Footnote
- Font weights from thin to black
- Line heights from tight to loose
- Letter spacing options

### Spacing System
- 4pt grid system
- Sizes: xxxs (2) to xxxxl (96)
- Component-specific spacing presets

## Viewing the Design System

In debug builds, you can toggle the design system showcase:

```swift
// In your app's UserDefaults
UserDefaults.standard.set(true, forKey: "showDesignSystem")
```

Or programmatically in SwiftUI:
```swift
@AppStorage("showDesignSystem") var showDesignSystem = false
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Prioritize accessibility** - test with VoiceOver enabled
3. **Optimize for performance** - use `.drawingGroup()` for complex animations
4. **Follow the spacing grid** - use multiples of 4pt
5. **Test on all device sizes** - ensure responsive layouts

## Contributing

When adding new components:
1. Follow existing naming conventions (DS prefix)
2. Include accessibility support
3. Add preview providers
4. Document usage in component files
5. Test performance metrics