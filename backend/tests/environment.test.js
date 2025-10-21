/**
 * Environment Setup Tests
 *
 * Verifies that the development environment is properly configured
 * with all required dependencies and configuration files.
 *
 * TDD: These tests are written FIRST, before running npm install.
 */

const fs = require('fs');
const path = require('path');

describe('Development Environment', () => {
  const backendDir = path.join(__dirname, '..');

  test('node_modules directory exists', () => {
    const nodeModulesPath = path.join(backendDir, 'node_modules');
    expect(fs.existsSync(nodeModulesPath)).toBe(true);
  });

  test('all dependencies installed', () => {
    const packageJson = require('../package.json');
    const dependencies = Object.keys(packageJson.dependencies);

    expect(dependencies.length).toBeGreaterThanOrEqual(11);

    dependencies.forEach(dep => {
      expect(() => require.resolve(dep)).not.toThrow();
    });
  });

  test('.env file exists with required variables', () => {
    const envPath = path.join(backendDir, '.env');
    expect(fs.existsSync(envPath)).toBe(true);

    // Load .env file
    require('dotenv').config({ path: envPath });

    // Verify required environment variables
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_USERNAME).toBeDefined();
    expect(process.env.DB_PASSWORD).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.REDIS_URL).toBeDefined();
  });

  test('critical dependencies can be imported', () => {
    // Test core dependencies
    expect(() => require('express')).not.toThrow();
    expect(() => require('bcrypt')).not.toThrow();
    expect(() => require('jsonwebtoken')).not.toThrow();
    expect(() => require('sequelize')).not.toThrow();
    expect(() => require('dotenv')).not.toThrow();
  });

  test('dev dependencies installed', () => {
    const packageJson = require('../package.json');
    const devDependencies = Object.keys(packageJson.devDependencies);

    expect(devDependencies.length).toBeGreaterThanOrEqual(4);

    // Test that jest is available (we're using it now)
    expect(() => require('jest')).not.toThrow();
  });
});
