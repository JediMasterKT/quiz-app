import SwiftUI

@main
struct QuizAppApp: App {
    @StateObject private var authService = AuthService()
    
    #if DEBUG
    @AppStorage("showDesignSystem") private var showDesignSystem = false
    #endif
    
    var body: some Scene {
        WindowGroup {
            #if DEBUG
            if showDesignSystem {
                DesignSystemShowcase()
                    .applyDesignSystem()
            } else {
                ContentView()
                    .environmentObject(authService)
                    .applyDesignSystem()
            }
            #else
            ContentView()
                .environmentObject(authService)
                .applyDesignSystem()
            #endif
        }
    }
}