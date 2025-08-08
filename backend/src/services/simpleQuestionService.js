class SimpleQuestionService {
  async getCategories() {
    // Return mock categories for testing
    return [
      { id: 1, name: 'General Knowledge', questionCount: 50 },
      { id: 2, name: 'Science', questionCount: 30 },
      { id: 3, name: 'History', questionCount: 25 },
      { id: 4, name: 'Geography', questionCount: 20 },
      { id: 5, name: 'Sports', questionCount: 15 }
    ];
  }
}

module.exports = new SimpleQuestionService();