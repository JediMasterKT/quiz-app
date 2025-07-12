const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type']
});

const activeConnections = new promClient.Gauge({
  name: 'nodejs_active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

const cacheOperations = new promClient.Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result']
});

const gameSessionsActive = new promClient.Gauge({
  name: 'game_sessions_active',
  help: 'Number of active game sessions'
});

const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'result']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheOperations);
register.registerMetric(gameSessionsActive);
register.registerMetric(authenticationAttempts);

// Middleware function
function metricsMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    
    // Track active connections
    activeConnections.inc();
    
    // Capture the original end function
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const duration = (Date.now() - start) / 1000;
      const route = req.route ? req.route.path : req.path || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode;
      
      // Record metrics
      httpRequestDuration.labels(method, route, statusCode).observe(duration);
      httpRequestsTotal.labels(method, route, statusCode).inc();
      
      // Track errors
      if (statusCode >= 400) {
        const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
        httpRequestErrors.labels(method, route, errorType).inc();
      }
      
      // Decrement active connections
      activeConnections.dec();
      
      // Call the original end function
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// Metrics endpoint handler
function metricsEndpoint() {
  return async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).end(error.message);
    }
  };
}

// Helper functions for tracking custom metrics
const trackDatabaseQuery = (queryType, table, duration) => {
  databaseQueryDuration.labels(queryType, table).observe(duration);
};

const trackCacheOperation = (operation, result) => {
  cacheOperations.labels(operation, result).inc();
};

const trackAuthentication = (type, result) => {
  authenticationAttempts.labels(type, result).inc();
};

const updateActiveGameSessions = (count) => {
  gameSessionsActive.set(count);
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  trackDatabaseQuery,
  trackCacheOperation,
  trackAuthentication,
  updateActiveGameSessions,
  register
};