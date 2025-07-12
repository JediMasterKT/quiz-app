import SwiftUI

public enum DSCardStyle {
    case elevated
    case outlined
    case filled
}

public struct DSCard<Content: View>: View {
    let style: DSCardStyle
    let padding: CGFloat
    let content: () -> Content
    
    @State private var isPressed = false
    
    public init(
        style: DSCardStyle = .elevated,
        padding: CGFloat = SpacingTokens.Component.cardPadding,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.style = style
        self.padding = padding
        self.content = content
    }
    
    public var body: some View {
        content()
            .padding(padding)
            .background(backgroundColor)
            .cornerRadius(RadiusTokens.Component.card)
            .overlay(
                RoundedRectangle(cornerRadius: RadiusTokens.Component.card)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .shadow(
                color: shadowColor,
                radius: shadowRadius,
                x: 0,
                y: shadowY
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(AnimationTokens.Spring.smooth, value: isPressed)
    }
    
    // MARK: - Computed Properties
    private var backgroundColor: Color {
        switch style {
        case .elevated:
            return ColorTokens.Surface.primary
        case .outlined:
            return ColorTokens.Background.primary
        case .filled:
            return ColorTokens.Surface.secondary
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .outlined:
            return ColorTokens.Neutral.gray300
        default:
            return Color.clear
        }
    }
    
    private var borderWidth: CGFloat {
        switch style {
        case .outlined:
            return 1
        default:
            return 0
        }
    }
    
    private var shadowColor: Color {
        switch style {
        case .elevated:
            return ShadowTokens.md.color
        default:
            return Color.clear
        }
    }
    
    private var shadowRadius: CGFloat {
        switch style {
        case .elevated:
            return ShadowTokens.md.radius
        default:
            return 0
        }
    }
    
    private var shadowY: CGFloat {
        switch style {
        case .elevated:
            return ShadowTokens.md.y
        default:
            return 0
        }
    }
}

// MARK: - Interactive Card
public struct DSInteractiveCard<Content: View>: View {
    let style: DSCardStyle
    let padding: CGFloat
    let action: () -> Void
    let content: () -> Content
    
    @State private var isPressed = false
    
    public init(
        style: DSCardStyle = .elevated,
        padding: CGFloat = SpacingTokens.Component.cardPadding,
        action: @escaping () -> Void,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.style = style
        self.padding = padding
        self.action = action
        self.content = content
    }
    
    public var body: some View {
        Button(action: action) {
            DSCard(style: style, padding: padding) {
                content()
            }
        }
        .buttonStyle(PlainButtonStyle())
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(AnimationTokens.Spring.snappy, value: isPressed)
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Category Card
public struct DSCategoryCard: View {
    let name: String
    let description: String
    let icon: Image
    let color: Color
    let questionCount: Int
    let action: () -> Void
    
    @State private var isHovered = false
    
    public init(
        name: String,
        description: String,
        icon: Image,
        color: Color,
        questionCount: Int,
        action: @escaping () -> Void
    ) {
        self.name = name
        self.description = description
        self.icon = icon
        self.color = color
        self.questionCount = questionCount
        self.action = action
    }
    
    public var body: some View {
        DSInteractiveCard(action: action) {
            VStack(alignment: .leading, spacing: SpacingTokens.sm) {
                HStack {
                    icon
                        .font(.system(size: SizeTokens.Icon.lg))
                        .foregroundColor(color)
                        .frame(width: SizeTokens.Icon.xl, height: SizeTokens.Icon.xl)
                        .background(color.opacity(0.15))
                        .cornerRadius(RadiusTokens.md)
                    
                    Spacer()
                    
                    Text("\(questionCount)")
                        .captionBold()
                        .foregroundColor(ColorTokens.Text.secondary)
                        .padding(.horizontal, SpacingTokens.xs)
                        .padding(.vertical, SpacingTokens.xxs)
                        .background(ColorTokens.Surface.tertiary)
                        .cornerRadius(RadiusTokens.Component.badge)
                }
                
                VStack(alignment: .leading, spacing: SpacingTokens.xxs) {
                    Text(name)
                        .headline()
                        .foregroundColor(ColorTokens.Text.primary)
                    
                    Text(description)
                        .caption()
                        .foregroundColor(ColorTokens.Text.secondary)
                        .lineLimit(2)
                }
            }
        }
        .frame(minHeight: SizeTokens.Height.card)
        .accessibilityLabel("\(name) category with \(questionCount) questions")
        .accessibilityHint(description)
    }
}

// MARK: - Stats Card
public struct DSStatsCard: View {
    let title: String
    let value: String
    let subtitle: String?
    let icon: Image
    let color: Color
    
    public init(
        title: String,
        value: String,
        subtitle: String? = nil,
        icon: Image,
        color: Color
    ) {
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.icon = icon
        self.color = color
    }
    
    public var body: some View {
        DSCard(style: .filled) {
            HStack(spacing: SpacingTokens.md) {
                icon
                    .font(.system(size: SizeTokens.Icon.md))
                    .foregroundColor(color)
                    .frame(width: SizeTokens.Icon.lg, height: SizeTokens.Icon.lg)
                    .background(color.opacity(0.15))
                    .cornerRadius(RadiusTokens.sm)
                
                VStack(alignment: .leading, spacing: SpacingTokens.xxxs) {
                    Text(title)
                        .caption()
                        .foregroundColor(ColorTokens.Text.secondary)
                    
                    Text(value)
                        .title3()
                        .foregroundColor(ColorTokens.Text.primary)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .footnote()
                            .foregroundColor(ColorTokens.Text.tertiary)
                    }
                }
                
                Spacer()
            }
        }
        .accessibilityLabel("\(title): \(value)")
    }
}

// MARK: - Preview
struct DSCard_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: SpacingTokens.md) {
                DSCard(style: .elevated) {
                    Text("Elevated Card")
                        .headline()
                }
                
                DSCard(style: .outlined) {
                    Text("Outlined Card")
                        .headline()
                }
                
                DSCard(style: .filled) {
                    Text("Filled Card")
                        .headline()
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
            .padding()
        }
        .previewLayout(.sizeThatFits)
    }
}