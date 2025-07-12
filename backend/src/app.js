require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const gameRoutes = require('./routes/games');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Quiz App API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Connect to Redis (optional)
    await connectRedis();

    // Sync database models (disabled to avoid conflicts)
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync();
    //   console.log('Database models synchronized.');
    // }

    // Start cache warming in background
    if (process.env.NODE_ENV === 'production') {
      setImmediate(async () => {
        try {
          const cacheWarmingService = require('./services/cacheWarmingService');
          await cacheWarmingService.warmCache();
        } catch (error) {
          console.error('Cache warming failed:', error);
        }
      });
    }

    // Start background sync service
    setImmediate(() => {
      try {
        const syncService = require('./services/syncService');
        syncService.startBackgroundSync();
      } catch (error) {
        console.error('Background sync startup failed:', error);
      }
    });

    // Start storage monitoring
    setImmediate(() => {
      try {
        const storageService = require('./services/storageService');
        storageService.startStorageMonitoring();
      } catch (error) {
        console.error('Storage monitoring startup failed:', error);
      }
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;