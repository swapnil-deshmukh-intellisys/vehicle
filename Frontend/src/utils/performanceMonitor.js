// Performance monitoring utilities

// Performance metrics collector
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isMonitoring = false;
  }

  // Start monitoring
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.startMetricsCollection();
  }

  // Stop monitoring
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.disconnectObservers();
  }

  // Setup performance observers
  setupObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              totalLoadTime: entry.loadEventEnd - entry.fetchStart
            });
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    }

    // Resource timing
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.recordMetric('resource', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize || 0,
              type: this.getResourceType(entry.name)
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }

    // Long task timing
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'longtask') {
            this.recordMetric('longtask', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }
  }

  // Disconnect all observers
  disconnectObservers() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // Start metrics collection
  startMetricsCollection() {
    // Collect initial page load metrics
    this.collectPageLoadMetrics();
    
    // Monitor FPS
    this.startFPSMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  // Collect page load metrics
  collectPageLoadMetrics() {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      const navigation = performance.navigation;
      
      this.recordMetric('pageLoad', {
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnection: timing.connectEnd - timing.connectStart,
        serverResponse: timing.responseEnd - timing.requestStart,
        domProcessing: timing.domComplete - timing.domLoading,
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        redirectTime: timing.redirectEnd - timing.redirectStart,
        navigationType: navigation.type
      });
    }
  }

  // Start FPS monitoring
  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.recordMetric('fps', {
          value: fps,
          timestamp: currentTime
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Start memory monitoring
  startMemoryMonitoring() {
    const measureMemory = () => {
      if (!this.isMonitoring) return;
      
      if ('memory' in performance) {
        this.recordMetric('memory', {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          timestamp: performance.now()
        });
      }
      
      setTimeout(measureMemory, 5000); // Measure every 5 seconds
    };
    
    measureMemory();
  }

  // Record a metric
  recordMetric(type, data) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    this.metrics.get(type).push({
      ...data,
      timestamp: data.timestamp || performance.now()
    });
  }

  // Get metrics by type
  getMetrics(type) {
    return this.metrics.get(type) || [];
  }

  // Get all metrics
  getAllMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getAllMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: metrics
    };

    // Calculate summary statistics
    if (metrics.fps && metrics.fps.length > 0) {
      const fpsValues = metrics.fps.map(m => m.value);
      report.summary.fps = {
        average: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
        min: Math.min(...fpsValues),
        max: Math.max(...fpsValues)
      };
    }

    if (metrics.pageLoad && metrics.pageLoad.length > 0) {
      const pageLoad = metrics.pageLoad[0];
      report.summary.pageLoad = pageLoad;
    }

    if (metrics.memory && metrics.memory.length > 0) {
      const latestMemory = metrics.memory[metrics.memory.length - 1];
      report.summary.memory = latestMemory;
    }

    if (metrics.longtask && metrics.longtask.length > 0) {
      const totalLongTaskTime = metrics.longtask.reduce((sum, task) => sum + task.duration, 0);
      report.summary.longTasks = {
        count: metrics.longtask.length,
        totalTime: totalLongTaskTime,
        averageTime: totalLongTaskTime / metrics.longtask.length
      };
    }

    return report;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// Create performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance marks and measures
export const markPerformance = (name) => {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
};

export const measurePerformance = (name, startMark, endMark) => {
  if ('performance' in window && 'measure' in performance) {
    performance.measure(name, startMark, endMark);
    const measures = performance.getEntriesByName(name, 'measure');
    return measures.length > 0 ? measures[measures.length - 1].duration : 0;
  }
  return 0;
};

// Function performance wrapper
export const measureFunctionPerformance = (fn, name) => {
  return async (...args) => {
    const START_TIME = performance.now();
    markPerformance(`${name}-start`);
    
    try {
      const result = await fn(...args);
      markPerformance(`${name}-end`);
      
      const duration = measurePerformance(name, `${name}-start`, `${name}-end`);
      
      performanceMonitor.recordMetric('function', {
        name,
        duration,
        success: true,
        timestamp: performance.now()
      });
      
      return result;
    } catch (error) {
      markPerformance(`${name}-end`);
      
      const duration = measurePerformance(name, `${name}-start`, `${name}-end`);
      
      performanceMonitor.recordMetric('function', {
        name,
        duration,
        success: false,
        error: error.message,
        timestamp: performance.now()
      });
      
      throw error;
    }
  };
};

// Component render performance monitoring
export const monitorComponentRender = (componentName, renderFunction) => {
  return measureFunctionPerformance(renderFunction, `${componentName}-render`);
};

// Network performance monitoring
export const monitorNetworkRequest = (url, method = 'GET') => {
  const START_TIME = performance.now();
  markPerformance(`request-${method}-${url}-start`);
  
  return {
    start: START_TIME,
    end: (success = true, responseSize = 0) => {
      markPerformance(`request-${method}-${url}-end`);
      const duration = measurePerformance(`request-${method}-${url}`, 
        `request-${method}-${url}-start`, 
        `request-${method}-${url}-end`);
      
      performanceMonitor.recordMetric('network', {
        url,
        method,
        duration,
        success,
        responseSize,
        timestamp: performance.now()
      });
    }
  };
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  performanceMonitor.start();
  
  // Generate report every 30 seconds
  setInterval(() => {
    const report = performanceMonitor.generateReport();
    console.log('Performance Report:', report);
  }, 30000);
};

// Get performance score
export const getPerformanceScore = () => {
  const report = performanceMonitor.generateReport();
  let score = 100;
  
  // Deduct points for poor FPS
  if (report.summary.fps && report.summary.fps.average < 30) {
    score -= 20;
  } else if (report.summary.fps && report.summary.fps.average < 50) {
    score -= 10;
  }
  
  // Deduct points for slow page load
  if (report.summary.pageLoad && report.summary.pageLoad.pageLoadTime > 3000) {
    score -= 20;
  } else if (report.summary.pageLoad && report.summary.pageLoad.pageLoadTime > 2000) {
    score -= 10;
  }
  
  // Deduct points for long tasks
  if (report.summary.longTasks && report.summary.longTasks.totalTime > 200) {
    score -= 15;
  }
  
  return Math.max(0, score);
};
