# QuizApp iOS

SwiftUI-based iOS application for the QuizApp.

## Requirements
- iOS 15.0+
- Xcode 14.0+
- Swift 5.7+

## Setup
1. Open QuizApp.xcodeproj in Xcode
2. Select your development team in project settings
3. Build and run on simulator or device

## Architecture
- SwiftUI for UI
- Combine for reactive programming
- Core Data for local storage
- Network layer with URLSession and Combine

## Features
- User authentication with Keychain storage
- Solo quiz gameplay
- Multiplayer quiz rooms (Phase 2)
- Real-time video/audio (Phase 2)

## Project Structure
```
QuizApp/
├── App/
│   ├── QuizAppApp.swift
│   └── ContentView.swift
├── Models/
│   ├── User.swift
│   ├── Question.swift
│   └── GameSession.swift
├── Views/
│   ├── Authentication/
│   ├── Quiz/
│   ├── Multiplayer/
│   └── Common/
├── ViewModels/
├── Services/
│   ├── NetworkService.swift
│   ├── AuthService.swift
│   └── CoreDataService.swift
├── Utilities/
└── Resources/
```

## Environment Configuration
Update the base URL in `NetworkService.swift` to point to your backend server:

```swift
private let baseURL = "http://localhost:3000/api" // Development
// private let baseURL = "https://your-production-url.com/api" // Production
```

## Building and Running
1. Ensure the backend server is running
2. Update network configuration if needed
3. Build and run the project in Xcode