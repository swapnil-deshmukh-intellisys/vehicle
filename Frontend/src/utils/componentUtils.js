// Comprehensive component utility functions

// Component Factory Class
export class ComponentFactory {
  constructor() {
    this.components = new Map();
    this.hooks = new Map();
    this.middleware = [];
    this.defaultOptions = {
      className: '',
      id: null,
      attributes: {},
      events: {},
      children: []
    };
  }

  // Register component
  register(name, factory) {
    this.components.set(name, factory);
  }

  // Register hook
  registerHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(callback);
  }

  // Add middleware
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  // Create component
  create(name, props = {}) {
    const factory = this.components.get(name);
    if (!factory) {
      throw new Error(`Component '${name}' not found`);
    }

    const options = { ...this.defaultOptions, ...props };
    
    // Apply before hooks
    this.applyHooks('beforeCreate', options);

    // Apply middleware
    let processedOptions = options;
    for (const middleware of this.middleware) {
      processedOptions = middleware(processedOptions, name);
    }

    // Create component
    const component = factory(processedOptions);

    // Apply after hooks
    this.applyHooks('afterCreate', component, processedOptions);

    return component;
  }

  // Apply hooks
  applyHooks(hookName, ...args) {
    const hooks = this.hooks.get(hookName) || [];
    hooks.forEach(hook => {
      try {
        hook(...args);
      } catch (error) {
        console.error(`Hook '${hookName}' error:`, error);
      }
    });
  }

  // Get registered components
  getComponents() {
    return Array.from(this.components.keys());
  }
}

// Component Validator Class
export class ComponentValidator {
  constructor() {
    this.schemas = new Map();
    this.validators = new Map();
  }

  // Add validation schema
  addSchema(componentName, schema) {
    this.schemas.set(componentName, schema);
  }

  // Add custom validator
  addValidator(name, validator) {
    this.validators.set(name, validator);
  }

  // Validate component props
  validate(componentName, props) {
    const schema = this.schemas.get(componentName);
    if (!schema) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    
    Object.entries(schema).forEach(([propName, rules]) => {
      const value = props[propName];
      const propErrors = this.validateProperty(propName, value, rules);
      errors.push(...propErrors);
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate individual property
  validateProperty(propName, value, rules) {
    const errors = [];

    rules.forEach(rule => {
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${propName} is required`);
        return;
      }

      if (value !== undefined && value !== null) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${propName} must be of type ${rule.type}`);
        }

        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${propName} must be at least ${rule.min}`);
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${propName} must be at most ${rule.max}`);
        }

        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          errors.push(`${propName} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push(`${propName} must be at most ${rule.maxLength} characters`);
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${propName} format is invalid`);
        }

        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${propName} must be one of: ${rule.enum.join(', ')}`);
        }

        if (rule.custom && typeof rule.custom === 'function') {
          const customError = rule.custom(value);
          if (customError) {
            errors.push(`${propName}: ${customError}`);
          }
        }
      }
    });

    return errors;
  }
}

// Component State Manager
export class ComponentStateManager {
  constructor() {
    this.states = new Map();
    this.subscribers = new Map();
    this.history = new Map();
    this.maxHistorySize = 50;
  }

  // Create state for component
  createState(componentId, initialState = {}) {
    const state = {
      ...initialState,
      _componentId: componentId,
      _timestamp: Date.now()
    };

    this.states.set(componentId, state);
    this.history.set(componentId, [state]);

    return state;
  }

  // Get component state
  getState(componentId) {
    return this.states.get(componentId);
  }

  // Update component state
  updateState(componentId, updates) {
    const currentState = this.states.get(componentId);
    if (!currentState) {
      console.warn(`State for component '${componentId}' not found`);
      return;
    }

    const newState = {
      ...currentState,
      ...updates,
      _timestamp: Date.now()
    };

    this.states.set(componentId, newState);
    this.addToHistory(componentId, newState);
    this.notifySubscribers(componentId, newState, currentState);

    return newState;
  }

  // Add to history
  addToHistory(componentId, state) {
    const history = this.history.get(componentId) || [];
    history.push(state);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.history.set(componentId, history);
  }

  // Subscribe to state changes
  subscribe(componentId, callback) {
    if (!this.subscribers.has(componentId)) {
      this.subscribers.set(componentId, new Set());
    }

    this.subscribers.get(componentId).add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(componentId);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  // Notify subscribers
  notifySubscribers(componentId, newState, oldState) {
    const subscribers = this.subscribers.get(componentId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(newState, oldState);
        } catch (error) {
          console.error('State subscriber error:', error);
        }
      });
    }
  }

  // Get state history
  getHistory(componentId) {
    return this.history.get(componentId) || [];
  }

  // Clear component state
  clearState(componentId) {
    this.states.delete(componentId);
    this.history.delete(componentId);
    this.subscribers.delete(componentId);
  }

  // Get all states
  getAllStates() {
    return Object.fromEntries(this.states);
  }
}

// Component Event Manager
export class ComponentEventManager {
  constructor() {
    this.listeners = new Map();
    this.globalListeners = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
  }

  // Add event listener
  addListener(componentId, eventType, handler) {
    if (!this.listeners.has(componentId)) {
      this.listeners.set(componentId, new Map());
    }

    const componentListeners = this.listeners.get(componentId);
    if (!componentListeners.has(eventType)) {
      componentListeners.set(eventType, new Set());
    }

    componentListeners.get(eventType).add(handler);

    // Return remove function
    return () => {
      const listeners = this.listeners.get(componentId);
      if (listeners) {
        const eventListeners = listeners.get(eventType);
        if (eventListeners) {
          eventListeners.delete(handler);
        }
      }
    };
  }

  // Add global event listener
  addGlobalListener(eventType, handler) {
    if (!this.globalListeners.has(eventType)) {
      this.globalListeners.set(eventType, new Set());
    }

    this.globalListeners.get(eventType).add(handler);

    // Return remove function
    return () => {
      const listeners = this.globalListeners.get(eventType);
      if (listeners) {
        listeners.delete(handler);
      }
    };
  }

  // Emit event
  emit(componentId, eventType, data) {
    const event = {
      componentId,
      eventType,
      data,
      timestamp: Date.now(),
      preventDefault: false,
      stopPropagation: false
    };

    this.eventQueue.push(event);

    if (!this.isProcessing) {
      this.processEventQueue();
    }

    return event;
  }

  // Process event queue
  async processEventQueue() {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.processEvent(event);
    }

    this.isProcessing = false;
  }

  processEvent(event) {
    // Process component listeners
    const componentListeners = this.listeners.get(event.componentId);
    if (componentListeners) {
      const eventListeners = componentListeners.get(event.eventType);
      if (eventListeners) {
        for (const handler of eventListeners) {
          if (!event.stopPropagation) {
            try {
              handler(event);
            } catch (handlerError) {
              console.error('Event handler error:', handlerError);
            }
          }
        }
      }
    }

    // Process global listeners
    const globalListeners = this.globalListeners.get(event.eventType);
    if (globalListeners && !event.stopPropagation) {
      for (const handler of globalListeners) {
        try {
          handler(event);
        } catch (globalHandlerError) {
          console.error('Global event handler error:', globalHandlerError);
        }
      }
    }
  }

  // Remove all listeners for component
  removeComponentListeners(componentId) {
    this.listeners.delete(componentId);
  }

  // Get event statistics
  getStats() {
    return {
      componentListeners: this.listeners.size,
      globalListeners: this.globalListeners.size,
      queuedEvents: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Component Lifecycle Manager
export class ComponentLifecycleManager {
  constructor() {
    this.hooks = new Map();
    this.components = new Map();
  }

  // Add lifecycle hook
  addHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(callback);
  }

  // Register component
  register(componentId, component) {
    this.components.set(componentId, {
      component,
      state: 'created',
      hooks: new Map()
    });

    // Trigger created hook
    this.triggerHook('created', componentId, component);
  }

  // Mount component
  mount(componentId) {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      console.warn(`Component '${componentId}' not found`);
      return;
    }

    componentInfo.state = 'mounted';
    this.triggerHook('mounted', componentId, componentInfo.component);
  }

  // Unmount component
  unmount(componentId) {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      console.warn(`Component '${componentId}' not found`);
      return;
    }

    componentInfo.state = 'unmounted';
    this.triggerHook('unmounted', componentId, componentInfo.component);
  }

  // Update component
  update(componentId, props) {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      console.warn(`Component '${componentId}' not found`);
      return;
    }

    this.triggerHook('updated', componentId, componentInfo.component, props);
  }

  // Destroy component
  destroy(componentId) {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      console.warn(`Component '${componentId}' not found`);
      return;
    }

    componentInfo.state = 'destroyed';
    this.triggerHook('destroyed', componentId, componentInfo.component);
    this.components.delete(componentId);
  }

  // Trigger hook
  triggerHook(hookName, componentId, componentData, ...args) {
    const hooks = this.hooks.get(hookName) || [];
    hooks.forEach(hook => {
      try {
        hook(componentId, componentData, ...args);
      } catch (error) {
        console.error(`Lifecycle hook '${hookName}' error:`, error);
      }
    });

    // Trigger component-specific hooks
    const componentInfo = this.components.get(componentId);
    if (componentInfo) {
      const componentHooks = componentInfo.hooks.get(hookName) || [];
      componentHooks.forEach(hook => {
        try {
          hook(componentData, ...args);
        } catch (error) {
          console.error(`Component hook '${hookName}' error:`, error);
        }
      });
    }
  }

  // Add component-specific hook
  addComponentHook(componentId, hookName, callback) {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      console.warn(`Component '${componentId}' not found`);
      return;
    }

    if (!componentInfo.hooks.has(hookName)) {
      componentInfo.hooks.set(hookName, []);
    }
    componentInfo.hooks.get(hookName).push(callback);
  }

  // Get component state
  getComponentState(componentId) {
    const componentInfo = this.components.get(componentId);
    return componentInfo ? componentInfo.state : null;
  }

  // Get all components
  getAllComponents() {
    return Array.from(this.components.keys());
  }
}

// Component Performance Monitor
export class ComponentPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      renderTime: 16, // 60fps
      updateTime: 8,
      mountTime: 50,
      unmountTime: 16
    };
    this.listeners = new Set();
  }

  // Start performance measurement
  start(componentId, operation) {
    const key = `${componentId}-${operation}`;
    this.metrics.set(key, {
      startTime: performance.now(),
      operation,
      componentId
    });
  }

  // End performance measurement
  end(componentId, operation) {
    const key = `${componentId}-${operation}`;
    const metric = this.metrics.get(key);
    
    if (!metric) {
      console.warn(`No metric found for ${key}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const result = {
      componentId,
      operation,
      duration,
      startTime: metric.startTime,
      endTime,
      threshold: this.thresholds[operation],
      exceededThreshold: duration > this.thresholds[operation]
    };

    this.metrics.delete(key);
    this.notifyListeners(result);

    return result;
  }

  // Measure function performance
  measure(componentId, operation, fn) {
    this.start(componentId, operation);
    const result = fn();
    this.end(componentId, operation);
    return result;
  }

  // Measure async function performance
  async measureAsync(componentId, operation, fn) {
    this.start(componentId, operation);
    try {
      const result = await fn();
      this.end(componentId, operation);
      return result;
    } catch (error) {
      this.end(componentId, operation);
      throw error;
    }
  }

  // Add performance listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(metric) {
    this.listeners.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Performance listener error:', error);
      }
    });
  }

  // Set threshold
  setThreshold(operation, threshold) {
    this.thresholds[operation] = threshold;
  }

  // Get metrics summary
  getSummary() {
    const summary = {};
    
    Object.keys(this.thresholds).forEach(operation => {
      const operationMetrics = Array.from(this.metrics.values())
        .filter(m => m.operation === operation);
      
      if (operationMetrics.length > 0) {
        summary[operation] = {
          count: operationMetrics.length,
          average: operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / operationMetrics.length,
          min: Math.min(...operationMetrics.map(m => m.duration || 0)),
          max: Math.max(...operationMetrics.map(m => m.duration || 0))
        };
      }
    });

    return summary;
  }
}

// Create global instances
export const componentFactory = new ComponentFactory();
export const componentValidator = new ComponentValidator();
export const componentStateManager = new ComponentStateManager();
export const componentEventManager = new ComponentEventManager();
export const componentLifecycleManager = new ComponentLifecycleManager();
export const componentPerformanceMonitor = new ComponentPerformanceMonitor();

// Initialize component system
export const initializeComponents = (_options = {}) => {
  // Setup default components
  setupDefaultComponents();

  // Setup validation schemas
  setupDefaultSchemas();

  // Setup lifecycle hooks
  setupDefaultHooks();

  return {
    factory: componentFactory,
    validator: componentValidator,
    stateManager: componentStateManager,
    eventManager: componentEventManager,
    lifecycleManager: componentLifecycleManager,
    performanceMonitor: componentPerformanceMonitor
  };
};

// Setup default components
function setupDefaultComponents() {
  // Button component
  componentFactory.register('Button', (props) => {
    const button = document.createElement('button');
    button.className = `btn btn-${props.variant || 'primary'} ${props.className || ''}`;
    button.textContent = props.text || 'Button';
    button.disabled = props.disabled || false;
    
    Object.entries(props.attributes || {}).forEach(([key, value]) => {
      button.setAttribute(key, value);
    });

    Object.entries(props.events || {}).forEach(([event, handler]) => {
      button.addEventListener(event, handler);
    });

    return button;
  });

  // Input component
  componentFactory.register('Input', (props) => {
    const input = document.createElement('input');
    input.className = `form-input ${props.className || ''}`;
    input.type = props.type || 'text';
    input.placeholder = props.placeholder || '';
    input.value = props.value || '';
    input.disabled = props.disabled || false;
    input.required = props.required || false;

    Object.entries(props.attributes || {}).forEach(([key, value]) => {
      input.setAttribute(key, value);
    });

    Object.entries(props.events || {}).forEach(([event, handler]) => {
      input.addEventListener(event, handler);
    });

    return input;
  });

  // Card component
  componentFactory.register('Card', (props) => {
    const card = document.createElement('div');
    card.className = `card ${props.className || ''}`;
    
    if (props.title) {
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = props.title;
      card.appendChild(title);
    }

    if (props.content) {
      const content = document.createElement('div');
      content.className = 'card-content';
      content.innerHTML = props.content;
      card.appendChild(content);
    }

    if (props.children && props.children.length > 0) {
      props.children.forEach(child => {
        card.appendChild(child);
      });
    }

    return card;
  });
}

// Setup default validation schemas
function setupDefaultSchemas() {
  componentValidator.addSchema('Button', {
    text: { type: 'string', required: true },
    variant: { type: 'string', enum: ['primary', 'secondary', 'success', 'danger', 'warning'] },
    disabled: { type: 'boolean' },
    className: { type: 'string' }
  });

  componentValidator.addSchema('Input', {
    type: { type: 'string', enum: ['text', 'email', 'password', 'number', 'tel'] },
    placeholder: { type: 'string' },
    value: { type: 'string' },
    disabled: { type: 'boolean' },
    required: { type: 'boolean' },
    className: { type: 'string' }
  });

  componentValidator.addSchema('Card', {
    title: { type: 'string' },
    content: { type: 'string' },
    className: { type: 'string' }
  });
}

// Setup default lifecycle hooks
function setupDefaultHooks() {
  componentLifecycleManager.addHook('mounted', (componentId, _component) => {
    console.log(`Component ${componentId} mounted`);
  });

  componentLifecycleManager.addHook('unmounted', (componentId, _component) => {
    console.log(`Component ${componentId} unmounted`);
  });

  componentLifecycleManager.addHook('updated', (componentId, _component, props) => {
    console.log(`Component ${componentId} updated with props:`, props);
  });
}
