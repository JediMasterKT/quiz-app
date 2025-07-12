import SwiftUI

public struct TypographyTokens {
    // MARK: - Font Families
    struct FontFamily {
        static let primary = "SF Pro Display"
        static let secondary = "SF Pro Text"
        static let monospace = "SF Mono"
    }
    
    // MARK: - Font Sizes
    struct FontSize {
        static let xxxl: CGFloat = 48
        static let xxl: CGFloat = 36
        static let xl: CGFloat = 28
        static let large: CGFloat = 24
        static let medium: CGFloat = 20
        static let regular: CGFloat = 17
        static let small: CGFloat = 15
        static let xs: CGFloat = 13
        static let xxs: CGFloat = 11
    }
    
    // MARK: - Font Weights
    struct FontWeight {
        static let black = Font.Weight.black
        static let heavy = Font.Weight.heavy
        static let bold = Font.Weight.bold
        static let semibold = Font.Weight.semibold
        static let medium = Font.Weight.medium
        static let regular = Font.Weight.regular
        static let light = Font.Weight.light
        static let thin = Font.Weight.thin
    }
    
    // MARK: - Line Heights
    struct LineHeight {
        static let tight: CGFloat = 1.1
        static let snug: CGFloat = 1.25
        static let normal: CGFloat = 1.5
        static let relaxed: CGFloat = 1.75
        static let loose: CGFloat = 2.0
    }
    
    // MARK: - Letter Spacing
    struct LetterSpacing {
        static let tighter: CGFloat = -0.05
        static let tight: CGFloat = -0.025
        static let normal: CGFloat = 0
        static let wide: CGFloat = 0.025
        static let wider: CGFloat = 0.05
        static let widest: CGFloat = 0.1
    }
    
    // MARK: - Text Styles
    struct TextStyle {
        static let hero = Font.system(size: FontSize.xxxl, weight: FontWeight.bold, design: .rounded)
        static let title1 = Font.system(size: FontSize.xxl, weight: FontWeight.bold, design: .rounded)
        static let title2 = Font.system(size: FontSize.xl, weight: FontWeight.semibold, design: .rounded)
        static let title3 = Font.system(size: FontSize.large, weight: FontWeight.semibold, design: .rounded)
        static let headline = Font.system(size: FontSize.medium, weight: FontWeight.semibold, design: .rounded)
        static let body = Font.system(size: FontSize.regular, weight: FontWeight.regular, design: .default)
        static let bodyBold = Font.system(size: FontSize.regular, weight: FontWeight.semibold, design: .default)
        static let callout = Font.system(size: FontSize.small, weight: FontWeight.regular, design: .default)
        static let caption = Font.system(size: FontSize.xs, weight: FontWeight.regular, design: .default)
        static let captionBold = Font.system(size: FontSize.xs, weight: FontWeight.semibold, design: .default)
        static let footnote = Font.system(size: FontSize.xxs, weight: FontWeight.regular, design: .default)
        static let code = Font.system(size: FontSize.small, weight: FontWeight.regular, design: .monospaced)
    }
}

// MARK: - Typography View Modifier
struct TypographyModifier: ViewModifier {
    let font: Font
    let lineHeight: CGFloat?
    let letterSpacing: CGFloat?
    let textColor: Color?
    
    func body(content: Content) -> some View {
        content
            .font(font)
            .lineSpacing(lineHeight != nil ? calculateLineSpacing(for: font, lineHeight: lineHeight!) : 0)
            .tracking(letterSpacing ?? 0)
            .foregroundColor(textColor ?? ColorTokens.Text.primary)
    }
    
    private func calculateLineSpacing(for font: Font, lineHeight: CGFloat) -> CGFloat {
        // This is a simplified calculation
        // In a real app, you might want to calculate based on actual font metrics
        let fontSize = getFontSize(from: font)
        return (fontSize * lineHeight) - fontSize
    }
    
    private func getFontSize(from font: Font) -> CGFloat {
        // This is a simplified implementation
        // You might need a more sophisticated approach based on your needs
        return TypographyTokens.FontSize.regular
    }
}

// MARK: - Typography Extensions
extension View {
    func typography(_ style: Font, lineHeight: CGFloat? = nil, letterSpacing: CGFloat? = nil, color: Color? = nil) -> some View {
        self.modifier(TypographyModifier(font: style, lineHeight: lineHeight, letterSpacing: letterSpacing, textColor: color))
    }
    
    // Convenience methods for common text styles
    func heroText(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.hero, lineHeight: TypographyTokens.LineHeight.tight, color: color)
    }
    
    func title1(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.title1, lineHeight: TypographyTokens.LineHeight.snug, color: color)
    }
    
    func title2(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.title2, lineHeight: TypographyTokens.LineHeight.snug, color: color)
    }
    
    func title3(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.title3, lineHeight: TypographyTokens.LineHeight.normal, color: color)
    }
    
    func headline(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.headline, lineHeight: TypographyTokens.LineHeight.normal, color: color)
    }
    
    func bodyText(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.body, lineHeight: TypographyTokens.LineHeight.relaxed, color: color)
    }
    
    func bodyBold(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.bodyBold, lineHeight: TypographyTokens.LineHeight.relaxed, color: color)
    }
    
    func callout(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.callout, lineHeight: TypographyTokens.LineHeight.normal, color: color)
    }
    
    func caption(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.caption, lineHeight: TypographyTokens.LineHeight.normal, color: color)
    }
    
    func captionBold(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.captionBold, lineHeight: TypographyTokens.LineHeight.normal, color: color)
    }
    
    func footnote(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.footnote, lineHeight: TypographyTokens.LineHeight.tight, color: color)
    }
    
    func codeText(color: Color? = nil) -> some View {
        self.typography(TypographyTokens.TextStyle.code, letterSpacing: TypographyTokens.LetterSpacing.wide, color: color)
    }
}