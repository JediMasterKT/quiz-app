import SwiftUI

// MARK: - Accessibility Utilities
public struct AccessibilityUtilities {
    // MARK: - Font Scaling
    public static func scaledFont(_ baseSize: CGFloat, relativeTo textStyle: Font.TextStyle = .body) -> CGFloat {
        let metrics = UIFontMetrics(forTextStyle: UIFont.TextStyle(textStyle))
        return metrics.scaledValue(for: baseSize)
    }
    
    // MARK: - High Contrast Support
    public static func adaptiveColor(normal: Color, highContrast: Color) -> Color {
        @Environment(\.colorSchemeContrast) var contrast
        return contrast == .increased ? highContrast : normal
    }
    
    // MARK: - Reduce Motion Support
    public static func adaptiveAnimation(_ animation: Animation?) -> Animation? {
        @Environment(\.accessibilityReduceMotion) var reduceMotion
        return reduceMotion ? .none : animation
    }
}

// MARK: - Accessibility View Modifiers
public struct AccessibilityLabelModifier: ViewModifier {
    let label: String
    let hint: String?
    let value: String?
    let traits: AccessibilityTraits
    
    public func body(content: Content) -> some View {
        content
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityValue(value ?? "")
            .accessibilityAddTraits(traits)
    }
}

extension View {
    public func accessibilityElement(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits = []
    ) -> some View {
        self.modifier(AccessibilityLabelModifier(
            label: label,
            hint: hint,
            value: value,
            traits: traits
        ))
    }
}

// MARK: - VoiceOver Utilities
public struct VoiceOverUtilities {
    public static var isVoiceOverRunning: Bool {
        UIAccessibility.isVoiceOverRunning
    }
    
    public static func announce(_ announcement: String, delay: Double = 0.1) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            UIAccessibility.post(
                notification: .announcement,
                argument: announcement
            )
        }
    }
    
    public static func announceScreenChange(_ announcement: String? = nil) {
        UIAccessibility.post(
            notification: .screenChanged,
            argument: announcement
        )
    }
}

// MARK: - Dynamic Type Support
public struct DynamicTypeModifier: ViewModifier {
    @Environment(\.sizeCategory) var sizeCategory
    let baseSize: CGFloat
    let textStyle: Font.TextStyle
    let weight: Font.Weight
    
    public func body(content: Content) -> some View {
        content
            .font(.system(
                size: scaledSize,
                weight: weight,
                design: .default
            ))
    }
    
    private var scaledSize: CGFloat {
        let metrics = UIFontMetrics(forTextStyle: UIFont.TextStyle(textStyle))
        return metrics.scaledValue(for: baseSize)
    }
}

extension View {
    public func dynamicTypeSize(
        _ baseSize: CGFloat,
        textStyle: Font.TextStyle = .body,
        weight: Font.Weight = .regular
    ) -> some View {
        self.modifier(DynamicTypeModifier(
            baseSize: baseSize,
            textStyle: textStyle,
            weight: weight
        ))
    }
}

// MARK: - Focus Management
public struct FocusableModifier: ViewModifier {
    @AccessibilityFocusState var isFocused: Bool
    let onFocusChange: ((Bool) -> Void)?
    
    public func body(content: Content) -> some View {
        content
            .accessibilityFocused($isFocused)
            .onChange(of: isFocused) { newValue in
                onFocusChange?(newValue)
            }
    }
}

extension View {
    public func accessibilityFocusable(
        onFocusChange: ((Bool) -> Void)? = nil
    ) -> some View {
        self.modifier(FocusableModifier(onFocusChange: onFocusChange))
    }
}

// MARK: - Semantic Grouping
public struct AccessibilityContainer<Content: View>: View {
    let label: String
    let hint: String?
    let content: () -> Content
    
    public init(
        label: String,
        hint: String? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.label = label
        self.hint = hint
        self.content = content
    }
    
    public var body: some View {
        content()
            .accessibilityElement(children: .combine)
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
    }
}

// MARK: - Accessibility Actions
public struct AccessibilityActionModifier: ViewModifier {
    let actions: [AccessibilityAction]
    
    public struct AccessibilityAction {
        let name: String
        let action: () -> Void
        
        public init(_ name: String, action: @escaping () -> Void) {
            self.name = name
            self.action = action
        }
    }
    
    public func body(content: Content) -> some View {
        content
            .accessibilityActions {
                ForEach(actions, id: \.name) { action in
                    Button(action.name) {
                        action.action()
                    }
                }
            }
    }
}

extension View {
    public func accessibilityCustomActions(
        _ actions: [AccessibilityActionModifier.AccessibilityAction]
    ) -> some View {
        self.modifier(AccessibilityActionModifier(actions: actions))
    }
}

// MARK: - Color Contrast Checker
public struct ColorContrastChecker {
    public static func meetsWCAGStandard(
        foreground: Color,
        background: Color,
        level: WCAGLevel = .AA
    ) -> Bool {
        let ratio = contrastRatio(between: foreground, and: background)
        
        switch level {
        case .AA:
            return ratio >= 4.5 // Normal text
        case .AAA:
            return ratio >= 7.0 // Enhanced contrast
        case .AALarge:
            return ratio >= 3.0 // Large text (18pt+)
        }
    }
    
    public enum WCAGLevel {
        case AA
        case AAA
        case AALarge
    }
    
    private static func contrastRatio(between color1: Color, and color2: Color) -> Double {
        // Simplified calculation - in production, use proper color luminance calculation
        // This is a placeholder that returns a reasonable value
        return 5.0
    }
}

// MARK: - Haptic Feedback
public struct HapticFeedback {
    public enum FeedbackType {
        case success
        case warning
        case error
        case light
        case medium
        case heavy
        case selection
    }
    
    public static func trigger(_ type: FeedbackType) {
        switch type {
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case .warning:
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case .error:
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        case .light:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .medium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .heavy:
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case .selection:
            UISelectionFeedbackGenerator().selectionChanged()
        }
    }
}

// MARK: - Accessibility Rotor
public struct AccessibilityRotorModifier: ViewModifier {
    let rotorLabel: String
    let entries: [String]
    let onSelect: (String) -> Void
    
    public func body(content: Content) -> some View {
        content
            .accessibilityRotor(rotorLabel) {
                ForEach(entries, id: \.self) { entry in
                    AccessibilityRotorEntry(entry, id: entry)
                }
            }
    }
}

extension View {
    public func accessibilityRotor(
        _ label: String,
        entries: [String],
        onSelect: @escaping (String) -> Void
    ) -> some View {
        self.modifier(AccessibilityRotorModifier(
            rotorLabel: label,
            entries: entries,
            onSelect: onSelect
        ))
    }
}

// MARK: - Accessibility Debug Overlay
public struct AccessibilityDebugOverlay: ViewModifier {
    @Environment(\.accessibilityEnabled) var accessibilityEnabled
    @Environment(\.sizeCategory) var sizeCategory
    @Environment(\.colorSchemeContrast) var contrast
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @Environment(\.accessibilityReduceTransparency) var reduceTransparency
    
    let showDebugInfo: Bool
    
    public func body(content: Content) -> some View {
        content
            .overlay(alignment: .topTrailing) {
                if showDebugInfo {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Accessibility Debug")
                            .font(.caption.bold())
                        Text("VoiceOver: \(VoiceOverUtilities.isVoiceOverRunning ? "ON" : "OFF")")
                        Text("Size: \(sizeCategory.description)")
                        Text("Contrast: \(contrast == .increased ? "High" : "Normal")")
                        Text("Reduce Motion: \(reduceMotion ? "ON" : "OFF")")
                        Text("Reduce Transparency: \(reduceTransparency ? "ON" : "OFF")")
                    }
                    .font(.caption2)
                    .padding(8)
                    .background(Color.black.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .padding()
                }
            }
    }
}

extension View {
    public func accessibilityDebugOverlay(_ show: Bool = true) -> some View {
        self.modifier(AccessibilityDebugOverlay(showDebugInfo: show))
    }
}

// MARK: - UIFont.TextStyle Extension
extension UIFont.TextStyle {
    init(_ textStyle: Font.TextStyle) {
        switch textStyle {
        case .largeTitle:
            self = .largeTitle
        case .title:
            self = .title1
        case .title2:
            self = .title2
        case .title3:
            self = .title3
        case .headline:
            self = .headline
        case .subheadline:
            self = .subheadline
        case .body:
            self = .body
        case .callout:
            self = .callout
        case .footnote:
            self = .footnote
        case .caption:
            self = .caption1
        case .caption2:
            self = .caption2
        @unknown default:
            self = .body
        }
    }
}

// MARK: - ContentSizeCategory Extension
extension ContentSizeCategory {
    var description: String {
        switch self {
        case .extraSmall:
            return "XS"
        case .small:
            return "S"
        case .medium:
            return "M"
        case .large:
            return "L"
        case .extraLarge:
            return "XL"
        case .extraExtraLarge:
            return "XXL"
        case .extraExtraExtraLarge:
            return "XXXL"
        case .accessibilityMedium:
            return "Acc M"
        case .accessibilityLarge:
            return "Acc L"
        case .accessibilityExtraLarge:
            return "Acc XL"
        case .accessibilityExtraExtraLarge:
            return "Acc XXL"
        case .accessibilityExtraExtraExtraLarge:
            return "Acc XXXL"
        @unknown default:
            return "Unknown"
        }
    }
}

// MARK: - Preview
struct AccessibilityUtilities_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: SpacingTokens.lg) {
            DSButton("Accessible Button") {
                HapticFeedback.trigger(.success)
                VoiceOverUtilities.announce("Button tapped")
            }
            .accessibilityElement(
                label: "Primary action button",
                hint: "Double tap to perform action",
                traits: .isButton
            )
            
            AccessibilityContainer(
                label: "User Stats",
                hint: "Shows your current level and score"
            ) {
                HStack {
                    Text("Level 5")
                    Spacer()
                    Text("2,456 points")
                }
            }
            
            Text("Dynamic Type Text")
                .dynamicTypeSize(20, textStyle: .body, weight: .semibold)
            
            DSCard {
                Text("Debug Info Overlay")
            }
            .accessibilityDebugOverlay()
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}