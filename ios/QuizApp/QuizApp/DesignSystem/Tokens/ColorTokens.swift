import SwiftUI

public struct ColorTokens {
    // MARK: - Brand Colors
    struct Brand {
        static let primary = Color(hex: "007AFF")
        static let secondary = Color(hex: "5856D6")
        static let tertiary = Color(hex: "FF3B30")
    }
    
    // MARK: - Semantic Colors
    struct Semantic {
        static let success = Color(hex: "34C759")
        static let warning = Color(hex: "FF9500")
        static let error = Color(hex: "FF3B30")
        static let info = Color(hex: "007AFF")
    }
    
    // MARK: - Neutral Colors
    struct Neutral {
        static let black = Color(hex: "000000")
        static let gray900 = Color(hex: "1C1C1E")
        static let gray800 = Color(hex: "2C2C2E")
        static let gray700 = Color(hex: "3A3A3C")
        static let gray600 = Color(hex: "48484A")
        static let gray500 = Color(hex: "636366")
        static let gray400 = Color(hex: "8E8E93")
        static let gray300 = Color(hex: "C7C7CC")
        static let gray200 = Color(hex: "E5E5EA")
        static let gray100 = Color(hex: "F2F2F7")
        static let white = Color(hex: "FFFFFF")
    }
    
    // MARK: - Category Colors
    struct Category {
        static let science = Color(hex: "00C7BE")
        static let history = Color(hex: "FF6B6B")
        static let geography = Color(hex: "4ECDC4")
        static let literature = Color(hex: "A8E6CF")
        static let sports = Color(hex: "FFD93D")
        static let entertainment = Color(hex: "FF8CC8")
        static let technology = Color(hex: "95E1D3")
        static let art = Color(hex: "C7CEEA")
        static let music = Color(hex: "FFDAB9")
        static let general = Color(hex: "B4A7D6")
    }
    
    // MARK: - Difficulty Colors
    struct Difficulty {
        static let beginner = Color(hex: "34C759")
        static let easy = Color(hex: "5AC8FA")
        static let intermediate = Color(hex: "FF9500")
        static let advanced = Color(hex: "FF3B30")
        static let expert = Color(hex: "AF52DE")
    }
    
    // MARK: - Background Colors
    struct Background {
        static let primary = Color("BackgroundPrimary")
        static let secondary = Color("BackgroundSecondary")
        static let tertiary = Color("BackgroundTertiary")
        static let elevated = Color("BackgroundElevated")
    }
    
    // MARK: - Text Colors
    struct Text {
        static let primary = Color("TextPrimary")
        static let secondary = Color("TextSecondary")
        static let tertiary = Color("TextTertiary")
        static let quaternary = Color("TextQuaternary")
        static let onBrand = Color.white
        static let onDark = Color.white
    }
    
    // MARK: - Surface Colors
    struct Surface {
        static let primary = Color("SurfacePrimary")
        static let secondary = Color("SurfaceSecondary")
        static let tertiary = Color("SurfaceTertiary")
        static let overlay = Color.black.opacity(0.4)
    }
}

// MARK: - Color Extension for Hex Support
extension Color {
    init(hex: String) {
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
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}