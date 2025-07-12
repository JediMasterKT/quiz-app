import SwiftUI

public enum DSTextFieldStyle {
    case outlined
    case filled
}

public struct DSTextField: View {
    @Binding var text: String
    let placeholder: String
    let label: String?
    let helper: String?
    let error: String?
    let icon: Image?
    let trailingIcon: Image?
    let style: DSTextFieldStyle
    let keyboardType: UIKeyboardType
    let isSecure: Bool
    let onEditingChanged: ((Bool) -> Void)?
    let onCommit: (() -> Void)?
    
    @State private var isFocused = false
    @State private var showPassword = false
    
    public init(
        text: Binding<String>,
        placeholder: String,
        label: String? = nil,
        helper: String? = nil,
        error: String? = nil,
        icon: Image? = nil,
        trailingIcon: Image? = nil,
        style: DSTextFieldStyle = .outlined,
        keyboardType: UIKeyboardType = .default,
        isSecure: Bool = false,
        onEditingChanged: ((Bool) -> Void)? = nil,
        onCommit: (() -> Void)? = nil
    ) {
        self._text = text
        self.placeholder = placeholder
        self.label = label
        self.helper = helper
        self.error = error
        self.icon = icon
        self.trailingIcon = trailingIcon
        self.style = style
        self.keyboardType = keyboardType
        self.isSecure = isSecure
        self.onEditingChanged = onEditingChanged
        self.onCommit = onCommit
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: SpacingTokens.xs) {
            if let label = label {
                Text(label)
                    .caption()
                    .foregroundColor(ColorTokens.Text.secondary)
            }
            
            HStack(spacing: SpacingTokens.sm) {
                if let icon = icon {
                    icon
                        .font(.system(size: SizeTokens.Icon.sm))
                        .foregroundColor(iconColor)
                }
                
                if isSecure && !showPassword {
                    SecureField(placeholder, text: $text, onCommit: {
                        onCommit?()
                    })
                    .textFieldStyle(PlainTextFieldStyle())
                    .font(TypographyTokens.TextStyle.body)
                    .foregroundColor(ColorTokens.Text.primary)
                    .keyboardType(keyboardType)
                    .onTapGesture {
                        isFocused = true
                    }
                } else {
                    TextField(placeholder, text: $text, onEditingChanged: { editing in
                        isFocused = editing
                        onEditingChanged?(editing)
                    }, onCommit: {
                        onCommit?()
                    })
                    .textFieldStyle(PlainTextFieldStyle())
                    .font(TypographyTokens.TextStyle.body)
                    .foregroundColor(ColorTokens.Text.primary)
                    .keyboardType(keyboardType)
                }
                
                if isSecure {
                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                            .font(.system(size: SizeTokens.Icon.sm))
                            .foregroundColor(ColorTokens.Text.tertiary)
                    }
                    .buttonStyle(PlainButtonStyle())
                } else if let trailingIcon = trailingIcon {
                    trailingIcon
                        .font(.system(size: SizeTokens.Icon.sm))
                        .foregroundColor(ColorTokens.Text.tertiary)
                }
            }
            .padding(SpacingTokens.Component.inputPadding)
            .frame(height: SizeTokens.Height.inputField)
            .background(backgroundColor)
            .cornerRadius(RadiusTokens.Component.input)
            .overlay(
                RoundedRectangle(cornerRadius: RadiusTokens.Component.input)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .animation(AnimationTokens.Spring.smooth, value: isFocused)
            .animation(AnimationTokens.Spring.smooth, value: error != nil)
            
            if let error = error {
                HStack(spacing: SpacingTokens.xxs) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: SizeTokens.Icon.xs))
                    Text(error)
                        .caption()
                }
                .foregroundColor(ColorTokens.Semantic.error)
                .transition(.opacity.combined(with: .move(edge: .top)))
            } else if let helper = helper {
                Text(helper)
                    .caption()
                    .foregroundColor(ColorTokens.Text.tertiary)
                    .transition(.opacity)
            }
        }
        .accessibilityLabel(label ?? placeholder)
        .accessibilityValue(text)
        .accessibilityHint(error ?? helper ?? "")
    }
    
    // MARK: - Computed Properties
    private var backgroundColor: Color {
        switch style {
        case .outlined:
            return ColorTokens.Background.primary
        case .filled:
            return ColorTokens.Surface.secondary
        }
    }
    
    private var borderColor: Color {
        if error != nil {
            return ColorTokens.Semantic.error
        } else if isFocused {
            return ColorTokens.Brand.primary
        } else {
            switch style {
            case .outlined:
                return ColorTokens.Neutral.gray300
            case .filled:
                return Color.clear
            }
        }
    }
    
    private var borderWidth: CGFloat {
        switch style {
        case .outlined:
            return isFocused || error != nil ? 2 : 1
        case .filled:
            return 0
        }
    }
    
    private var iconColor: Color {
        if error != nil {
            return ColorTokens.Semantic.error
        } else if isFocused {
            return ColorTokens.Brand.primary
        } else {
            return ColorTokens.Text.tertiary
        }
    }
}

// MARK: - Email TextField
public struct DSEmailField: View {
    @Binding var email: String
    let label: String
    let error: String?
    let onEditingChanged: ((Bool) -> Void)?
    let onCommit: (() -> Void)?
    
    public init(
        email: Binding<String>,
        label: String = "Email",
        error: String? = nil,
        onEditingChanged: ((Bool) -> Void)? = nil,
        onCommit: (() -> Void)? = nil
    ) {
        self._email = email
        self.label = label
        self.error = error
        self.onEditingChanged = onEditingChanged
        self.onCommit = onCommit
    }
    
    public var body: some View {
        DSTextField(
            text: $email,
            placeholder: "Enter your email",
            label: label,
            error: error,
            icon: Image(systemName: "envelope"),
            keyboardType: .emailAddress,
            onEditingChanged: onEditingChanged,
            onCommit: onCommit
        )
        .textContentType(.emailAddress)
        .autocapitalization(.none)
        .disableAutocorrection(true)
    }
}

// MARK: - Password TextField
public struct DSPasswordField: View {
    @Binding var password: String
    let label: String
    let helper: String?
    let error: String?
    let onEditingChanged: ((Bool) -> Void)?
    let onCommit: (() -> Void)?
    
    public init(
        password: Binding<String>,
        label: String = "Password",
        helper: String? = nil,
        error: String? = nil,
        onEditingChanged: ((Bool) -> Void)? = nil,
        onCommit: (() -> Void)? = nil
    ) {
        self._password = password
        self.label = label
        self.helper = helper
        self.error = error
        self.onEditingChanged = onEditingChanged
        self.onCommit = onCommit
    }
    
    public var body: some View {
        DSTextField(
            text: $password,
            placeholder: "Enter your password",
            label: label,
            helper: helper,
            error: error,
            icon: Image(systemName: "lock"),
            isSecure: true,
            onEditingChanged: onEditingChanged,
            onCommit: onCommit
        )
        .textContentType(.password)
    }
}

// MARK: - Search Field
public struct DSSearchField: View {
    @Binding var searchText: String
    let placeholder: String
    let onSearch: (() -> Void)?
    
    public init(
        searchText: Binding<String>,
        placeholder: String = "Search...",
        onSearch: (() -> Void)? = nil
    ) {
        self._searchText = searchText
        self.placeholder = placeholder
        self.onSearch = onSearch
    }
    
    public var body: some View {
        DSTextField(
            text: $searchText,
            placeholder: placeholder,
            icon: Image(systemName: "magnifyingglass"),
            trailingIcon: searchText.isEmpty ? nil : Image(systemName: "xmark.circle.fill"),
            style: .filled,
            onCommit: onSearch
        )
        .overlay(alignment: .trailing) {
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: SizeTokens.Icon.sm))
                        .foregroundColor(ColorTokens.Text.tertiary)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.trailing, SpacingTokens.Component.inputPadding)
            }
        }
    }
}

// MARK: - Preview
struct DSTextField_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: SpacingTokens.lg) {
            DSTextField(
                text: .constant(""),
                placeholder: "Enter text",
                label: "Label",
                helper: "Helper text"
            )
            
            DSTextField(
                text: .constant("Invalid input"),
                placeholder: "Enter text",
                label: "Error State",
                error: "This field is required"
            )
            
            DSEmailField(
                email: .constant(""),
                error: nil
            )
            
            DSPasswordField(
                password: .constant(""),
                helper: "Must be at least 8 characters"
            )
            
            DSSearchField(
                searchText: .constant("Search query")
            )
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}