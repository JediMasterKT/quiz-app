import Foundation
import Combine

class AuthService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared
    
    init() {
        checkAuthStatus()
    }
    
    func register(username: String, email: String, password: String, firstName: String?, lastName: String?) {
        isLoading = true
        errorMessage = nil
        
        let registerData = RegisterRequest(
            username: username,
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        
        networkService.request(
            endpoint: .register,
            method: .POST,
            body: registerData,
            responseType: AuthResponse.self
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] response in
                if response.success, let data = response.data {
                    self?.handleAuthSuccess(data)
                } else {
                    self?.errorMessage = response.message
                    if let errors = response.errors, !errors.isEmpty {
                        self?.errorMessage = errors.map { $0.msg }.joined(separator: ", ")
                    }
                }
            }
        )
        .store(in: &cancellables)
    }
    
    func login(email: String, password: String) {
        isLoading = true
        errorMessage = nil
        
        let loginData = LoginRequest(email: email, password: password)
        
        networkService.request(
            endpoint: .login,
            method: .POST,
            body: loginData,
            responseType: AuthResponse.self
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] response in
                if response.success, let data = response.data {
                    self?.handleAuthSuccess(data)
                } else {
                    self?.errorMessage = response.message
                    if let errors = response.errors, !errors.isEmpty {
                        self?.errorMessage = errors.map { $0.msg }.joined(separator: ", ")
                    }
                }
            }
        )
        .store(in: &cancellables)
    }
    
    func logout() {
        TokenManager.shared.removeToken()
        currentUser = nil
        isAuthenticated = false
        errorMessage = nil
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    private func handleAuthSuccess(_ data: AuthData) {
        TokenManager.shared.saveToken(data.token)
        currentUser = data.user
        isAuthenticated = true
        errorMessage = nil
    }
    
    private func checkAuthStatus() {
        guard let token = TokenManager.shared.getToken() else {
            return
        }
        
        // Validate token with server
        networkService.request(
            endpoint: .profile,
            method: .GET,
            responseType: AuthResponse.self
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                if case .failure = completion {
                    // Token is invalid, remove it
                    self?.logout()
                }
            },
            receiveValue: { [weak self] response in
                if response.success, let data = response.data {
                    self?.currentUser = data.user
                    self?.isAuthenticated = true
                } else {
                    self?.logout()
                }
            }
        )
        .store(in: &cancellables)
    }
}