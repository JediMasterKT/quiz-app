const request = require('supertest');
const app = require('../src/app');
const { User, sequelize } = require('../src/models');

describe('Authentication', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear users table before each test
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return validation errors for invalid data', async () => {
      const userData = {
        username: 'tu', // Too short
        email: 'invalid-email',
        password: '123' // Too short and missing requirements
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create user with same username
      const duplicateData = {
        username: 'testuser',
        email: 'different@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email or username');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create user with same email
      const duplicateData = {
        username: 'differentuser',
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email or username');
    });

    it('should hash password before storing', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.passwordHash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'TestPassword123'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return validation errors for invalid input', async () => {
      const loginData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should update last login timestamp', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const userBefore = await User.findOne({ where: { email: loginData.email } });
      const lastLoginBefore = userBefore.lastLogin;

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const userAfter = await User.findOne({ where: { email: loginData.email } });
      expect(userAfter.lastLogin).not.toBe(lastLoginBefore);
      expect(userAfter.lastLogin).toBeInstanceOf(Date);
    });

    it('should return error for inactive user', async () => {
      // Create inactive user
      await User.create({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        passwordHash: 'TestPassword123',
        isActive: false
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
      testUser = response.body.data.user;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return error with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'TestPassword123'
      });
    });

    it('should generate reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset instructions sent to your email');

      // Check that reset token was created
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.resetToken).toBeDefined();
      expect(user.resetTokenExpires).toBeDefined();
      expect(user.resetTokenExpires > new Date()).toBe(true);
    });

    it('should return error for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;
    let testUser;

    beforeEach(async () => {
      resetToken = 'valid-reset-token';
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'TestPassword123',
        resetToken: resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000) // 1 hour from now
      });
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successful');

      // Check that password was updated and reset token was cleared
      const user = await User.findByPk(testUser.id);
      expect(user.resetToken).toBeNull();
      expect(user.resetTokenExpires).toBeNull();
      
      // Test that new password works
      const isValidPassword = await user.comparePassword(newPassword);
      expect(isValidPassword).toBe(true);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'NewPassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return error for expired token', async () => {
      // Update token to be expired
      await testUser.update({
        resetTokenExpires: new Date(Date.now() - 3600000) // 1 hour ago
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword: 'NewPassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return validation error for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Password Security', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: password
      });

      // Password should be hashed
      expect(user.passwordHash).not.toBe(password);
      expect(user.passwordHash.startsWith('$2b$')).toBe(true);
      
      // Should be able to compare password
      const isValid = await user.comparePassword(password);
      expect(isValid).toBe(true);
      
      const isInvalid = await user.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    it('should rehash password on update', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'TestPassword123'
      });

      const originalHash = user.passwordHash;
      
      await user.update({ passwordHash: 'NewPassword123' });
      
      expect(user.passwordHash).not.toBe(originalHash);
      expect(user.passwordHash).not.toBe('NewPassword123');
      
      const isValid = await user.comparePassword('NewPassword123');
      expect(isValid).toBe(true);
    });
  });
});