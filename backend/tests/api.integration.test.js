const request = require('supertest');
const app = require('../src/app');
const { User, Category, Question, sequelize } = require('../src/models');

describe('API Integration Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let adminUser;
  let testCategory;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear all data
    await User.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Question.destroy({ where: {} });

    // Create test users
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'AdminPassword123',
      role: 'admin'
    });

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123'
      });

    adminToken = adminLoginResponse.body.data.token;

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'A test category',
      isActive: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Health Check', () => {
    it('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Quiz App API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Categories API', () => {
    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('should require authentication for categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('Questions API', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await Question.create({
        questionText: 'What is 2 + 2?',
        optionA: '3',
        optionB: '4',
        optionC: '5',
        optionD: '6',
        correctAnswer: 'B',
        explanation: '2 + 2 equals 4',
        points: 10,
        difficultyLevel: 1,
        categoryId: testCategory.id,
        createdBy: adminUser.id
      });
    });

    it('should get questions with authentication', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toBeDefined();
      expect(Array.isArray(response.body.data.questions)).toBe(true);
    });

    it('should filter questions by category', async () => {
      const response = await request(app)
        .get(`/api/questions?categoryId=${testCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions.length).toBeGreaterThan(0);
    });

    it('should filter questions by difficulty', async () => {
      const response = await request(app)
        .get('/api/questions?difficultyLevel=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions.length).toBeGreaterThan(0);
    });

    it('should limit number of questions returned', async () => {
      const response = await request(app)
        .get('/api/questions?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions.length).toBeLessThanOrEqual(1);
    });

    it('should require authentication for questions', async () => {
      const response = await request(app)
        .get('/api/questions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin API - Cache Management', () => {
    it('should get cache stats for admin', async () => {
      const response = await request(app)
        .get('/api/admin/cache/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cache).toBeDefined();
      expect(response.body.data.warming).toBeDefined();
      expect(response.body.data.sync).toBeDefined();
    });

    it('should require admin role for cache stats', async () => {
      const response = await request(app)
        .get('/api/admin/cache/stats')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });

    it('should clear cache for admin', async () => {
      const response = await request(app)
        .delete('/api/admin/cache/clear')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should force cache warming for admin', async () => {
      const response = await request(app)
        .post('/api/admin/cache/warm')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cache warming started');
    });
  });

  describe('Admin API - Sync Management', () => {
    it('should get sync status for admin', async () => {
      const response = await request(app)
        .get('/api/admin/sync/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.syncInProgress).toBeDefined();
      expect(response.body.data.syncInterval).toBeDefined();
    });

    it('should force sync for admin', async () => {
      const response = await request(app)
        .post('/api/admin/sync/force')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Forced sync started in background');
    });

    it('should update sync interval for admin', async () => {
      const response = await request(app)
        .put('/api/admin/sync/interval')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ intervalMs: 300000 }) // 5 minutes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('300000ms');
    });

    it('should reject invalid sync intervals', async () => {
      const response = await request(app)
        .put('/api/admin/sync/interval')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ intervalMs: 30000 }) // 30 seconds (too short)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 60000ms');
    });
  });

  describe('Admin API - Storage Management', () => {
    it('should get storage status for admin', async () => {
      const response = await request(app)
        .get('/api/admin/storage/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalSize).toBeDefined();
      expect(response.body.data.maxSize).toBeDefined();
    });

    it('should update storage limit for admin', async () => {
      const response = await request(app)
        .put('/api/admin/storage/limit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ limitMB: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('100MB');
    });

    it('should reject invalid storage limits', async () => {
      const response = await request(app)
        .put('/api/admin/storage/limit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ limitMB: 5 }) // Below 10MB minimum
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 10MB');
    });

    it('should generate storage report for admin', async () => {
      const response = await request(app)
        .get('/api/admin/storage/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.generatedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});