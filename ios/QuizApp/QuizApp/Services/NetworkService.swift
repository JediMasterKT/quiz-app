import Foundation
import Combine

enum APIEndpoint {
    case register
    case login
    case profile
    case logout
    case forgotPassword
    case resetPassword
    
    var path: String {
        switch self {
        case .register: return "/auth/register"
        case .login: return "/auth/login"
        case .profile: return "/auth/profile"
        case .logout: return "/auth/logout"
        case .forgotPassword: return "/auth/forgot-password"
        case .resetPassword: return "/auth/reset-password"
        }
    }
}

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

class NetworkService {
    static let shared = NetworkService()
    
    // Update this URL to match your backend server
    private let baseURL = "http://localhost:3000/api"
    
    private init() {}
    
    func request<T: Codable>(
        endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, NetworkError> {
        
        guard let url = URL(string: baseURL + endpoint.path) else {
            return Fail(error: NetworkError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header if token exists
        if let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if provided
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                return Fail(error: NetworkError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: T.self, decoder: JSONDecoder.dateDecoder)
            .mapError { error in
                if error is DecodingError {
                    return NetworkError.decodingError
                }
                return NetworkError.serverError(error.localizedDescription)
            }
            .eraseToAnyPublisher()
    }
}

extension JSONDecoder {
    static var dateDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case encodingError
    case decodingError
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .encodingError:
            return "Failed to encode request"
        case .decodingError:
            return "Failed to decode response"
        case .serverError(let message):
            return message
        }
    }
}