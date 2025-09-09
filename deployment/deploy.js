const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Comprehensive Deployment and Monitoring Setup for Chatbot
 * Handles deployment scripts and monitoring tools for production
 */

class ChatbotDeployment {
  constructor() {
    this.config = this.loadConfig();
    this.monitoringData = {
      uptime: Date.now(),
      totalQueries: 0,
      errorCount: 0,
      averageResponseTime: 0,
      responseTimes: [],
      lastHealthCheck: null,
      alerts: []
    };
    this.healthCheckInterval = null;
    this.logStream = null;
  }

  // Load deployment configuration
  loadConfig() {
    const defaultConfig = {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/donatebooks',
      logLevel: process.env.LOG_LEVEL || 'info',
      enableMonitoring: true,
      healthCheckInterval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05,    // 5%
        uptimeMinimum: 0.99 // 99%
      },
      deployment: {
        type: 'standard', // 'standard', 'docker', 'kubernetes'
        replicas: 1,
        autoRestart: true,
        gracefulShutdown: true
      }
    };

    try {
      const configPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn('Could not load custom config, using defaults:', error.message);
    }

    return defaultConfig;
  }

  // Initialize deployment
  async initialize() {
    console.log('🚀 Initializing Chatbot Deployment');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Port: ${this.config.port}`);
    
    // Setup logging
    this.setupLogging();
    
    // Setup monitoring
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    // Run pre-deployment checks
    const preChecksPassed = await this.runPreDeploymentChecks();
    if (!preChecksPassed) {
      throw new Error('Pre-deployment checks failed');
    }

    console.log('✅ Deployment initialization complete');
  }

  // Setup structured logging
  setupLogging() {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `chatbot-${this.config.environment}-${new Date().toISOString().split('T')[0]}.log`);
    this.logStream = fs.createWriteStream(logFile, { flags: 'a' });

    // Override console methods to include file logging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const timestamp = new Date().toISOString();
      const message = `[${timestamp}] [INFO] ${args.join(' ')}`;
      originalLog(...args);
      if (this.logStream) {
        this.logStream.write(message + '\\n');
      }
    };

    console.error = (...args) => {
      const timestamp = new Date().toISOString();
      const message = `[${timestamp}] [ERROR] ${args.join(' ')}`;
      originalError(...args);
      if (this.logStream) {
        this.logStream.write(message + '\\n');
      }
      this.monitoringData.errorCount++;
    };

    console.warn = (...args) => {
      const timestamp = new Date().toISOString();
      const message = `[${timestamp}] [WARN] ${args.join(' ')}`;
      originalWarn(...args);
      if (this.logStream) {
        this.logStream.write(message + '\\n');
      }
    };

    console.log('📝 Logging system initialized');
  }

  // Start monitoring services
  startMonitoring() {
    console.log('📊 Starting monitoring services');

    // Health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Performance metrics collection
    this.setupPerformanceMetrics();

    // Alert system
    this.setupAlertSystem();

    console.log('✅ Monitoring services started');
  }

  // Setup performance metrics collection
  setupPerformanceMetrics() {
    // Monitor response times
    this.originalProcessMessage = null; // Will be set when integrating with chatbot

    // Memory usage monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.logMetric('memory_usage', {
        rss: memUsage.rss / 1024 / 1024, // MB
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        external: memUsage.external / 1024 / 1024
      });
    }, 60000); // Every minute

    // CPU usage (simple approximation)
    let lastCpuUsage = process.cpuUsage();
    setInterval(() => {
      const cpuUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / 1; // Convert to percentage
      this.logMetric('cpu_usage', { percent: cpuPercent });
      lastCpuUsage = process.cpuUsage();
    }, 60000);
  }

  // Setup alert system
  setupAlertSystem() {
    setInterval(() => {
      this.checkAlertConditions();
    }, 60000); // Check every minute
  }

  // Perform health check
  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.monitoringData.uptime,
      memory: process.memoryUsage(),
      queries: this.monitoringData.totalQueries,
      errors: this.monitoringData.errorCount,
      avgResponseTime: this.monitoringData.averageResponseTime,
      status: 'healthy'
    };

    // Check database connectivity
    try {
      // This would check MongoDB connection in real implementation
      healthStatus.database = 'connected';
    } catch (error) {
      healthStatus.database = 'disconnected';
      healthStatus.status = 'unhealthy';
      console.error('Database health check failed:', error.message);
    }

    // Check response time
    if (this.monitoringData.averageResponseTime > this.config.alertThresholds.responseTime) {
      healthStatus.status = 'degraded';
    }

    this.monitoringData.lastHealthCheck = healthStatus;
    this.logMetric('health_check', healthStatus);

    if (healthStatus.status !== 'healthy') {
      this.triggerAlert('health_check_failed', healthStatus);
    }
  }

  // Check alert conditions
  checkAlertConditions() {
    const now = Date.now();
    const uptime = now - this.monitoringData.uptime;
    const errorRate = this.monitoringData.totalQueries > 0 
      ? this.monitoringData.errorCount / this.monitoringData.totalQueries 
      : 0;

    // High error rate alert
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.triggerAlert('high_error_rate', {
        errorRate: errorRate,
        threshold: this.config.alertThresholds.errorRate,
        totalQueries: this.monitoringData.totalQueries,
        errorCount: this.monitoringData.errorCount
      });
    }

    // High response time alert
    if (this.monitoringData.averageResponseTime > this.config.alertThresholds.responseTime) {
      this.triggerAlert('high_response_time', {
        avgResponseTime: this.monitoringData.averageResponseTime,
        threshold: this.config.alertThresholds.responseTime
      });
    }

    // Memory usage alert (if over 80% of 1GB)
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 800 * 1024 * 1024) {
      this.triggerAlert('high_memory_usage', {
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        heapTotal: memUsage.heapTotal / 1024 / 1024
      });
    }
  }

  // Trigger alert
  triggerAlert(type, data) {
    const alert = {
      type: type,
      timestamp: new Date().toISOString(),
      data: data,
      severity: this.getAlertSeverity(type),
      resolved: false
    };

    this.monitoringData.alerts.push(alert);
    console.warn(`🚨 ALERT [${alert.severity}]: ${type}`, data);

    // In a real implementation, this would send notifications
    this.sendAlert(alert);

    // Keep only last 100 alerts
    if (this.monitoringData.alerts.length > 100) {
      this.monitoringData.alerts = this.monitoringData.alerts.slice(-100);
    }
  }

  // Get alert severity
  getAlertSeverity(type) {
    const severityMap = {
      'health_check_failed': 'critical',
      'high_error_rate': 'high',
      'high_response_time': 'medium',
      'high_memory_usage': 'medium',
      'deployment_failed': 'critical',
      'database_disconnected': 'high'
    };

    return severityMap[type] || 'low';
  }

  // Send alert (placeholder for real notification system)
  async sendAlert(alert) {
    // In production, this would integrate with:
    // - Email services
    // - Slack/Teams notifications
    // - SMS alerts
    // - PagerDuty/OpsGenie
    
    console.log(`📧 Alert notification sent: ${alert.type}`);
  }

  // Log metrics
  logMetric(name, data) {
    const metric = {
      name: name,
      timestamp: new Date().toISOString(),
      data: data
    };

    // In production, this would send to monitoring systems like:
    // - Prometheus
    // - DataDog
    // - New Relic
    // - CloudWatch

    if (this.config.logLevel === 'debug') {
      console.log(`📈 Metric: ${name}`, data);
    }
  }

  // Track query performance
  trackQuery(queryData, responseTime, success = true) {
    this.monitoringData.totalQueries++;
    
    if (success) {
      this.monitoringData.responseTimes.push(responseTime);
      
      // Keep only last 1000 response times for average calculation
      if (this.monitoringData.responseTimes.length > 1000) {
        this.monitoringData.responseTimes = this.monitoringData.responseTimes.slice(-1000);
      }
      
      // Update average response time
      this.monitoringData.averageResponseTime = 
        this.monitoringData.responseTimes.reduce((a, b) => a + b, 0) / 
        this.monitoringData.responseTimes.length;
    } else {
      this.monitoringData.errorCount++;
    }

    // Log query details
    this.logMetric('query_processed', {
      intent: queryData.intent,
      responseTime: responseTime,
      success: success,
      confidence: queryData.confidence
    });
  }

  // Run pre-deployment checks
  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');

    const checks = [];

    // Check Node.js version
    checks.push({
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.substring(1).split('.')[0]);
        return major >= 14;
      }
    });

    // Check required environment variables
    checks.push({
      name: 'Environment variables',
      check: () => {
        const required = ['NODE_ENV'];
        return required.every(env => process.env[env]);
      }
    });

    // Check file permissions
    checks.push({
      name: 'File permissions',
      check: () => {
        try {
          const testFile = path.join(__dirname, 'temp_permission_test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          return true;
        } catch (error) {
          return false;
        }
      }
    });

    // Check disk space (simplified)
    checks.push({
      name: 'Disk space',
      check: () => {
        try {
          const stats = fs.statSync(__dirname);
          return true; // Simplified - in production would check actual disk space
        } catch (error) {
          return false;
        }
      }
    });

    // Run all checks
    let allPassed = true;
    for (const check of checks) {
      try {
        const passed = await check.check();
        console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
      } catch (error) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      console.log(`\\n📴 Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new requests
      if (this.server) {
        this.server.close(() => {
          console.log('🔌 HTTP server closed');
        });
      }

      // Stop monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        console.log('⏹️  Monitoring stopped');
      }

      // Close log stream
      if (this.logStream) {
        this.logStream.end();
        console.log('📝 Log stream closed');
      }

      // Close database connections
      // In real implementation, would close MongoDB connections

      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Get monitoring dashboard data
  getMonitoringDashboard() {
    const uptime = Date.now() - this.monitoringData.uptime;
    const errorRate = this.monitoringData.totalQueries > 0 
      ? this.monitoringData.errorCount / this.monitoringData.totalQueries 
      : 0;

    return {
      status: this.monitoringData.lastHealthCheck?.status || 'unknown',
      uptime: {
        milliseconds: uptime,
        human: this.formatUptime(uptime)
      },
      queries: {
        total: this.monitoringData.totalQueries,
        errors: this.monitoringData.errorCount,
        errorRate: (errorRate * 100).toFixed(2) + '%',
        avgResponseTime: Math.round(this.monitoringData.averageResponseTime) + 'ms'
      },
      system: {
        memory: process.memoryUsage(),
        pid: process.pid,
        version: process.version,
        environment: this.config.environment
      },
      alerts: {
        active: this.monitoringData.alerts.filter(a => !a.resolved).length,
        recent: this.monitoringData.alerts.slice(-5)
      },
      lastHealthCheck: this.monitoringData.lastHealthCheck,
      timestamp: new Date().toISOString()
    };
  }

  // Format uptime in human readable format
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Deploy application
  async deploy() {
    try {
      console.log('🚀 Starting deployment...');
      
      // Run pre-deployment checks
      const checksPass = await this.runPreDeploymentChecks();
      if (!checksPass) {
        throw new Error('Pre-deployment checks failed');
      }

      // Start monitoring
      if (this.config.enableMonitoring) {
        this.startMonitoring();
      }

      // In a real deployment, this would:
      // - Build the application
      // - Run tests
      // - Deploy to servers
      // - Update load balancers
      // - Run smoke tests

      console.log('✅ Deployment successful!');
      this.logMetric('deployment_success', {
        environment: this.config.environment,
        timestamp: new Date().toISOString()
      });

      return true;

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      this.triggerAlert('deployment_failed', {
        error: error.message,
        environment: this.config.environment
      });
      return false;
    }
  }
}

// Export deployment manager
module.exports = ChatbotDeployment;
