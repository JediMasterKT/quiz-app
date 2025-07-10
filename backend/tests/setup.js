require('dotenv').config({ path: '.env' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME_TEST = 'quiz_app_test';

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
});

afterAll(async () => {
  console.log('Tearing down test environment...');
});