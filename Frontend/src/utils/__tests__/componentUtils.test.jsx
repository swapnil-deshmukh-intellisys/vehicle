import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM environment for F2P tests
global.document = {
  createElement: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    innerHTML: '',
    textContent: ''
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  CustomEvent: jest.fn((type, options) => ({
    type,
    detail: options?.detail,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false
  })),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn()
};

// Component Utilities
export class ComponentManager {
  constructor() {
    this.components = new Map();
    this.eventListeners = new Map();
  }

  // Register component
  register(id, component) {
    if (this.components.has(id)) {
      throw new Error(`Component ${id} already registered`);
    }
    this.components.set(id, component);
    return this;
  }

  // Get component
  get(id) {
    return this.components.get(id);
  }

  // Unregister component
  unregister(id) {
    const component = this.components.get(id);
    if (component) {
      this.cleanup(id);
      this.components.delete(id);
    }
    return this;
  }

  // Cleanup component
  cleanup(id) {
    const listeners = this.eventListeners.get(id) || [];
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.delete(id);
    return this;
  }

  // Add event listener
  addEventListener(id, element, event, handler) {
    if (!this.components.has(id)) {
      throw new Error(`Component ${id} not found`);
    }
    
    element.addEventListener(event, handler);
    
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, []);
    }
    this.eventListeners.get(id).push({ element, event, handler });
    
    return this;
  }

  // Create component
  create(type, props = {}) {
    const element = document.createElement(type);
    
    // Set attributes
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    return element;
  }

  // Mount component
  mount(component, container) {
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    
    if (!container) {
      throw new Error('Container not found');
    }
    
    container.appendChild(component);
    return this;
  }

  // Unmount component
  unmount(component) {
    if (component && component.parentNode) {
      component.parentNode.removeChild(component);
    }
    return this;
  }

  // Update component props
  updateProps(element, newProps) {
    Object.entries(newProps).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    return this;
  }

  // Clone component
  clone(element) {
    const cloned = element.cloneNode(true);
    return cloned;
  }

  // Get component info
  getInfo(id) {
    const component = this.components.get(id);
    if (!component) return null;
    
    return {
      id,
      type: component.tagName?.toLowerCase() || 'unknown',
      className: component.className || '',
      eventListeners: this.eventListeners.get(id)?.length || 0
    };
  }

  // List all components
  list() {
    return Array.from(this.components.keys()).map(id => this.getInfo(id));
  }

  // Clear all components
  clear() {
    Array.from(this.components.keys()).forEach(id => this.unregister(id));
    return this;
  }
}

// Component Builder
export class ComponentBuilder {
  constructor() {
    this.element = null;
    this.props = {};
    this.children = [];
    this.events = {};
  }

  // Set tag name
  tag(tagName) {
    this.element = document.createElement(tagName);
    return this;
  }

  // Add class
  addClass(className) {
    this.props.className = this.props.className ? 
      `${this.props.className} ${className}` : className;
    return this;
  }

  // Set text content
  text(content) {
    this.props.textContent = content;
    return this;
  }

  // Set HTML content
  html(content) {
    this.props.innerHTML = content;
    return this;
  }

  // Set attribute
  attr(name, value) {
    this.props[name] = value;
    return this;
  }

  // Add style
  style(styles) {
    this.props.style = { ...this.props.style, ...styles };
    return this;
  }

  // Add event listener
  on(event, handler) {
    this.events[event] = handler;
    return this;
  }

  // Add child
  child(child) {
    this.children.push(child);
    return this;
  }

  // Build component
  build() {
    if (!this.element) {
      throw new Error('No tag specified');
    }

    // Apply props
    Object.entries(this.props).forEach(([key, value]) => {
      if (key === 'textContent') {
        this.element.textContent = value;
      } else if (key === 'innerHTML') {
        this.element.innerHTML = value;
      } else if (key === 'className') {
        this.element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(this.element.style, value);
      } else {
        this.element.setAttribute(key, value);
      }
    });

    // Add events
    Object.entries(this.events).forEach(([event, handler]) => {
      this.element.addEventListener(event, handler);
    });

    // Add children
    this.children.forEach(child => {
      if (typeof child === 'string') {
        this.element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        this.element.appendChild(child);
      }
    });

    return this.element;
  }
}

// Component Lifecycle Manager
export class ComponentLifecycleManager {
  constructor() {
    this.hooks = {
      beforeCreate: [],
      created: [],
      beforeMount: [],
      mounted: [],
      beforeUpdate: [],
      updated: [],
      beforeUnmount: [],
      unmounted: []
    };
  }

  // Add hook
  addHook(phase, handler) {
    if (!this.hooks[phase]) {
      throw new Error(`Invalid hook phase: ${phase}`);
    }
    this.hooks[phase].push(handler);
    return this;
  }

  // Execute hooks
  async executeHooks(phase, context = {}) {
    const hooks = this.hooks[phase] || [];
    for (const hook of hooks) {
      await hook(context);
    }
    return this;
  }

  // Create component with lifecycle
  async createComponent(type, props = {}) {
    await this.executeHooks('beforeCreate', { type, props });
    
    const element = document.createElement(type);
    const context = { element, type, props };
    
    await this.executeHooks('created', context);
    return element;
  }

  // Mount component with lifecycle
  async mountComponent(element, container) {
    await this.executeHooks('beforeMount', { element, container });
    
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    
    container.appendChild(element);
    
    await this.executeHooks('mounted', { element, container });
    return this;
  }

  // Update component with lifecycle
  async updateComponent(element, newProps) {
    await this.executeHooks('beforeUpdate', { element, newProps });
    
    Object.entries(newProps).forEach(([key, value]) => {
      if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    await this.executeHooks('updated', { element, newProps });
    return this;
  }

  // Unmount component with lifecycle
  async unmountComponent(element) {
    await this.executeHooks('beforeUnmount', { element });
    
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    
    await this.executeHooks('unmounted', { element });
    return this;
  }
}

// Component Utilities
export const componentUtils = {
  // Create manager
  createManager() {
    return new ComponentManager();
  },

  // Create builder
  createBuilder() {
    return new ComponentBuilder();
  },

  // Create lifecycle manager
  createLifecycleManager() {
    return new ComponentLifecycleManager();
  },

  // Quick component creation
  create(tag, props = {}) {
    const builder = new ComponentBuilder();
    return builder.tag(tag);
  },

  // Mount to DOM
  mount(component, container) {
    const manager = new ComponentManager();
    return manager.mount(component, container);
  },

  // Find components
  find(selector) {
    return document.querySelectorAll(selector);
  },

  // Find single component
  findOne(selector) {
    return document.querySelector(selector);
  }
};

// Test Suite
describe('ComponentUtils', () => {
  let manager;
  let lifecycleManager;

  beforeEach(() => {
    manager = new ComponentManager();
    lifecycleManager = new ComponentLifecycleManager();
    jest.clearAllMocks();
  });

  describe('ComponentManager', () => {
    test('should register component', () => {
      const component = document.createElement('div');
      const result = manager.register('test', component);
      
      expect(result).toBe(manager);
      expect(manager.get('test')).toBe(component);
    });

    test('should throw error when registering duplicate component', () => {
      const component = document.createElement('div');
      manager.register('test', component);
      
      expect(() => manager.register('test', component)).toThrow('Component test already registered');
    });

    test('should unregister component', () => {
      const component = document.createElement('div');
      manager.register('test', component);
      const result = manager.unregister('test');
      
      expect(result).toBe(manager);
      expect(manager.get('test')).toBeUndefined();
    });

    // F2P Tests - Will fail before fix, pass after
    test('should cleanup event listeners on unregister', () => {
      const component = document.createElement('div');
      const handler = jest.fn();
      
      manager.register('test', component);
      manager.addEventListener('test', component, 'click', handler);
      
      // F2P: Should have event listeners registered
      expect(manager.eventListeners.get('test')).toHaveLength(1);
      
      const result = manager.unregister('test');
      
      // F2P: Should cleanup event listeners
      expect(manager.eventListeners.has('test')).toBe(false);
      expect(result).toBe(manager);
    });

    test('should throw error when adding event listener to non-existent component', () => {
      const component = document.createElement('div');
      const handler = jest.fn();
      
      // F2P: Should throw error for non-existent component
      expect(() => manager.addEventListener('nonexistent', component, 'click', handler))
        .toThrow('Component nonexistent not found');
    });

    test('should create component with props', () => {
      const result = manager.create('div', {
        className: 'test-class',
        id: 'test-id',
        textContent: 'test content',
        style: { color: 'red', fontSize: '16px' }
      });
      
      expect(result.tagName.toLowerCase()).toBe('div');
      expect(result.className).toBe('test-class');
      expect(result.id).toBe('test-id');
      expect(result.textContent).toBe('test content');
      expect(result.style.color).toBe('red');
      expect(result.style.fontSize).toBe('16px');
    });

    // F2P Tests
    test('should mount component to container', () => {
      const component = document.createElement('div');
      const container = document.createElement('div');
      
      document.getElementById.mockReturnValue(container);
      
      const result = manager.mount(component, 'container');
      
      expect(container.appendChild).toHaveBeenCalledWith(component);
      expect(result).toBe(manager);
    });

    test('should throw error when container not found', () => {
      const component = document.createElement('div');
      document.getElementById.mockReturnValue(null);
      
      // F2P: Should throw error for missing container
      expect(() => manager.mount(component, 'nonexistent'))
        .toThrow('Container not found');
    });

    test('should unmount component', () => {
      const component = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(component);
      
      const result = manager.unmount(component);
      
      expect(parent.removeChild).toHaveBeenCalledWith(component);
      expect(result).toBe(manager);
    });

    test('should update component props', () => {
      const component = document.createElement('div');
      
      const result = manager.updateProps(component, {
        className: 'new-class',
        textContent: 'new content',
        style: { backgroundColor: 'blue' }
      });
      
      expect(component.className).toBe('new-class');
      expect(component.textContent).toBe('new content');
      expect(component.style.backgroundColor).toBe('blue');
      expect(result).toBe(manager);
    });

    test('should clone component', () => {
      const component = document.createElement('div');
      component.textContent = 'test';
      
      const cloned = manager.clone(component);
      
      expect(cloned.textContent).toBe('test');
      expect(cloned).not.toBe(component);
    });

    test('should get component info', () => {
      const component = document.createElement('div');
      component.className = 'test-class';
      
      manager.register('test', component);
      const info = manager.getInfo('test');
      
      expect(info).toEqual({
        id: 'test',
        type: 'div',
        className: 'test-class',
        eventListeners: 0
      });
    });

    test('should return null for non-existent component info', () => {
      const info = manager.getInfo('nonexistent');
      expect(info).toBeNull();
    });

    test('should list all components', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      
      manager.register('test1', div);
      manager.register('test2', span);
      
      const list = manager.list();
      
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('test1');
      expect(list[1].id).toBe('test2');
    });

    test('should clear all components', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      
      manager.register('test1', div);
      manager.register('test2', span);
      
      const result = manager.clear();
      
      expect(manager.components.size).toBe(0);
      expect(result).toBe(manager);
    });
  });

  describe('ComponentBuilder', () => {
    let builder;

    beforeEach(() => {
      builder = new ComponentBuilder();
    });

    test('should build basic component', () => {
      const element = builder.tag('div').build();
      
      expect(element.tagName.toLowerCase()).toBe('div');
    });

    test('should throw error when no tag specified', () => {
      expect(() => builder.build()).toThrow('No tag specified');
    });

    test('should add class', () => {
      const element = builder.tag('div').addClass('test-class').build();
      
      expect(element.className).toBe('test-class');
    });

    test('should add multiple classes', () => {
      const element = builder
        .tag('div')
        .addClass('class1')
        .addClass('class2')
        .build();
      
      expect(element.className).toBe('class1 class2');
    });

    test('should set text content', () => {
      const element = builder.tag('div').text('test content').build();
      
      expect(element.textContent).toBe('test content');
    });

    test('should set HTML content', () => {
      const element = builder.tag('div').html('<span>test</span>').build();
      
      expect(element.innerHTML).toBe('<span>test</span>');
    });

    test('should set attribute', () => {
      const element = builder.tag('div').attr('id', 'test-id').build();
      
      expect(element.id).toBe('test-id');
    });

    test('should set style', () => {
      const element = builder
        .tag('div')
        .style({ color: 'red', fontSize: '16px' })
        .build();
      
      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
    });

    test('should add event listener', () => {
      const handler = jest.fn();
      const element = builder.tag('div').on('click', handler).build();
      
      expect(element.addEventListener).toHaveBeenCalledWith('click', handler);
    });

    test('should add child element', () => {
      const child = document.createElement('span');
      const element = builder.tag('div').child(child).build();
      
      expect(element.appendChild).toHaveBeenCalledWith(child);
    });

    test('should add child text', () => {
      const element = builder.tag('div').child('text content').build();
      
      expect(element.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({ nodeType: 3 })
      );
    });

    // F2P Tests
    test('should build complex component', () => {
      const handler = jest.fn();
      const child = document.createElement('span');
      
      const element = builder
        .tag('div')
        .addClass('container')
        .attr('id', 'main')
        .text('Hello')
        .style({ padding: '10px' })
        .on('click', handler)
        .child(child)
        .child('World')
        .build();
      
      expect(element.className).toBe('container');
      expect(element.id).toBe('main');
      expect(element.style.padding).toBe('10px');
      expect(element.addEventListener).toHaveBeenCalledWith('click', handler);
      expect(element.appendChild).toHaveBeenCalledWith(child);
      expect(element.textContent).toBe('Hello');
    });
  });

  describe('ComponentLifecycleManager', () => {
    test('should add hook', () => {
      const handler = jest.fn();
      const result = lifecycleManager.addHook('beforeCreate', handler);
      
      expect(result).toBe(lifecycleManager);
      expect(lifecycleManager.hooks.beforeCreate).toContain(handler);
    });

    test('should throw error for invalid hook phase', () => {
      const handler = jest.fn();
      
      expect(() => lifecycleManager.addHook('invalidPhase', handler))
        .toThrow('Invalid hook phase: invalidPhase');
    });

    // F2P Tests
    test('should execute hooks in order', async () => {
      const order = [];
      const handler1 = jest.fn(() => order.push('1'));
      const handler2 = jest.fn(() => order.push('2'));
      
      lifecycleManager.addHook('beforeCreate', handler1);
      lifecycleManager.addHook('beforeCreate', handler2);
      
      await lifecycleManager.executeHooks('beforeCreate', { type: 'div' });
      
      expect(handler1).toHaveBeenCalledWith({ type: 'div' });
      expect(handler2).toHaveBeenCalledWith({ type: 'div' });
      expect(order).toEqual(['1', '2']);
    });

    test('should create component with lifecycle', async () => {
      const beforeCreate = jest.fn();
      const created = jest.fn();
      
      lifecycleManager.addHook('beforeCreate', beforeCreate);
      lifecycleManager.addHook('created', created);
      
      const element = await lifecycleManager.createComponent('div', { className: 'test' });
      
      expect(beforeCreate).toHaveBeenCalledWith({ type: 'div', props: { className: 'test' } });
      expect(created).toHaveBeenCalledWith(
        expect.objectContaining({ element, type: 'div', props: { className: 'test' } })
      );
      expect(element.tagName.toLowerCase()).toBe('div');
    });

    test('should mount component with lifecycle', async () => {
      const beforeMount = jest.fn();
      const mounted = jest.fn();
      const component = document.createElement('div');
      const container = document.createElement('div');
      
      lifecycleManager.addHook('beforeMount', beforeMount);
      lifecycleManager.addHook('mounted', mounted);
      
      await lifecycleManager.mountComponent(component, container);
      
      expect(beforeMount).toHaveBeenCalledWith({ element: component, container });
      expect(mounted).toHaveBeenCalledWith({ element: component, container });
      expect(container.appendChild).toHaveBeenCalledWith(component);
    });

    test('should update component with lifecycle', async () => {
      const beforeUpdate = jest.fn();
      const updated = jest.fn();
      const component = document.createElement('div');
      
      lifecycleManager.addHook('beforeUpdate', beforeUpdate);
      lifecycleManager.addHook('updated', updated);
      
      await lifecycleManager.updateComponent(component, { textContent: 'new content' });
      
      expect(beforeUpdate).toHaveBeenCalledWith({ element: component, newProps: { textContent: 'new content' } });
      expect(updated).toHaveBeenCalledWith({ element: component, newProps: { textContent: 'new content' } });
      expect(component.textContent).toBe('new content');
    });

    test('should unmount component with lifecycle', async () => {
      const beforeUnmount = jest.fn();
      const unmounted = jest.fn();
      const component = document.createElement('div');
      const parent = document.createElement('div');
      parent.appendChild(component);
      
      lifecycleManager.addHook('beforeUnmount', beforeUnmount);
      lifecycleManager.addHook('unmounted', unmounted);
      
      await lifecycleManager.unmountComponent(component);
      
      expect(beforeUnmount).toHaveBeenCalledWith({ element: component });
      expect(unmounted).toHaveBeenCalledWith({ element: component });
      expect(parent.removeChild).toHaveBeenCalledWith(component);
    });
  });

  describe('ComponentUtils', () => {
    test('should create manager', () => {
      const result = componentUtils.createManager();
      expect(result).toBeInstanceOf(ComponentManager);
    });

    test('should create builder', () => {
      const result = componentUtils.createBuilder();
      expect(result).toBeInstanceOf(ComponentBuilder);
    });

    test('should create lifecycle manager', () => {
      const result = componentUtils.createLifecycleManager();
      expect(result).toBeInstanceOf(ComponentLifecycleManager);
    });

    test('should create quick component', () => {
      const result = componentUtils.create('div');
      expect(result).toBeInstanceOf(ComponentBuilder);
    });

    test('should mount component', () => {
      const component = document.createElement('div');
      const container = document.createElement('div');
      
      const result = componentUtils.mount(component, container);
      
      expect(container.appendChild).toHaveBeenCalledWith(component);
    });

    test('should find components', () => {
      const result = componentUtils.find('.test');
      expect(document.querySelectorAll).toHaveBeenCalledWith('.test');
    });

    test('should find single component', () => {
      const result = componentUtils.findOne('.test');
      expect(document.querySelector).toHaveBeenCalledWith('.test');
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete component lifecycle workflow', async () => {
      const lifecycleManager = componentUtils.createLifecycleManager();
      const manager = componentUtils.createManager();
      
      // Add lifecycle hooks
      const beforeCreate = jest.fn();
      const created = jest.fn();
      const beforeMount = jest.fn();
      const mounted = jest.fn();
      
      lifecycleManager.addHook('beforeCreate', beforeCreate);
      lifecycleManager.addHook('created', created);
      lifecycleManager.addHook('beforeMount', beforeMount);
      lifecycleManager.addHook('mounted', mounted);
      
      // Create component
      const component = await lifecycleManager.createComponent('div', { className: 'test' });
      
      // Register component
      manager.register('test', component);
      
      // Mount component
      const container = document.createElement('div');
      await lifecycleManager.mountComponent(component, container);
      
      // Verify lifecycle hooks were called
      expect(beforeCreate).toHaveBeenCalled();
      expect(created).toHaveBeenCalled();
      expect(beforeMount).toHaveBeenCalled();
      expect(mounted).toHaveBeenCalled();
      
      // Verify component is registered and mounted
      expect(manager.get('test')).toBe(component);
      expect(container.appendChild).toHaveBeenCalledWith(component);
    });

    test('should handle component builder with lifecycle integration', async () => {
      const lifecycleManager = componentUtils.createLifecycleManager();
      const beforeCreate = jest.fn();
      const created = jest.fn();
      
      lifecycleManager.addHook('beforeCreate', beforeCreate);
      lifecycleManager.addHook('created', created);
      
      // Create component with builder
      const component = componentUtils
        .create('div')
        .addClass('container')
        .text('Hello World')
        .style({ padding: '10px' })
        .build();
      
      // Apply lifecycle
      await lifecycleManager.executeHooks('created', { element: component, type: 'div', props: {} });
      
      expect(component.className).toBe('container');
      expect(component.textContent).toBe('Hello World');
      expect(component.style.padding).toBe('10px');
      expect(created).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // F2P Tests
    test('should handle invalid component operations gracefully', () => {
      const manager = componentUtils.createManager();
      
      // F2P: Should handle operations on non-existent components
      expect(() => manager.addEventListener('invalid', {}, 'click', () => {}))
        .toThrow('Component invalid not found');
      
      expect(manager.get('invalid')).toBeUndefined();
      expect(manager.getInfo('invalid')).toBeNull();
      expect(manager.unregister('invalid')).toBe(manager);
    });

    test('should handle builder errors gracefully', () => {
      const builder = componentUtils.createBuilder();
      
      // F2P: Should handle building without tag
      expect(() => builder.build()).toThrow('No tag specified');
      
      // F2P: Should handle invalid operations
      const validBuilder = builder.tag('div');
      expect(() => validBuilder.build()).not.toThrow();
    });

    test('should handle lifecycle errors gracefully', async () => {
      const lifecycleManager = componentUtils.createLifecycleManager();
      
      // F2P: Should handle invalid hook phase
      expect(() => lifecycleManager.addHook('invalid', () => {}))
        .toThrow('Invalid hook phase: invalid');
      
      // F2P: Should handle missing hooks gracefully
      await lifecycleManager.executeHooks('nonExistent');
      expect(true).toBe(true); // Should not throw
    });
  });
});
