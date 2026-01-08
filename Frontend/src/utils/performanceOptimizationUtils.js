// Comprehensive performance optimization utility functions

// Performance Monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.startMetricsCollection();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.disconnectObservers();
  }

  setupObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          });
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.add(navObserver);

      // Performance Observer for resources
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('resource', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: entry.entryType
          });
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.add(resourceObserver);

      // Performance Observer for paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('paint', {
            name: entry.name,
            startTime: entry.startTime,
            type: entry.entryType
          });
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.add(paintObserver);
    }
  }

  disconnectObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  startMetricsCollection() {
    // FPS monitoring
    this.startFPSMonitoring();
    
    // Memory monitoring
    this.startMemoryMonitoring();
    
    // Network monitoring
    this.startNetworkMonitoring();
  }

  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', { value: fps, timestamp: currentTime });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  startMemoryMonitoring() {
    if ('memory' in performance) {
      const measureMemory = () => {
        if (!this.isMonitoring) return;
        
        const memory = performance.memory;
        this.recordMetric('memory', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: performance.now()
        });
        
        setTimeout(measureMemory, 5000); // Measure every 5 seconds
      };
      
      measureMemory();
    }
  }

  startNetworkMonitoring() {
    // Monitor network connection
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.recordMetric('network', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: performance.now()
      });

      connection.addEventListener('change', () => {
        this.recordMetric('network', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: performance.now()
        });
      });
    }
  }

  recordMetric(type, data) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    this.metrics.get(type).push({
      ...data,
      timestamp: data.timestamp || performance.now()
    });

    // Keep only last 100 entries per type
    const entries = this.metrics.get(type);
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
  }

  getMetrics(type = null) {
    if (type) {
      return this.metrics.get(type) || [];
    }
    
    const result = {};
    for (const [key, value] of this.metrics) {
      result[key] = value;
    }
    return result;
  }

  getAverageMetric(type, field = 'duration') {
    const entries = this.metrics.get(type);
    if (!entries || entries.length === 0) return 0;
    
    const values = entries.map(entry => entry[field]).filter(v => typeof v === 'number');
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {}
    };

    // Generate summary for each metric type
    for (const [type, entries] of this.metrics) {
      if (entries.length === 0) continue;

      const summary = {
        count: entries.length,
        average: 0,
        min: Infinity,
        max: -Infinity
      };

      // Calculate numeric fields
      const numericFields = new Set();
      entries.forEach(entry => {
        Object.keys(entry).forEach(key => {
          if (typeof entry[key] === 'number' && key !== 'timestamp') {
            numericFields.add(key);
          }
        });
      });

      numericFields.forEach(field => {
        const values = entries.map(e => e[field]).filter(v => typeof v === 'number');
        if (values.length > 0) {
          summary[field] = {
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      });

      report.summary[type] = summary;
      report.details[type] = entries.slice(-10); // Last 10 entries
    }

    return report;
  }
}

// Lazy Loading Utilities
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async loadComponent(importFunction, name = null) {
    const componentName = name || importFunction.name || 'component';
    
    // Return cached module if already loaded
    if (this.loadedModules.has(componentName)) {
      return this.loadedModules.get(componentName);
    }

    // Return existing promise if currently loading
    if (this.loadingPromises.has(componentName)) {
      return this.loadingPromises.get(componentName);
    }

    // Start loading
    const loadingPromise = this.doLoad(importFunction, componentName);
    this.loadingPromises.set(componentName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(componentName, module);
      this.loadingPromises.delete(componentName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(componentName);
      throw error;
    }
  }

  async doLoad(importFunction, componentName) {
    const startTime = performance.now();
    
    try {
      const module = await importFunction();
      const loadTime = performance.now() - startTime;
      
      // Record loading performance
      if (window.performanceMonitor) {
        window.performanceMonitor.recordMetric('lazy-load', {
          component: componentName,
          loadTime,
          timestamp: performance.now()
        });
      }
      
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      // Record loading error
      if (window.performanceMonitor) {
        window.performanceMonitor.recordMetric('lazy-load-error', {
          component: componentName,
          error: error.message,
          loadTime,
          timestamp: performance.now()
        });
      }
      
      throw error;
    }
  }

  preload(importFunction, name = null) {
    // Start loading in background without waiting
    this.loadComponent(importFunction, name).catch(() => {
      // Ignore errors during preload
    });
  }

  clearCache(componentName = null) {
    if (componentName) {
      this.loadedModules.delete(componentName);
      this.loadingPromises.delete(componentName);
    } else {
      this.loadedModules.clear();
      this.loadingPromises.clear();
    }
  }
}

// Memory Management
export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.memoryThreshold = 0.8; // 80% of available memory
  }

  addCleanupTask(task, priority = 'normal') {
    this.cleanupTasks.add({ task, priority, id: Date.now() + Math.random() });
  }

  removeCleanupTask(id) {
    for (const task of this.cleanupTasks) {
      if (task.id === id) {
        this.cleanupTasks.delete(task);
        break;
      }
    }
  }

  async cleanup() {
    const tasks = Array.from(this.cleanupTasks);
    
    // Sort by priority (high > normal > low)
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    for (const { task } of tasks) {
      try {
        await task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usageRatio > this.memoryThreshold) {
        this.cleanup();
        return true; // Cleanup was triggered
      }
    }
    
    return false; // No cleanup needed
  }

  getMemoryInfo() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }
    
    return null;
  }
}

// Bundle Optimization
export class BundleOptimizer {
  constructor() {
    this.bundleInfo = null;
    this.optimizationSuggestions = [];
  }

  async analyzeBundle() {
    // This would typically be done at build time
    // Here we'll simulate bundle analysis
    const bundleInfo = await this.getBundleInfo();
    this.bundleInfo = bundleInfo;
    this.generateOptimizationSuggestions();
    return bundleInfo;
  }

  async getBundleInfo() {
    // Simulate bundle analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalSize: 1024 * 1024, // 1MB
          chunks: [
            { name: 'main', size: 500 * 1024 },
            { name: 'vendor', size: 300 * 1024 },
            { name: 'common', size: 200 * 1024 },
            { name: 'runtime', size: 24 * 1024 }
          ],
          assets: [
            { type: 'js', size: 800 * 1024, count: 15 },
            { type: 'css', size: 100 * 1024, count: 5 },
            { type: 'image', size: 124 * 1024, count: 20 }
          ],
          dependencies: 150,
          unusedExports: 25,
          duplicateCode: 50 * 1024
        });
      }, 100);
    });
  }

  generateOptimizationSuggestions() {
    this.optimizationSuggestions = [];

    if (!this.bundleInfo) return;

    const { totalSize, chunks, assets, dependencies, unusedExports, duplicateCode } = this.bundleInfo;

    // Bundle size suggestions
    if (totalSize > 500 * 1024) { // > 500KB
      this.optimizationSuggestions.push({
        type: 'bundle-size',
        priority: 'high',
        message: 'Bundle size is large. Consider code splitting and tree shaking.',
        savings: totalSize * 0.3 // Estimated 30% savings
      });
    }

    // Chunk optimization
    const largeChunks = chunks.filter(chunk => chunk.size > 200 * 1024);
    if (largeChunks.length > 0) {
      this.optimizationSuggestions.push({
        type: 'chunk-optimization',
        priority: 'medium',
        message: `Found ${largeChunks.length} large chunks. Consider further splitting.`,
        chunks: largeChunks.map(c => c.name)
      });
    }

    // Asset optimization
    const largeImages = assets.find(a => a.type === 'image');
    if (largeImages && largeImages.size > 100 * 1024) {
      this.optimizationSuggestions.push({
        type: 'image-optimization',
        priority: 'medium',
        message: 'Images are large. Consider compression and modern formats.',
        savings: largeImages.size * 0.4 // Estimated 40% savings
      });
    }

    // Dependency optimization
    if (dependencies > 100) {
      this.optimizationSuggestions.push({
        type: 'dependency-optimization',
        priority: 'low',
        message: 'Many dependencies. Review and remove unused packages.',
        dependencies: dependencies
      });
    }

    // Unused code
    if (unusedExports > 0) {
      this.optimizationSuggestions.push({
        type: 'unused-code',
        priority: 'medium',
        message: `Found ${unusedExports} unused exports. Enable tree shaking.`,
        savings: unusedExports * 1024 // Estimated savings
      });
    }

    // Duplicate code
    if (duplicateCode > 0) {
      this.optimizationSuggestions.push({
        type: 'duplicate-code',
        priority: 'low',
        message: `Found ${duplicateCode} bytes of duplicate code. Consider deduplication.`,
        savings: duplicateCode * 0.8 // Estimated 80% savings
      });
    }
  }

  getOptimizationSuggestions() {
    return this.optimizationSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async applyOptimizations() {
    // This would typically involve build-time optimizations
    // Here we'll simulate the process
    const suggestions = this.getOptimizationSuggestions();
    const appliedOptimizations = [];

    for (const suggestion of suggestions) {
      try {
        await this.applyOptimization(suggestion);
        appliedOptimizations.push(suggestion);
      } catch (error) {
        console.error(`Failed to apply optimization: ${suggestion.type}`, error);
      }
    }

    return appliedOptimizations;
  }

  async applyOptimization(suggestion) {
    // Simulate optimization application
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Applied optimization: ${suggestion.type}`);
        resolve();
      }, 50);
    });
  }
}

// Resource Optimization
export class ResourceOptimizer {
  constructor() {
    this.optimizedResources = new Map();
    this.compressionEnabled = true;
  }

  async optimizeImage(imageUrl, options = {}) {
    const {
      format = 'webp',
      quality = 80,
      maxWidth = 1920,
      maxHeight = 1080
    } = options;

    // Check cache first
    const cacheKey = `${imageUrl}-${format}-${quality}-${maxWidth}-${maxHeight}`;
    if (this.optimizedResources.has(cacheKey)) {
      return this.optimizedResources.get(cacheKey);
    }

    try {
      // Simulate image optimization
      const optimizedUrl = await this.doImageOptimization(imageUrl);
      this.optimizedResources.set(cacheKey, optimizedUrl);
      return optimizedUrl;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return imageUrl; // Fallback to original
    }
  }

  async doImageOptimization(imageUrl) {
    // In a real implementation, this would use an image optimization service
    // For now, we'll simulate the process
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate optimized URL
        const optimizedUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, `.webp`);
        resolve(optimizedUrl);
      }, 100);
    });
  }

  async preloadCriticalResources(resources) {
    const preloadPromises = resources.map(resource => {
      return this.preloadResource(resource);
    });

    await Promise.allSettled(preloadPromises);
  }

  async preloadResource(resource) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      
      if (resource.type === 'script') {
        link.as = 'script';
      } else if (resource.type === 'style') {
        link.as = 'style';
      } else if (resource.type === 'image') {
        link.as = 'image';
      } else if (resource.type === 'font') {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${resource.url}`));
      
      document.head.appendChild(link);
    });
  }

  enableResourceHints() {
    // Add DNS prefetch for external domains
    const externalDomains = ['fonts.googleapis.com', 'cdn.example.com'];
    
    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Add preconnect for critical domains
    const criticalDomains = ['fonts.gstatic.com'];
    
    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });
  }

  clearCache() {
    this.optimizedResources.clear();
  }
}

// Create global instances
export const performanceMonitor = new PerformanceMonitor();
export const lazyLoader = new LazyLoader();
export const memoryManager = new MemoryManager();
export const bundleOptimizer = new BundleOptimizer();
export const resourceOptimizer = new ResourceOptimizer();

// Initialize performance monitoring
export const initializePerformanceOptimization = () => {
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // Set up memory management
  memoryManager.addCleanupTask(() => {
    // Clear caches
    lazyLoader.clearCache();
    resourceOptimizer.clearCache();
  }, 'high');

  // Check memory usage periodically
  setInterval(() => {
    memoryManager.checkMemoryUsage();
  }, 30000); // Every 30 seconds

  // Enable resource hints
  resourceOptimizer.enableResourceHints();

  // Monitor page visibility for optimization
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, reduce activity
      performanceMonitor.stopMonitoring();
    } else {
      // Page is visible, resume activity
      performanceMonitor.startMonitoring();
    }
  });
};
