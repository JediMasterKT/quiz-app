import Foundation
import CoreData
import Combine

class CoreDataManager: ObservableObject {
    static let shared = CoreDataManager()
    
    // Storage limit: 50MB as per requirements
    private let maxStorageSize: Int64 = 50 * 1024 * 1024 // 50MB in bytes
    
    private init() {}
    
    // MARK: - Core Data Stack
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "QuizDataModel")
        
        // Configure for optimal performance
        container.persistentStoreDescriptions.first?.setOption(true as NSNumber, 
                                                              forKey: NSPersistentHistoryTrackingKey)
        container.persistentStoreDescriptions.first?.setOption(true as NSNumber, 
                                                              forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        
        container.loadPersistentStores { [weak self] _, error in
            if let error = error as NSError? {
                print("Core Data error: \(error), \(error.userInfo)")
                // In production, handle this error appropriately
            } else {
                print("Core Data loaded successfully")
            }
            
            // Enable automatic merging
            container.viewContext.automaticallyMergesChangesFromParent = true
            container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
            
            // Start periodic cleanup
            self?.schedulePeriodicCleanup()
        }
        
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    // Background context for heavy operations
    lazy var backgroundContext: NSManagedObjectContext = {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }()
    
    // MARK: - Core Data Operations
    
    func save() {
        let context = viewContext
        
        if context.hasChanges {
            do {
                try context.save()
                print("Core Data saved successfully")
            } catch {
                print("Core Data save error: \(error)")
            }
        }
    }
    
    func saveInBackground(_ block: @escaping (NSManagedObjectContext) -> Void) {
        backgroundContext.perform {
            block(self.backgroundContext)
            
            if self.backgroundContext.hasChanges {
                do {
                    try self.backgroundContext.save()
                    print("Background Core Data save successful")
                } catch {
                    print("Background Core Data save error: \(error)")
                }
            }
        }
    }
    
    // MARK: - Intelligent Question Caching
    
    func cacheQuestions(_ questions: [Question], for config: QuizConfig) {
        saveInBackground { context in
            // Remove old cached questions for this configuration
            self.clearCachedQuestions(for: config, in: context)
            
            let cacheTime = Date()
            
            // Cache new questions
            for question in questions {
                let cachedQuestion = CachedQuestion(context: context)
                cachedQuestion.id = Int32(question.id)
                cachedQuestion.questionText = question.questionText
                cachedQuestion.questionType = question.questionType.rawValue
                cachedQuestion.options = question.options
                cachedQuestion.difficultyLevel = Int32(question.difficultyLevel)
                cachedQuestion.points = Int32(question.points)
                cachedQuestion.timeLimit = Int32(question.timeLimit)
                cachedQuestion.imageUrl = question.imageUrl
                cachedQuestion.audioUrl = question.audioUrl
                cachedQuestion.hint = question.hint
                cachedQuestion.explanation = question.explanation
                cachedQuestion.categoryId = Int32(question.categoryId)
                cachedQuestion.categoryName = question.category?.name
                cachedQuestion.categoryColorCode = question.category?.colorCode
                cachedQuestion.usageCount = Int32(question.usageCount ?? 0)
                cachedQuestion.successRate = question.successRate ?? 0.0
                cachedQuestion.cachedAt = cacheTime
                cachedQuestion.lastAccessedAt = cacheTime
                
                // Configuration for smart retrieval
                cachedQuestion.configCategoryId = Int32(config.categoryId ?? 0)
                cachedQuestion.configDifficultyLevel = Int32(config.difficultyLevel ?? 0)
                cachedQuestion.configQuestionCount = Int32(config.questionCount)
                cachedQuestion.priority = self.calculateCachePriority(for: question)
            }
            
            // Enforce storage limits after caching
            self.enforceStorageLimits(in: context)
        }
    }
    
    func getCachedQuestions(for config: QuizConfig) -> [Question] {
        let request: NSFetchRequest<CachedQuestion> = CachedQuestion.fetchRequest()
        
        // Build smart predicate
        var predicates: [NSPredicate] = []
        
        // Configuration matching
        if let categoryId = config.categoryId {
            predicates.append(NSPredicate(format: "configCategoryId == %d", categoryId))
        } else {
            predicates.append(NSPredicate(format: "configCategoryId == 0"))
        }
        
        if let difficultyLevel = config.difficultyLevel {
            predicates.append(NSPredicate(format: "configDifficultyLevel == %d", difficultyLevel))
        } else {
            predicates.append(NSPredicate(format: "configDifficultyLevel == 0"))
        }
        
        predicates.append(NSPredicate(format: "configQuestionCount == %d", config.questionCount))
        
        // Only get fresh questions (within 24 hours)
        let dayAgo = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        predicates.append(NSPredicate(format: "cachedAt >= %@", dayAgo as NSDate))
        
        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \CachedQuestion.priority, ascending: false),
            NSSortDescriptor(keyPath: \CachedQuestion.id, ascending: true)
        ]
        
        do {
            let cachedQuestions = try viewContext.fetch(request)
            
            // Update last accessed time for cache management
            for cachedQuestion in cachedQuestions {
                cachedQuestion.lastAccessedAt = Date()
            }
            save()
            
            return cachedQuestions.compactMap { cached in
                self.convertToQuestion(cached)
            }
        } catch {
            print("Error fetching cached questions: \(error)")
            return []
        }
    }
    
    func hasCachedQuestions(for config: QuizConfig) -> Bool {
        return !getCachedQuestions(for: config).isEmpty
    }
    
    func isCacheFresh(for config: QuizConfig) -> Bool {
        let request: NSFetchRequest<CachedQuestion> = CachedQuestion.fetchRequest()
        
        var predicates: [NSPredicate] = []
        
        if let categoryId = config.categoryId {
            predicates.append(NSPredicate(format: "configCategoryId == %d", categoryId))
        } else {
            predicates.append(NSPredicate(format: "configCategoryId == 0"))
        }
        
        if let difficultyLevel = config.difficultyLevel {
            predicates.append(NSPredicate(format: "configDifficultyLevel == %d", difficultyLevel))
        } else {
            predicates.append(NSPredicate(format: "configDifficultyLevel == 0"))
        }
        
        // Check if cache is less than 24 hours old
        let dayAgo = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        predicates.append(NSPredicate(format: "cachedAt >= %@", dayAgo as NSDate))
        
        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        request.fetchLimit = 1
        
        do {
            let count = try viewContext.count(for: request)
            return count > 0
        } catch {
            print("Error checking cache freshness: \(error)")
            return false
        }
    }
    
    // MARK: - User Progress Persistence with Sync Conflict Resolution
    
    func saveUserProgress(_ session: GameSession) {
        saveInBackground { context in
            // Check for existing progress record
            let request: NSFetchRequest<UserProgress> = UserProgress.fetchRequest()
            request.predicate = NSPredicate(format: "sessionId == %@", session.id)
            request.fetchLimit = 1
            
            do {
                let existingProgress = try context.fetch(request).first
                let progress = existingProgress ?? UserProgress(context: context)
                
                // Update progress data
                progress.sessionId = session.id
                progress.userId = Int32(session.userId)
                progress.sessionType = session.sessionType.rawValue
                progress.status = session.status.rawValue
                progress.totalQuestions = Int32(session.totalQuestions)
                progress.currentQuestionIndex = Int32(session.currentQuestionIndex)
                progress.score = Int32(session.score)
                progress.correctAnswers = Int32(session.correctAnswers)
                progress.incorrectAnswers = Int32(session.incorrectAnswers)
                progress.startedAt = session.startedAt
                progress.completedAt = session.completedAt
                progress.savedAt = Date()
                progress.needsSync = true // Mark for sync
                
                if let categoryId = session.categoryId {
                    progress.categoryId = Int32(categoryId)
                }
                
                if let difficulty = session.difficulty {
                    progress.difficultyLevel = Int32(difficulty.rawValue)
                }
                
                // Store version for conflict resolution
                progress.version = (progress.version ?? 0) + 1
                
            } catch {
                print("Error saving user progress: \(error)")
            }
        }
    }
    
    func getUserProgress(sessionId: String) -> GameSession? {
        let request: NSFetchRequest<UserProgress> = UserProgress.fetchRequest()
        request.predicate = NSPredicate(format: "sessionId == %@", sessionId)
        request.fetchLimit = 1
        
        do {
            if let progress = try viewContext.fetch(request).first {
                return convertToGameSession(progress)
            }
        } catch {
            print("Error fetching user progress: \(error)")
        }
        
        return nil
    }
    
    func getProgressNeedingSync() -> [UserProgress] {
        let request: NSFetchRequest<UserProgress> = UserProgress.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \UserProgress.savedAt, ascending: true)]
        
        do {
            return try viewContext.fetch(request)
        } catch {
            print("Error fetching progress needing sync: \(error)")
            return []
        }
    }
    
    func markProgressAsSynced(_ progress: UserProgress) {
        progress.needsSync = false
        progress.lastSyncedAt = Date()
        save()
    }
    
    // MARK: - Category Caching with Smart Updates
    
    func cacheCategories(_ categories: [Category]) {
        saveInBackground { context in
            let cacheTime = Date()
            
            // Update existing or create new
            for category in categories {
                let request: NSFetchRequest<CachedCategory> = CachedCategory.fetchRequest()
                request.predicate = NSPredicate(format: "id == %d", category.id)
                request.fetchLimit = 1
                
                do {
                    let existingCategory = try context.fetch(request).first
                    let cachedCategory = existingCategory ?? CachedCategory(context: context)
                    
                    cachedCategory.id = Int32(category.id)
                    cachedCategory.name = category.name
                    cachedCategory.categoryDescription = category.description
                    cachedCategory.iconUrl = category.iconUrl
                    cachedCategory.colorCode = category.colorCode
                    cachedCategory.questionCount = Int32(category.questionCount ?? 0)
                    cachedCategory.cachedAt = cacheTime
                    cachedCategory.lastAccessedAt = cacheTime
                    
                } catch {
                    print("Error caching category \(category.id): \(error)")
                }
            }
        }
    }
    
    func getCachedCategories() -> [Category] {
        let request: NSFetchRequest<CachedCategory> = CachedCategory.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CachedCategory.name, ascending: true)]
        
        // Only get categories cached within last 24 hours
        let dayAgo = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        request.predicate = NSPredicate(format: "cachedAt >= %@", dayAgo as NSDate)
        
        do {
            let cachedCategories = try viewContext.fetch(request)
            
            // Update access time
            for category in cachedCategories {
                category.lastAccessedAt = Date()
            }
            save()
            
            return cachedCategories.map { cached in
                Category(
                    id: Int(cached.id),
                    name: cached.name ?? "Unknown",
                    description: cached.categoryDescription,
                    iconUrl: cached.iconUrl,
                    colorCode: cached.colorCode ?? "#007AFF",
                    questionCount: Int(cached.questionCount),
                    questionsByDifficulty: nil
                )
            }
        } catch {
            print("Error fetching cached categories: \(error)")
            return []
        }
    }
    
    func isCategoryCacheFresh() -> Bool {
        let request: NSFetchRequest<CachedCategory> = CachedCategory.fetchRequest()
        let dayAgo = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        request.predicate = NSPredicate(format: "cachedAt >= %@", dayAgo as NSDate)
        request.fetchLimit = 1
        
        do {
            let count = try viewContext.count(for: request)
            return count > 0
        } catch {
            return false
        }
    }
    
    // MARK: - Storage Management
    
    func getCurrentStorageSize() -> Int64 {
        guard let storeURL = persistentContainer.persistentStoreCoordinator.persistentStores.first?.url else {
            return 0
        }
        
        do {
            let fileAttributes = try FileManager.default.attributesOfItem(atPath: storeURL.path)
            return fileAttributes[.size] as? Int64 ?? 0
        } catch {
            print("Error getting storage size: \(error)")
            return 0
        }
    }
    
    func enforceStorageLimits(in context: NSManagedObjectContext) {
        let currentSize = getCurrentStorageSize()
        
        if currentSize > maxStorageSize {
            print("Storage limit exceeded (\(currentSize) bytes). Cleaning up...")
            
            // Clean up old questions first (oldest first, lowest priority first)
            cleanupOldQuestions(in: context, targetReduction: currentSize - maxStorageSize)
            
            // Then clean up old progress if still needed
            let newSize = getCurrentStorageSize()
            if newSize > maxStorageSize {
                cleanupOldProgress(in: context, targetReduction: newSize - maxStorageSize)
            }
        }
    }
    
    private func cleanupOldQuestions(in context: NSManagedObjectContext, targetReduction: Int64) {
        let request: NSFetchRequest<NSFetchRequestResult> = CachedQuestion.fetchRequest()
        
        // Remove questions older than 7 days first
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        request.predicate = NSPredicate(format: "cachedAt < %@", weekAgo as NSDate)
        
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        deleteRequest.resultType = .resultTypeCount
        
        do {
            let result = try context.execute(deleteRequest) as? NSBatchDeleteResult
            let deletedCount = result?.result as? Int ?? 0
            print("Cleaned up \(deletedCount) old questions")
            
            // If still need more space, remove by priority
            if getCurrentStorageSize() > maxStorageSize {
                cleanupLowPriorityQuestions(in: context)
            }
        } catch {
            print("Error cleaning up old questions: \(error)")
        }
    }
    
    private func cleanupLowPriorityQuestions(in context: NSManagedObjectContext) {
        let request: NSFetchRequest<NSFetchRequestResult> = CachedQuestion.fetchRequest()
        
        // Remove lowest priority questions
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \CachedQuestion.priority, ascending: true),
            NSSortDescriptor(keyPath: \CachedQuestion.lastAccessedAt, ascending: true)
        ]
        request.fetchLimit = 100 // Remove in batches
        
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        
        do {
            try context.execute(deleteRequest)
            print("Cleaned up low priority questions")
        } catch {
            print("Error cleaning up low priority questions: \(error)")
        }
    }
    
    private func cleanupOldProgress(in context: NSManagedObjectContext, targetReduction: Int64) {
        let request: NSFetchRequest<NSFetchRequestResult> = UserProgress.fetchRequest()
        
        // Keep only last 30 days of progress
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        request.predicate = NSPredicate(format: "savedAt < %@ AND needsSync == NO", thirtyDaysAgo as NSDate)
        
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        
        do {
            try context.execute(deleteRequest)
            print("Cleaned up old progress data")
        } catch {
            print("Error cleaning up old progress: \(error)")
        }
    }
    
    // MARK: - Periodic Cleanup
    
    private func schedulePeriodicCleanup() {
        Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { _ in // Every hour
            self.performPeriodicCleanup()
        }
    }
    
    func performPeriodicCleanup() {
        saveInBackground { context in
            self.enforceStorageLimits(in: context)
        }
    }
    
    // MARK: - Helper Methods
    
    private func calculateCachePriority(for question: Question) -> Int32 {
        var priority: Int32 = 50 // Base priority
        
        // Higher priority for frequently used questions
        priority += Int32((question.usageCount ?? 0) / 10)
        
        // Higher priority for questions with good success rates
        if let successRate = question.successRate {
            if successRate > 80 {
                priority += 20
            } else if successRate > 60 {
                priority += 10
            }
        }
        
        // Higher priority for intermediate difficulty (most commonly used)
        if question.difficultyLevel == 3 {
            priority += 15
        }
        
        return min(priority, 100) // Cap at 100
    }
    
    private func clearCachedQuestions(for config: QuizConfig, in context: NSManagedObjectContext) {
        let request: NSFetchRequest<NSFetchRequestResult> = CachedQuestion.fetchRequest()
        
        var predicates: [NSPredicate] = []
        
        if let categoryId = config.categoryId {
            predicates.append(NSPredicate(format: "configCategoryId == %d", categoryId))
        } else {
            predicates.append(NSPredicate(format: "configCategoryId == 0"))
        }
        
        if let difficultyLevel = config.difficultyLevel {
            predicates.append(NSPredicate(format: "configDifficultyLevel == %d", difficultyLevel))
        } else {
            predicates.append(NSPredicate(format: "configDifficultyLevel == 0"))
        }
        
        predicates.append(NSPredicate(format: "configQuestionCount == %d", config.questionCount))
        
        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        
        do {
            try context.execute(deleteRequest)
        } catch {
            print("Error clearing cached questions: \(error)")
        }
    }
    
    private func convertToQuestion(_ cached: CachedQuestion) -> Question? {
        guard let difficultyLevel = cached.difficultyLevel,
              difficultyLevel >= 1 && difficultyLevel <= 5,
              let questionType = QuestionType(rawValue: cached.questionType ?? "multiple_choice") else {
            return nil
        }
        
        let category = Category(
            id: Int(cached.categoryId),
            name: cached.categoryName ?? "Unknown",
            description: nil,
            iconUrl: nil,
            colorCode: cached.categoryColorCode ?? "#007AFF",
            questionCount: nil,
            questionsByDifficulty: nil
        )
        
        return Question(
            id: Int(cached.id),
            categoryId: Int(cached.categoryId),
            questionText: cached.questionText ?? "",
            questionType: questionType,
            options: cached.options ?? [],
            difficultyLevel: Int(difficultyLevel),
            points: Int(cached.points),
            timeLimit: Int(cached.timeLimit),
            imageUrl: cached.imageUrl,
            audioUrl: cached.audioUrl,
            hint: cached.hint,
            category: category,
            usageCount: Int(cached.usageCount),
            successRate: cached.successRate,
            correctAnswer: nil, // Don't cache correct answers for security
            explanation: cached.explanation
        )
    }
    
    private func convertToGameSession(_ progress: UserProgress) -> GameSession? {
        guard let sessionType = SessionType(rawValue: progress.sessionType ?? "solo"),
              let status = SessionStatus(rawValue: progress.status ?? "active") else {
            return nil
        }
        
        return GameSession(
            id: progress.sessionId ?? "",
            userId: Int(progress.userId),
            sessionType: sessionType,
            status: status,
            categoryId: progress.categoryId > 0 ? Int(progress.categoryId) : nil,
            difficultyLevel: progress.difficultyLevel > 0 ? Int(progress.difficultyLevel) : nil,
            totalQuestions: Int(progress.totalQuestions),
            currentQuestionIndex: Int(progress.currentQuestionIndex),
            score: Int(progress.score),
            correctAnswers: Int(progress.correctAnswers),
            incorrectAnswers: Int(progress.incorrectAnswers),
            startedAt: progress.startedAt ?? Date(),
            completedAt: progress.completedAt,
            totalTimeSpent: nil
        )
    }
}

// MARK: - Core Data Entity Extensions

extension CachedQuestion {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<CachedQuestion> {
        return NSFetchRequest<CachedQuestion>(entityName: "CachedQuestion")
    }
}

extension CachedCategory {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<CachedCategory> {
        return NSFetchRequest<CachedCategory>(entityName: "CachedCategory")
    }
}

extension UserProgress {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<UserProgress> {
        return NSFetchRequest<UserProgress>(entityName: "UserProgress")
    }
}

// MARK: - Additional Methods for QuizService Integration

extension CoreDataManager {
    
    // Methods needed by QuizService
    func getCategories() -> [QuizCategory]? {
        let cachedCategories = getCachedCategories()
        guard !cachedCategories.isEmpty else { return nil }
        
        return cachedCategories.map { category in
            QuizCategory(
                id: String(category.id),
                name: category.name,
                description: category.description,
                iconUrl: category.iconUrl,
                colorCode: category.colorCode,
                questionCount: category.questionCount,
                displayOrder: nil,
                isActive: true
            )
        }
    }
    
    func saveCategories(_ categories: [QuizCategory]) {
        let legacyCategories = categories.map { category in
            Category(
                id: Int(category.id) ?? 0,
                name: category.name,
                description: category.description,
                iconUrl: category.iconUrl,
                colorCode: category.colorCode ?? "#007AFF",
                questionCount: category.questionCount,
                questionsByDifficulty: nil
            )
        }
        cacheCategories(legacyCategories)
    }
    
    func getQuestions(categoryId: String?, difficulty: Int?) -> [Question] {
        // Create a mock config to match the existing cache structure
        let config = QuizConfig(
            categoryId: categoryId.flatMap { Int($0) },
            difficultyLevel: difficulty,
            questionCount: 50 // Get up to 50 questions
        )
        
        let cachedQuestions = getCachedQuestions(for: config)
        return cachedQuestions.compactMap { question in
            Question(
                id: String(question.id),
                categoryId: String(question.categoryId),
                questionText: question.questionText,
                questionType: question.questionType,
                options: question.options,
                correctAnswer: question.correctAnswer ?? "",
                explanation: question.explanation,
                difficultyLevel: question.difficultyLevel,
                imageUrl: question.imageUrl,
                timeLimit: question.timeLimit,
                points: question.points,
                hint: question.hint,
                usageCount: question.usageCount ?? 0,
                successRate: question.successRate ?? 0.0
            )
        }
    }
    
    func saveQuestions(_ questions: [Question]) {
        // Convert to legacy format for caching
        let legacyQuestions = questions.compactMap { question -> Quiz.Question? in
            guard let questionType = QuestionType(rawValue: question.questionType.rawValue) else {
                return nil
            }
            
            let category = Category(
                id: Int(question.categoryId) ?? 0,
                name: "Unknown",
                description: nil,
                iconUrl: nil,
                colorCode: "#007AFF",
                questionCount: nil,
                questionsByDifficulty: nil
            )
            
            return Quiz.Question(
                id: Int(question.id) ?? 0,
                categoryId: Int(question.categoryId) ?? 0,
                questionText: question.questionText,
                questionType: questionType,
                options: question.options,
                difficultyLevel: question.difficultyLevel,
                points: question.points,
                timeLimit: question.timeLimit,
                imageUrl: question.imageUrl,
                audioUrl: nil,
                hint: question.hint,
                category: category,
                usageCount: question.usageCount,
                successRate: question.successRate,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            )
        }
        
        // Use a default config for caching
        let config = QuizConfig(categoryId: nil, difficultyLevel: nil, questionCount: questions.count)
        cacheQuestions(legacyQuestions, for: config)
    }
    
    func getSession(id: String) -> GameSession? {
        return getUserProgress(sessionId: id)
    }
    
    func saveSession(_ session: GameSession) {
        // Convert to legacy format for saving
        let legacySession = Quiz.GameSession(
            id: session.id,
            userId: Int(session.userId) ?? 0,
            sessionType: Quiz.SessionType(rawValue: session.sessionType.rawValue) ?? .solo,
            status: Quiz.SessionStatus(rawValue: session.status.rawValue) ?? .active,
            categoryId: session.config?.categoryId.flatMap { Int($0) },
            difficultyLevel: session.config?.difficulty,
            totalQuestions: session.config?.questionCount ?? 10,
            currentQuestionIndex: session.currentQuestionIndex,
            score: session.score,
            correctAnswers: session.answers.filter { $0.isCorrect }.count,
            incorrectAnswers: session.answers.filter { !$0.isCorrect }.count,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            totalTimeSpent: nil
        )
        
        saveUserProgress(legacySession)
    }
    
    func updateSession(sessionId: String, with response: AnswerResponse) {
        // Update the cached session with new answer data
        if let progress = getProgressRecord(sessionId: sessionId) {
            progress.score = Int32(response.totalScore)
            // Update other fields as needed
            save()
        }
    }
    
    func getActiveSession() -> GameSession? {
        let request: NSFetchRequest<UserProgress> = UserProgress.fetchRequest()
        request.predicate = NSPredicate(format: "status == %@", "active")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \UserProgress.startedAt, ascending: false)]
        request.fetchLimit = 1
        
        do {
            if let progress = try viewContext.fetch(request).first {
                return convertToGameSession(progress)
            }
        } catch {
            print("Error fetching active session: \(error)")
        }
        
        return nil
    }
    
    func getQuestion(id: String) -> Question? {
        let request: NSFetchRequest<CachedQuestion> = CachedQuestion.fetchRequest()
        request.predicate = NSPredicate(format: "id == %d", Int(id) ?? 0)
        request.fetchLimit = 1
        
        do {
            if let cached = try viewContext.fetch(request).first {
                return convertToQuestion(cached).map { question in
                    Question(
                        id: String(question.id),
                        categoryId: String(question.categoryId),
                        questionText: question.questionText,
                        questionType: question.questionType,
                        options: question.options,
                        correctAnswer: question.correctAnswer ?? "",
                        explanation: question.explanation,
                        difficultyLevel: question.difficultyLevel,
                        imageUrl: question.imageUrl,
                        timeLimit: question.timeLimit,
                        points: question.points,
                        hint: question.hint,
                        usageCount: question.usageCount ?? 0,
                        successRate: question.successRate ?? 0.0
                    )
                }
            }
        } catch {
            print("Error fetching question: \(error)")
        }
        
        return nil
    }
    
    func queueOfflineAnswer(sessionId: String, answer: UserAnswer, response: AnswerResponse) {
        // Store offline answer for later sync
        saveInBackground { context in
            let offlineAnswer = OfflineAnswer(context: context)
            offlineAnswer.id = UUID().uuidString
            offlineAnswer.sessionId = sessionId
            offlineAnswer.questionId = answer.questionId
            offlineAnswer.selectedAnswer = answer.selectedAnswer
            offlineAnswer.timeSpent = answer.timeSpent
            offlineAnswer.timestamp = answer.timestamp
            offlineAnswer.createdAt = Date()
            offlineAnswer.needsSync = true
        }
    }
    
    func getPendingOfflineAnswers() -> [PendingOfflineAnswer] {
        let request: NSFetchRequest<OfflineAnswer> = OfflineAnswer.fetchRequest()
        request.predicate = NSPredicate(format: "needsSync == YES")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \OfflineAnswer.createdAt, ascending: true)]
        
        do {
            let offlineAnswers = try viewContext.fetch(request)
            return offlineAnswers.map { offline in
                PendingOfflineAnswer(
                    id: offline.id ?? UUID().uuidString,
                    sessionId: offline.sessionId ?? "",
                    answer: UserAnswer(
                        questionId: offline.questionId ?? "",
                        selectedAnswer: offline.selectedAnswer ?? "",
                        timeSpent: offline.timeSpent
                    )
                )
            }
        } catch {
            print("Error fetching pending offline answers: \(error)")
            return []
        }
    }
    
    func markOfflineAnswerSynced(_ answerId: String) {
        let request: NSFetchRequest<OfflineAnswer> = OfflineAnswer.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", answerId)
        request.fetchLimit = 1
        
        do {
            if let answer = try viewContext.fetch(request).first {
                answer.needsSync = false
                answer.syncedAt = Date()
                save()
            }
        } catch {
            print("Error marking offline answer as synced: \(error)")
        }
    }
    
    func getUnsyncedSessions() -> [GameSession] {
        let progress = getProgressNeedingSync()
        return progress.compactMap { convertToGameSession($0) }
    }
    
    func updateSessionWithServerId(localId: String, serverSession: GameSession) {
        if let progress = getProgressRecord(sessionId: localId) {
            progress.sessionId = serverSession.id
            progress.needsSync = false
            progress.lastSyncedAt = Date()
            save()
        }
    }
    
    private func getProgressRecord(sessionId: String) -> UserProgress? {
        let request: NSFetchRequest<UserProgress> = UserProgress.fetchRequest()
        request.predicate = NSPredicate(format: "sessionId == %@", sessionId)
        request.fetchLimit = 1
        
        do {
            return try viewContext.fetch(request).first
        } catch {
            print("Error fetching progress record: \(error)")
            return nil
        }
    }
}

// MARK: - Supporting Types for Offline Functionality

struct PendingOfflineAnswer {
    let id: String
    let sessionId: String
    let answer: UserAnswer
}

extension OfflineAnswer {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<OfflineAnswer> {
        return NSFetchRequest<OfflineAnswer>(entityName: "OfflineAnswer")
    }
}