import SwiftUI

public enum DSButtonStyle {
    case primary
    case secondary
    case tertiary
    case destructive
    case ghost
}

public enum DSButtonSize {
    case small
    case medium
    case large
    
    var height: CGFloat {
        switch self {
        case .small: return SizeTokens.Height.buttonSmall
        case .medium: return SizeTokens.Height.buttonMedium
        case .large: return SizeTokens.Height.buttonLarge
        }
    }
    
    var horizontalPadding: CGFloat {
        switch self {
        case .small: return SpacingTokens.sm
        case .medium: return SpacingTokens.md
        case .large: return SpacingTokens.lg
        }
    }
    
    var font: Font {
        switch self {
        case .small: return TypographyTokens.TextStyle.caption
        case .medium: return TypographyTokens.TextStyle.callout
        case .large: return TypographyTokens.TextStyle.bodyBold
        }
    }
}

public struct DSButton: View {
    let title: String
    let icon: Image?
    let style: DSButtonStyle
    let size: DSButtonSize
    let isLoading: Bool
    let isFullWidth: Bool
    let action: () -> Void
    
    @State private var isPressed = false
    @Environment(\.isEnabled) private var isEnabled
    
    public init(
        _ title: String,
        icon: Image? = nil,
        style: DSButtonStyle = .primary,
        size: DSButtonSize = .medium,
        isLoading: Bool = false,
        isFullWidth: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.size = size
        self.isLoading = isLoading
        self.isFullWidth = isFullWidth
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: SpacingTokens.xs) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: textColor))
                        .scaleEffect(0.8)
                } else {
                    if let icon = icon {
                        icon
                            .font(.system(size: iconSize))
                    }
                    Text(title)
                        .font(size.font)
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .frame(height: size.height)
            .padding(.horizontal, size.horizontalPadding)
            .foregroundColor(textColor)
            .background(backgroundColor)
            .cornerRadius(RadiusTokens.Component.button)
            .overlay(
                RoundedRectangle(cornerRadius: RadiusTokens.Component.button)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(AnimationTokens.Spring.snappy, value: isPressed)
            .shadow(
                color: shadowColor,
                radius: shadowRadius,
                x: 0,
                y: shadowY
            )
        }
        .disabled(isLoading)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
        .accessibilityLabel(title)
        .accessibilityHint(accessibilityHint)
        .accessibilityAddTraits(.isButton)
    }
    
    // MARK: - Computed Properties
    private var backgroundColor: Color {
        guard isEnabled else {
            return ColorTokens.Neutral.gray200
        }
        
        switch style {
        case .primary:
            return ColorTokens.Brand.primary
        case .secondary:
            return ColorTokens.Surface.secondary
        case .tertiary:
            return ColorTokens.Surface.tertiary
        case .destructive:
            return ColorTokens.Semantic.error
        case .ghost:
            return Color.clear
        }
    }
    
    private var textColor: Color {
        guard isEnabled else {
            return ColorTokens.Text.tertiary
        }
        
        switch style {
        case .primary, .destructive:
            return ColorTokens.Text.onBrand
        case .secondary, .tertiary:
            return ColorTokens.Text.primary
        case .ghost:
            return ColorTokens.Brand.primary
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .ghost:
            return ColorTokens.Neutral.gray300
        default:
            return Color.clear
        }
    }
    
    private var borderWidth: CGFloat {
        switch style {
        case .ghost:
            return 1
        default:
            return 0
        }
    }
    
    private var shadowColor: Color {
        guard isEnabled && style == .primary else {
            return Color.clear
        }
        return ColorTokens.Brand.primary.opacity(0.3)
    }
    
    private var shadowRadius: CGFloat {
        guard isEnabled && style == .primary else {
            return 0
        }
        return isPressed ? 4 : 8
    }
    
    private var shadowY: CGFloat {
        guard isEnabled && style == .primary else {
            return 0
        }
        return isPressed ? 2 : 4
    }
    
    private var iconSize: CGFloat {
        switch size {
        case .small: return SizeTokens.Icon.xs
        case .medium: return SizeTokens.Icon.sm
        case .large: return SizeTokens.Icon.md
        }
    }
    
    private var accessibilityHint: String {
        if isLoading {
            return "Loading"
        } else if !isEnabled {
            return "Disabled"
        } else {
            return ""
        }
    }
}

// MARK: - Convenience Initializers
extension DSButton {
    public static func primary(
        _ title: String,
        icon: Image? = nil,
        size: DSButtonSize = .medium,
        isLoading: Bool = false,
        isFullWidth: Bool = false,
        action: @escaping () -> Void
    ) -> DSButton {
        DSButton(
            title,
            icon: icon,
            style: .primary,
            size: size,
            isLoading: isLoading,
            isFullWidth: isFullWidth,
            action: action
        )
    }
    
    public static func secondary(
        _ title: String,
        icon: Image? = nil,
        size: DSButtonSize = .medium,
        isLoading: Bool = false,
        isFullWidth: Bool = false,
        action: @escaping () -> Void
    ) -> DSButton {
        DSButton(
            title,
            icon: icon,
            style: .secondary,
            size: size,
            isLoading: isLoading,
            isFullWidth: isFullWidth,
            action: action
        )
    }
    
    public static func destructive(
        _ title: String,
        icon: Image? = nil,
        size: DSButtonSize = .medium,
        isLoading: Bool = false,
        isFullWidth: Bool = false,
        action: @escaping () -> Void
    ) -> DSButton {
        DSButton(
            title,
            icon: icon,
            style: .destructive,
            size: size,
            isLoading: isLoading,
            isFullWidth: isFullWidth,
            action: action
        )
    }
}

// MARK: - Preview
struct DSButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: SpacingTokens.md) {
            DSButton.primary("Primary Button", icon: Image(systemName: "play.fill")) {}
            DSButton.secondary("Secondary Button") {}
            DSButton("Tertiary", style: .tertiary) {}
            DSButton("Destructive", style: .destructive) {}
            DSButton("Ghost", style: .ghost) {}
            DSButton("Loading", isLoading: true) {}
            DSButton("Disabled") {}.disabled(true)
            DSButton("Full Width", isFullWidth: true) {}
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}