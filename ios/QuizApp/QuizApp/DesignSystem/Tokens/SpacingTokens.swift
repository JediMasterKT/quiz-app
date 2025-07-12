import SwiftUI

public struct SpacingTokens {
    // MARK: - Base Spacing Scale (4pt grid system)
    static let xxxs: CGFloat = 2   // 0.5x
    static let xxs: CGFloat = 4    // 1x
    static let xs: CGFloat = 8     // 2x
    static let sm: CGFloat = 12    // 3x
    static let md: CGFloat = 16    // 4x (base)
    static let lg: CGFloat = 24    // 6x
    static let xl: CGFloat = 32    // 8x
    static let xxl: CGFloat = 48   // 12x
    static let xxxl: CGFloat = 64  // 16x
    static let xxxxl: CGFloat = 96 // 24x
    
    // MARK: - Component Spacing
    struct Component {
        static let buttonPaddingHorizontal: CGFloat = md
        static let buttonPaddingVertical: CGFloat = sm
        static let cardPadding: CGFloat = md
        static let inputPadding: CGFloat = sm
        static let listItemSpacing: CGFloat = xs
        static let sectionSpacing: CGFloat = lg
    }
    
    // MARK: - Layout Spacing
    struct Layout {
        static let screenPadding: CGFloat = md
        static let containerPadding: CGFloat = lg
        static let gridSpacing: CGFloat = md
        static let stackSpacing: CGFloat = md
    }
}

// MARK: - Size Tokens
public struct SizeTokens {
    // MARK: - Component Heights
    struct Height {
        static let buttonSmall: CGFloat = 36
        static let buttonMedium: CGFloat = 44
        static let buttonLarge: CGFloat = 56
        static let inputField: CGFloat = 48
        static let navigationBar: CGFloat = 44
        static let tabBar: CGFloat = 49
        static let card: CGFloat = 120
        static let progressBar: CGFloat = 8
    }
    
    // MARK: - Component Widths
    struct Width {
        static let buttonMinimum: CGFloat = 120
        static let cardMinimum: CGFloat = 280
        static let cardMaximum: CGFloat = 400
        static let contentMaximum: CGFloat = 600
    }
    
    // MARK: - Icon Sizes
    struct Icon {
        static let xs: CGFloat = 16
        static let sm: CGFloat = 20
        static let md: CGFloat = 24
        static let lg: CGFloat = 32
        static let xl: CGFloat = 48
        static let xxl: CGFloat = 64
    }
    
    // MARK: - Avatar Sizes
    struct Avatar {
        static let xs: CGFloat = 24
        static let sm: CGFloat = 32
        static let md: CGFloat = 48
        static let lg: CGFloat = 64
        static let xl: CGFloat = 96
        static let xxl: CGFloat = 128
    }
}

// MARK: - Radius Tokens
public struct RadiusTokens {
    static let none: CGFloat = 0
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let full: CGFloat = 9999
    
    // MARK: - Component Specific
    struct Component {
        static let button: CGFloat = md
        static let card: CGFloat = lg
        static let input: CGFloat = sm
        static let badge: CGFloat = full
        static let avatar: CGFloat = full
        static let sheet: CGFloat = xl
    }
}

// MARK: - Shadow Tokens
public struct ShadowTokens {
    static let none = ShadowStyle(color: .clear, radius: 0, x: 0, y: 0)
    static let xs = ShadowStyle(color: ColorTokens.Neutral.black.opacity(0.05), radius: 2, x: 0, y: 1)
    static let sm = ShadowStyle(color: ColorTokens.Neutral.black.opacity(0.1), radius: 4, x: 0, y: 2)
    static let md = ShadowStyle(color: ColorTokens.Neutral.black.opacity(0.1), radius: 8, x: 0, y: 4)
    static let lg = ShadowStyle(color: ColorTokens.Neutral.black.opacity(0.15), radius: 16, x: 0, y: 8)
    static let xl = ShadowStyle(color: ColorTokens.Neutral.black.opacity(0.2), radius: 24, x: 0, y: 12)
    
    struct ShadowStyle {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }
}

// MARK: - Animation Tokens
public struct AnimationTokens {
    // MARK: - Durations
    struct Duration {
        static let instant: Double = 0.1
        static let fast: Double = 0.2
        static let normal: Double = 0.3
        static let slow: Double = 0.5
        static let slower: Double = 0.8
        static let slowest: Double = 1.0
    }
    
    // MARK: - Spring Animations
    struct Spring {
        static let bouncy = Animation.spring(response: 0.5, dampingFraction: 0.6, blendDuration: 0)
        static let smooth = Animation.spring(response: 0.5, dampingFraction: 0.8, blendDuration: 0)
        static let snappy = Animation.spring(response: 0.3, dampingFraction: 0.8, blendDuration: 0)
    }
    
    // MARK: - Easing Curves
    struct Easing {
        static let linear = Animation.linear
        static let easeIn = Animation.easeIn
        static let easeOut = Animation.easeOut
        static let easeInOut = Animation.easeInOut
    }
}

// MARK: - Spacing Extensions
extension View {
    func padding(_ spacing: CGFloat) -> some View {
        self.padding(spacing)
    }
    
    func horizontalPadding(_ spacing: CGFloat) -> some View {
        self.padding(.horizontal, spacing)
    }
    
    func verticalPadding(_ spacing: CGFloat) -> some View {
        self.padding(.vertical, spacing)
    }
    
    func topPadding(_ spacing: CGFloat) -> some View {
        self.padding(.top, spacing)
    }
    
    func bottomPadding(_ spacing: CGFloat) -> some View {
        self.padding(.bottom, spacing)
    }
    
    func leadingPadding(_ spacing: CGFloat) -> some View {
        self.padding(.leading, spacing)
    }
    
    func trailingPadding(_ spacing: CGFloat) -> some View {
        self.padding(.trailing, spacing)
    }
}