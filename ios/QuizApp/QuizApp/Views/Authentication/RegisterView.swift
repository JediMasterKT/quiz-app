import SwiftUI

struct RegisterView: View {
    @StateObject private var authService = AuthService()
    @Environment(\.presentationMode) var presentationMode
    
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "person.crop.circle.fill.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                        
                        Text("Create Account")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Join QuizApp and start your journey")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Registration Form
                    VStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Username")
                                .font(.headline)
                            
                            TextField("Choose a username", text: $username)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.headline)
                            
                            TextField("Enter your email", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("First Name")
                                    .font(.headline)
                                
                                TextField("Optional", text: $firstName)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Last Name")
                                    .font(.headline)
                                
                                TextField("Optional", text: $lastName)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.headline)
                            
                            SecureField("Choose a password", text: $password)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Confirm Password")
                                .font(.headline)
                            
                            SecureField("Confirm your password", text: $confirmPassword)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // Password requirements
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Password must contain:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Image(systemName: password.count >= 8 ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(password.count >= 8 ? .green : .gray)
                                Text("At least 8 characters")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            HStack {
                                Image(systemName: hasUppercase ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(hasUppercase ? .green : .gray)
                                Text("One uppercase letter")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            HStack {
                                Image(systemName: hasLowercase ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(hasLowercase ? .green : .gray)
                                Text("One lowercase letter")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            HStack {
                                Image(systemName: hasNumber ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(hasNumber ? .green : .gray)
                                Text("One number")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            HStack {
                                Image(systemName: passwordsMatch ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(passwordsMatch ? .green : .gray)
                                Text("Passwords match")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.top, 8)
                        
                        if let errorMessage = authService.errorMessage {
                            Text(errorMessage)
                                .foregroundColor(.red)
                                .font(.caption)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button(action: register) {
                            HStack {
                                if authService.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Create Account")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(isFormValid ? Color.blue : Color.gray)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(!isFormValid || authService.isLoading)
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .onTapGesture {
                hideKeyboard()
            }
        }
        .environmentObject(authService)
        .onChange(of: authService.isAuthenticated) { isAuthenticated in
            if isAuthenticated {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
    
    private var isFormValid: Bool {
        !username.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        isValidEmail(email) &&
        isValidUsername(username) &&
        isValidPassword(password) &&
        passwordsMatch
    }
    
    private var hasUppercase: Bool {
        password.rangeOfCharacter(from: CharacterSet.uppercaseLetters) != nil
    }
    
    private var hasLowercase: Bool {
        password.rangeOfCharacter(from: CharacterSet.lowercaseLetters) != nil
    }
    
    private var hasNumber: Bool {
        password.rangeOfCharacter(from: CharacterSet.decimalDigits) != nil
    }
    
    private var passwordsMatch: Bool {
        !password.isEmpty && !confirmPassword.isEmpty && password == confirmPassword
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        return email.range(of: emailRegex, options: .regularExpression) != nil
    }
    
    private func isValidUsername(_ username: String) -> Bool {
        let usernameRegex = "^[A-Za-z0-9]{3,50}$"
        return username.range(of: usernameRegex, options: .regularExpression) != nil
    }
    
    private func isValidPassword(_ password: String) -> Bool {
        password.count >= 8 && hasUppercase && hasLowercase && hasNumber
    }
    
    private func register() {
        authService.register(
            username: username,
            email: email,
            password: password,
            firstName: firstName.isEmpty ? nil : firstName,
            lastName: lastName.isEmpty ? nil : lastName
        )
    }
    
    private func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

struct RegisterView_Previews: PreviewProvider {
    static var previews: some View {
        RegisterView()
    }
}