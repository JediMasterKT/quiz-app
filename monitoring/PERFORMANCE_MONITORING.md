# Performance Monitoring System

## Overview

The Quiz App performance monitoring system provides real-time insights into application performance, system health, and user experience metrics. Built on Prometheus and Grafana, it enables proactive performance management and rapid issue detection.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Quiz App API  │────▶│   Prometheus    │────▶│     Grafana     │
│  (with metrics) │     │  (Time Series)  │     │  (Dashboards)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         │
         │              ┌────────▼────────┐               │
         │              │  Alert Manager  │               │
         │              │  (Alerting)     │               │
         │              └─────────────────┘               │
         │                                                 │
┌────────▼────────┐     ┌─────────────────┐     ┌────────▼────────┐
│     Exporters   │     │      Loki       │     │    Dashboards   │
│ (Node, DB, etc) │     │ (Log Aggregation)│     │   & Alerts      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Components

### 1. Prometheus (Metrics Collection)
- **Port**: 9090
- **Function**: Collects and stores time-series metrics
- **Scrape Interval**: 15 seconds
- **Retention**: 15 days (default)

### 2. Grafana (Visualization)
- **Port**: 3001
- **Function**: Visualizes metrics and provides dashboards
- **Default Credentials**: admin/admin
- **Features**:
  - Pre-configured Quiz App Performance Dashboard
  - Real-time metrics with 5-second refresh
  - Customizable alerts and thresholds

### 3. AlertManager (Alerting)
- **Port**: 9093
- **Function**: Manages alerts and notifications
- **Alert Routes**:
  - Critical alerts: Immediate notification
  - Warning alerts: Grouped notifications

### 4. Exporters
- **Node Exporter**: System metrics (CPU, memory, disk)
- **PostgreSQL Exporter**: Database performance metrics
- **Redis Exporter**: Cache performance metrics
- **cAdvisor**: Container resource metrics

### 5. Loki & Promtail (Logging)
- **Loki Port**: 3100
- **Function**: Log aggregation and querying
- **Integration**: Fully integrated with Grafana

## Metrics Collected

### Application Metrics
```javascript
// HTTP Request Metrics
http_request_duration_seconds    // Request latency histogram
http_requests_total              // Total request counter
http_request_errors_total        // Error counter

// Business Metrics
game_sessions_active             // Active game sessions
authentication_attempts_total    // Auth attempts by type/result
cache_operations_total          // Cache hits/misses

// Database Metrics
database_query_duration_seconds  // Query performance
pg_stat_database_*              // PostgreSQL statistics
```

### System Metrics
- CPU usage and load average
- Memory utilization
- Disk I/O and space
- Network traffic
- Container resource usage

## Dashboard Features

### Main Performance Dashboard
1. **Service Health Overview**
   - API status gauge
   - Service uptime tracking

2. **Request Performance**
   - Request rate by endpoint
   - Response time percentiles (50th, 95th, 99th)
   - Error rate tracking

3. **Resource Utilization**
   - CPU usage over time
   - Memory consumption
   - Active connections

4. **Cache Performance**
   - Cache hit rate gauge
   - Cache operations timeline

## Alert Rules

### Critical Alerts
- Service downtime (>1 minute)
- High error rate (>5%)
- Memory usage >90%
- Database connection exhaustion

### Warning Alerts
- Response time >500ms (95th percentile)
- CPU usage >80%
- Low cache hit rate (<80%)
- Slow database queries

## Integration Guide

### 1. Adding Metrics to Backend

```javascript
// Import the metrics middleware
const { 
  metricsMiddleware, 
  metricsEndpoint,
  trackDatabaseQuery,
  trackCacheOperation 
} = require('./backend-metrics-middleware');

// Add middleware to Express app
app.use(metricsMiddleware());

// Add metrics endpoint
app.get('/metrics', metricsEndpoint());

// Track custom metrics
// Database query tracking
const startTime = Date.now();
const result = await db.query(sql);
trackDatabaseQuery('select', 'users', (Date.now() - startTime) / 1000);

// Cache operation tracking
const cacheResult = await redis.get(key);
trackCacheOperation('get', cacheResult ? 'hit' : 'miss');
```

### 2. Custom Dashboards

Create new dashboards in Grafana:
1. Navigate to http://localhost:3001
2. Click "+" → "Dashboard"
3. Add panels with Prometheus queries

Example queries:
```promql
# Average response time by endpoint
avg by (route) (rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))

# Error rate percentage
sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100

# Active game sessions
game_sessions_active
```

### 3. Adding New Alerts

Edit `monitoring/prometheus/alert_rules.yml`:
```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert summary"
    description: "Detailed description"
```

## Operations Guide

### Starting the Monitoring Stack
```bash
./setup-monitoring.sh
```

### Stopping Services
```bash
docker-compose -f docker-compose.monitoring.yml down
```

### Viewing Logs
```bash
# All services
docker-compose -f docker-compose.monitoring.yml logs -f

# Specific service
docker-compose -f docker-compose.monitoring.yml logs -f prometheus
```

### Backup & Restore

#### Prometheus Data
```bash
# Backup
docker run --rm -v quiz-app-devops_prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /data .

# Restore
docker run --rm -v quiz-app-devops_prometheus_data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup.tar.gz -C /data
```

#### Grafana Dashboards
Dashboards are automatically provisioned from `monitoring/grafana/provisioning/dashboards/`

## Performance Targets

- **Metric Collection Latency**: <100ms
- **Dashboard Refresh Rate**: 5 seconds
- **Alert Detection Time**: <30 seconds
- **Data Retention**: 15 days minimum
- **System Overhead**: <5% CPU, <200MB RAM

## Troubleshooting

### Service Not Accessible
```bash
# Check container status
docker-compose -f docker-compose.monitoring.yml ps

# Check logs
docker-compose -f docker-compose.monitoring.yml logs [service-name]
```

### Missing Metrics
1. Verify exporters are running
2. Check Prometheus targets: http://localhost:9090/targets
3. Ensure metrics endpoint is exposed in application

### High Memory Usage
1. Reduce Prometheus retention: `--storage.tsdb.retention.time=7d`
2. Increase scrape interval in prometheus.yml
3. Optimize queries in dashboards

## Best Practices

1. **Metric Naming**
   - Use standard Prometheus naming conventions
   - Include units in metric names (e.g., `_seconds`, `_bytes`)

2. **Label Usage**
   - Keep cardinality low (<1000 unique label combinations)
   - Use consistent label names across metrics

3. **Dashboard Design**
   - Group related metrics
   - Use appropriate visualization types
   - Set meaningful alert thresholds

4. **Resource Management**
   - Monitor the monitoring system itself
   - Set appropriate retention policies
   - Regular backup of configurations

## Security Considerations

1. **Access Control**
   - Change default Grafana password
   - Use environment variables for sensitive data
   - Restrict network access to monitoring ports

2. **Data Protection**
   - Enable TLS for external access
   - Implement authentication for Prometheus
   - Secure AlertManager webhooks

## Future Enhancements

1. **Distributed Tracing**
   - Integrate Jaeger for request tracing
   - Add trace correlation with logs

2. **Advanced Analytics**
   - Machine learning for anomaly detection
   - Predictive scaling based on metrics

3. **Extended Integrations**
   - Slack/Email notifications
   - PagerDuty integration
   - Custom webhook handlers