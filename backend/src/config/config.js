require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'quiz_user',
    password: process.env.DB_PASSWORD || 'quiz_password',
    database: process.env.DB_NAME || 'quiz_app_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    username: process.env.DB_USERNAME || 'quiz_user',
    password: process.env.DB_PASSWORD || 'quiz_password',
    database: process.env.DB_NAME_TEST || 'quiz_app_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};