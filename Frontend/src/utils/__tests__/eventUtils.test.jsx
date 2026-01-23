import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM environment for F2P tests
global.document = {
  createElement: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    bubbles: true,
    cancelable: true,
    composed: false,
    detail: null,
    timeStamp: Date.now(),
    eventPhase: 0,
    type: '',
    view: window,
    srcElement: null,
    cancelBubble: false,
    returnValue: true,
    path: [],
    composedPath: jest.fn(() => [])
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  readyState: 'complete',
  activeElement: null,
  body: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  documentElement: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  CustomEvent: jest.fn((type, options) => ({
    type,
    detail: options?.detail,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false
  })),
  Event: jest.fn((type, options) => ({
    type,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    timeStamp: Date.now(),
    eventPhase: 0,
    view: window,
    srcElement: null,
    cancelBubble: false,
    returnValue: true,
    path: [],
    composedPath: jest.fn(() => [])
  })),
  KeyboardEvent: jest.fn((type, options) => ({
    type,
    key: options?.key || '',
    code: options?.code || '',
    location: options?.location || 0,
    repeat: options?.repeat || false,
    ctrlKey: options?.ctrlKey || false,
    shiftKey: options?.shiftKey || false,
    altKey: options?.altKey || false,
    metaKey: options?.metaKey || false,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    timeStamp: Date.now(),
    eventPhase: 0,
    view: window,
    srcElement: null,
    cancelBubble: false,
    returnValue: true,
    path: [],
    composedPath: jest.fn(() => [])
  })),
  MouseEvent: jest.fn((type, options) => ({
    type,
    clientX: options?.clientX || 0,
    clientY: options?.clientY || 0,
    screenX: options?.screenX || 0,
    screenY: options?.screenY || 0,
    button: options?.button || 0,
    buttons: options?.buttons || 0,
    ctrlKey: options?.ctrlKey || false,
    shiftKey: options?.shiftKey || false,
    altKey: options?.altKey || false,
    metaKey: options?.metaKey || false,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    timeStamp: Date.now(),
    eventPhase: 0,
    view: window,
    srcElement: null,
    cancelBubble: false,
    returnValue: true,
    path: [],
    composedPath: jest.fn(() => [])
  })),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn()
};

// Event Utilities
export class EventUtils {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.delegates = new Map();
  }

  // Add event listener
  on(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) {
      throw new Error('Element not found');
    }

    const wrappedHandler = (e) => {
      try {
        handler.call(element, e);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    };

    element.addEventListener(event, wrappedHandler, options);

    // Store reference for removal
    const key = `${element.constructor.name}-${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push({ element, event, handler: wrappedHandler, originalHandler: handler });

    return this;
  }

  // Add event listener that runs once
  once(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) {
      throw new Error('Element not found');
    }

    const wrappedHandler = (e) => {
      try {
        handler.call(element, e);
      } catch (error) {
        console.error('Event handler error:', error);
      } finally {
        element.removeEventListener(event, wrappedHandler, options);
        // Remove from tracking
        const key = `${element.constructor.name}-${event}`;
        const onceList = this.onceListeners.get(key) || [];
        const index = onceList.findIndex(item => item.handler === wrappedHandler);
        if (index > -1) {
          onceList.splice(index, 1);
        }
      }
    };

    element.addEventListener(event, wrappedHandler, options);

    // Store reference
    const key = `${element.constructor.name}-${event}`;
    if (!this.onceListeners.has(key)) {
      this.onceListeners.set(key, []);
    }
    this.onceListeners.get(key).push({ element, event, handler: wrappedHandler, originalHandler: handler });

    return this;
  }

  // Remove event listener
  off(element, event, handler) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) {
      return this;
    }

    // Find and remove from regular listeners
    const key = `${element.constructor.name}-${event}`;
    const listeners = this.listeners.get(key) || [];
    const index = listeners.findIndex(item => item.originalHandler === handler);
    
    if (index > -1) {
      const { handler: wrappedHandler } = listeners[index];
      element.removeEventListener(event, wrappedHandler);
      listeners.splice(index, 1);
    }

    // Find and remove from once listeners
    const onceListeners = this.onceListeners.get(key) || [];
    const onceIndex = onceListeners.findIndex(item => item.originalHandler === handler);
    
    if (onceIndex > -1) {
      const { handler: wrappedHandler } = onceListeners[onceIndex];
      element.removeEventListener(event, wrappedHandler);
      onceListeners.splice(onceIndex, 1);
    }

    return this;
  }

  // Remove all event listeners
  offAll(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) {
      return this;
    }

    // Remove all regular listeners
    const keys = Array.from(this.listeners.keys()).filter(key => 
      key.startsWith(element.constructor.name)
    );

    keys.forEach(key => {
      const listeners = this.listeners.get(key) || [];
      listeners.forEach(({ element: el, event, handler }) => {
        if (el === element) {
          el.removeEventListener(event, handler);
        }
      });
      this.listeners.delete(key);
    });

    // Remove all once listeners
    const onceKeys = Array.from(this.onceListeners.keys()).filter(key => 
      key.startsWith(element.constructor.name)
    );

    onceKeys.forEach(key => {
      const listeners = this.onceListeners.get(key) || [];
      listeners.forEach(({ element: el, event, handler }) => {
        if (el === element) {
          el.removeEventListener(event, handler);
        }
      });
      this.onceListeners.delete(key);
    });

    return this;
  }

  // Trigger event
  trigger(element, event, detail = {}, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) {
      throw new Error('Element not found');
    }

    const customEvent = new CustomEvent(event, {
      detail,
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed || false
    });

    element.dispatchEvent(customEvent);
    return this;
  }

  // Event delegation
  delegate(parent, selector, event, handler) {
    if (typeof parent === 'string') {
      parent = document.querySelector(parent);
    }

    if (!parent) {
      throw new Error('Parent element not found');
    }

    const delegateHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    };

    parent.addEventListener(event, delegateHandler);

    // Store delegation
    const key = `${parent.constructor.name}-${event}-${selector}`;
    if (!this.delegates.has(key)) {
      this.delegates.set(key, []);
    }
    this.delegates.get(key).push({ parent, selector, event, handler: delegateHandler, originalHandler: handler });

    return this;
  }

  // Remove delegation
  undelegate(parent, selector, event, handler) {
    if (typeof parent === 'string') {
      parent = document.querySelector(parent);
    }

    if (!parent) {
      return this;
    }

    const key = `${parent.constructor.name}-${event}-${selector}`;
    const delegates = this.delegates.get(key) || [];
    const index = delegates.findIndex(item => item.originalHandler === handler);

    if (index > -1) {
      const { handler: delegateHandler } = delegates[index];
      parent.removeEventListener(event, delegateHandler);
      delegates.splice(index, 1);
    }

    return this;
  }

  // Wait for event
  waitFor(element, event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      if (!element) {
        reject(new Error('Element not found'));
        return;
      }

      let timeoutId;

      const handler = (e) => {
        clearTimeout(timeoutId);
        element.removeEventListener(event, handler);
        resolve(e);
      };

      timeoutId = setTimeout(() => {
        element.removeEventListener(event, handler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      element.addEventListener(event, handler);
    });
  }

  // Throttle event handler
  throttle(handler, delay = 100) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return handler.apply(this, args);
      }
    };
  }

  // Debounce event handler
  debounce(handler, delay = 100) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handler.apply(this, args);
      }, delay);
    };
  }

  // Create keyboard event
  createKeyboardEvent(type, options = {}) {
    return new KeyboardEvent(type, {
      key: options.key || '',
      code: options.code || '',
      location: options.location || 0,
      repeat: options.repeat || false,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed || false
    });
  }

  // Create mouse event
  createMouseEvent(type, options = {}) {
    return new MouseEvent(type, {
      clientX: options.clientX || 0,
      clientY: options.clientY || 0,
      screenX: options.screenX || 0,
      screenY: options.screenY || 0,
      button: options.button || 0,
      buttons: options.buttons || 0,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed || false
    });
  }

  // Get event path
  getEventPath(event) {
    return event.composedPath();
  }

  // Check if event is trusted
  isTrusted(event) {
    return event.isTrusted;
  }

  // Prevent default
  preventDefault(event) {
    event.preventDefault();
    return this;
  }

  // Stop propagation
  stopPropagation(event) {
    event.stopPropagation();
    return this;
  }

  // Stop immediate propagation
  stopImmediatePropagation(event) {
    event.stopImmediatePropagation();
    return this;
  }

  // Check modifier keys
  getModifierKeys(event) {
    return {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  // Get mouse position
  getMousePosition(event) {
    return {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY
    };
  }

  // Get key information
  getKeyInfo(event) {
    return {
      key: event.key,
      code: event.code,
      location: event.location,
      repeat: event.repeat
    };
  }

  // Clean up all listeners
  cleanup() {
    // Remove all regular listeners
    this.listeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();

    // Remove all once listeners
    this.onceListeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.onceListeners.clear();

    // Remove all delegates
    this.delegates.forEach((delegates) => {
      delegates.forEach(({ parent, event, handler }) => {
        parent.removeEventListener(event, handler);
      });
    });
    this.delegates.clear();

    return this;
  }

  // Get listener statistics
  getStats() {
    return {
      regularListeners: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      onceListeners: Array.from(this.onceListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      delegates: Array.from(this.delegates.values()).reduce((sum, delegates) => sum + delegates.length, 0)
    };
  }
}

// Event Bus for global events
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  // Subscribe to event
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
    return this;
  }

  // Subscribe once
  once(event, handler) {
    const onceHandler = (data) => {
      handler(data);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }

  // Unsubscribe
  off(event, handler) {
    if (!this.events.has(event)) {
      return this;
    }

    const handlers = this.events.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  // Emit event
  emit(event, data) {
    if (!this.events.has(event)) {
      return this;
    }

    const handlers = this.events.get(event);
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('EventBus handler error:', error);
      }
    });

    return this;
  }

  // Clear all events
  clear() {
    this.events.clear();
    return this;
  }

  // Get event count
  getEventCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  // Get all events
  getAllEvents() {
    return Array.from(this.events.keys());
  }
}

// Export instances
export const eventUtils = new EventUtils();
export const eventBus = new EventBus();

// Test Suite
describe('EventUtils', () => {
  let eventUtils;
  let mockElement;

  beforeEach(() => {
    eventUtils = new EventUtils();
    mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      constructor: { name: 'HTMLDivElement' },
      closest: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('Basic Event Handling', () => {
    test('should add event listener', () => {
      const handler = jest.fn();
      
      eventUtils.on(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), {});
    });

    test('should add event listener with options', () => {
      const handler = jest.fn();
      const options = { passive: true };
      
      eventUtils.on(mockElement, 'click', handler, options);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), options);
    });

    test('should add event listener by selector', () => {
      const handler = jest.fn();
      document.querySelector.mockReturnValue(mockElement);
      
      eventUtils.on('#test', 'click', handler);
      
      expect(document.querySelector).toHaveBeenCalledWith('#test');
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), {});
    });

    test('should throw error when element not found', () => {
      document.querySelector.mockReturnValue(null);
      const handler = jest.fn();
      
      expect(() => eventUtils.on('#nonexistent', 'click', handler))
        .toThrow('Element not found');
    });

    test('should add once event listener', () => {
      const handler = jest.fn();
      
      eventUtils.once(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), {});
    });

    test('should remove event listener', () => {
      const handler = jest.fn();
      
      eventUtils.on(mockElement, 'click', handler);
      eventUtils.off(mockElement, 'click', handler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should remove event listener by selector', () => {
      const handler = jest.fn();
      document.querySelector.mockReturnValue(mockElement);
      
      eventUtils.on('#test', 'click', handler);
      eventUtils.off('#test', 'click', handler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should handle removal of non-existent listener gracefully', () => {
      const handler = jest.fn();
      
      // F2P: Should handle non-existent listener gracefully
      expect(() => eventUtils.off(mockElement, 'click', handler)).not.toThrow();
    });

    test('should remove all event listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventUtils.on(mockElement, 'click', handler1);
      eventUtils.on(mockElement, 'mouseover', handler2);
      eventUtils.offAll(mockElement);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(2);
    });

    test('should trigger event', () => {
      eventUtils.trigger(mockElement, 'custom-event', { data: 'test' });
      
      expect(window.CustomEvent).toHaveBeenCalledWith('custom-event', {
        detail: { data: 'test' },
        bubbles: true,
        cancelable: true,
        composed: false
      });
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    test('should trigger event with options', () => {
      const options = { bubbles: false, cancelable: false, composed: true };
      
      eventUtils.trigger(mockElement, 'custom-event', {}, options);
      
      expect(window.CustomEvent).toHaveBeenCalledWith('custom-event', {
        detail: {},
        bubbles: false,
        cancelable: false,
        composed: true
      });
    });

    test('should throw error when triggering on non-existent element', () => {
      document.querySelector.mockReturnValue(null);
      
      expect(() => eventUtils.trigger('#nonexistent', 'click'))
        .toThrow('Element not found');
    });
  });

  describe('Event Delegation', () => {
    let mockParent, mockTarget;

    beforeEach(() => {
      mockTarget = {
        closest: jest.fn(() => mockTarget),
        classList: { contains: jest.fn(() => true) }
      };
      mockParent = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        contains: jest.fn(() => true),
        constructor: { name: 'HTMLDivElement' }
      };
    });

    test('should set up event delegation', () => {
      const handler = jest.fn();
      
      eventUtils.delegate(mockParent, '.child', 'click', handler);
      
      expect(mockParent.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should set up delegation by selector', () => {
      const handler = jest.fn();
      document.querySelector.mockReturnValue(mockParent);
      
      eventUtils.delegate('#parent', '.child', 'click', handler);
      
      expect(document.querySelector).toHaveBeenCalledWith('#parent');
      expect(mockParent.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should remove delegation', () => {
      const handler = jest.fn();
      
      eventUtils.delegate(mockParent, '.child', 'click', handler);
      eventUtils.undelegate(mockParent, '.child', 'click', handler);
      
      expect(mockParent.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should handle delegation removal gracefully', () => {
      const handler = jest.fn();
      
      // F2P: Should handle non-existent delegation gracefully
      expect(() => eventUtils.undelegate(mockParent, '.child', 'click', handler)).not.toThrow();
    });
  });

  describe('Event Waiting', () => {
    test('should wait for event', async () => {
      const handler = jest.fn();
      mockElement.addEventListener.mockImplementation((event, cb) => {
        setTimeout(() => {
          cb({ type: 'click' });
        }, 10);
      });

      const result = await eventUtils.waitFor(mockElement, 'click');
      
      expect(result).toEqual({ type: 'click' });
    });

    test('should timeout waiting for event', async () => {
      mockElement.addEventListener.mockImplementation(() => {});

      await expect(eventUtils.waitFor(mockElement, 'click', 50))
        .rejects.toThrow('Timeout waiting for event: click');
    });

    test('should handle waiting on non-existent element', async () => {
      document.querySelector.mockReturnValue(null);

      await expect(eventUtils.waitFor('#nonexistent', 'click'))
        .rejects.toThrow('Element not found');
    });
  });

  describe('Handler Utilities', () => {
    test('should throttle handler', () => {
      const handler = jest.fn();
      const throttled = eventUtils.throttle(handler, 100);
      
      throttled();
      throttled();
      throttled();
      
      // Should only call once due to throttling
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should debounce handler', (done) => {
      const handler = jest.fn();
      const debounced = eventUtils.debounce(handler, 50);
      
      debounced();
      debounced();
      debounced();
      
      setTimeout(() => {
        expect(handler).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });
  });

  describe('Event Creation', () => {
    test('should create keyboard event', () => {
      const event = eventUtils.createKeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true
      });
      
      expect(window.KeyboardEvent).toHaveBeenCalledWith('keydown', {
        key: 'Enter',
        code: '',
        location: 0,
        repeat: false,
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true,
        composed: false
      });
    });

    test('should create mouse event', () => {
      const event = eventUtils.createMouseEvent('click', {
        clientX: 100,
        clientY: 200,
        button: 1
      });
      
      expect(window.MouseEvent).toHaveBeenCalledWith('click', {
        clientX: 100,
        clientY: 200,
        screenX: 0,
        screenY: 0,
        button: 1,
        buttons: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true,
        composed: false
      });
    });
  });

  describe('Event Utilities', () => {
    let mockEvent;

    beforeEach(() => {
      mockEvent = {
        composedPath: jest.fn(() => [mockElement, document.body]),
        isTrusted: true,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        clientX: 100,
        clientY: 200,
        screenX: 300,
        screenY: 400,
        key: 'Enter',
        code: 'Enter',
        location: 0,
        repeat: false
      };
    });

    test('should get event path', () => {
      const path = eventUtils.getEventPath(mockEvent);
      
      expect(mockEvent.composedPath).toHaveBeenCalled();
      expect(path).toEqual([mockElement, document.body]);
    });

    test('should check if event is trusted', () => {
      const isTrusted = eventUtils.isTrusted(mockEvent);
      
      expect(isTrusted).toBe(true);
    });

    test('should prevent default', () => {
      const result = eventUtils.preventDefault(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toBe(eventUtils);
    });

    test('should stop propagation', () => {
      const result = eventUtils.stopPropagation(mockEvent);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result).toBe(eventUtils);
    });

    test('should stop immediate propagation', () => {
      const result = eventUtils.stopImmediatePropagation(mockEvent);
      
      expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(result).toBe(eventUtils);
    });

    test('should get modifier keys', () => {
      const keys = eventUtils.getModifierKeys(mockEvent);
      
      expect(keys).toEqual({
        ctrl: true,
        shift: false,
        alt: false,
        meta: false
      });
    });

    test('should get mouse position', () => {
      const position = eventUtils.getMousePosition(mockEvent);
      
      expect(position).toEqual({
        x: 100,
        y: 200,
        screenX: 300,
        screenY: 400
      });
    });

    test('should get key information', () => {
      const info = eventUtils.getKeyInfo(mockEvent);
      
      expect(info).toEqual({
        key: 'Enter',
        code: 'Enter',
        location: 0,
        repeat: false
      });
    });
  });

  describe('Cleanup and Statistics', () => {
    test('should cleanup all listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventUtils.on(mockElement, 'click', handler1);
      eventUtils.once(mockElement, 'mouseover', handler2);
      eventUtils.delegate(mockElement, '.child', 'click', handler1);
      
      eventUtils.cleanup();
      
      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(3);
    });

    test('should get listener statistics', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventUtils.on(mockElement, 'click', handler1);
      eventUtils.once(mockElement, 'mouseover', handler2);
      eventUtils.delegate(mockElement, '.child', 'click', handler1);
      
      const stats = eventUtils.getStats();
      
      expect(stats).toEqual({
        regularListeners: 1,
        onceListeners: 1,
        delegates: 1
      });
    });
  });

  describe('F2P Tests', () => {
    test('should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      
      eventUtils.on(mockElement, 'click', errorHandler);
      
      // Get the wrapped handler
      const wrappedHandler = mockElement.addEventListener.mock.calls[0][1];
      
      // F2P: Should handle errors without throwing
      expect(() => wrappedHandler({})).not.toThrow();
    });

    test('should handle once handler errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      
      eventUtils.once(mockElement, 'click', errorHandler);
      
      // Get the wrapped handler
      const wrappedHandler = mockElement.addEventListener.mock.calls[0][1];
      
      // F2P: Should handle errors without throwing
      expect(() => wrappedHandler({})).not.toThrow();
    });

    test('should handle delegation errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      const mockParent = {
        addEventListener: jest.fn(),
        constructor: { name: 'HTMLDivElement' }
      };
      
      eventUtils.delegate(mockParent, '.child', 'click', errorHandler);
      
      // Get the wrapped handler
      const wrappedHandler = mockParent.addEventListener.mock.calls[0][1];
      
      // Create mock event
      const mockEvent = {
        target: { closest: jest.fn(() => mockParent) }
      };
      
      // F2P: Should handle errors without throwing
      expect(() => wrappedHandler(mockEvent)).not.toThrow();
    });

    test('should handle missing element in operations gracefully', () => {
      const handler = jest.fn();
      
      // F2P: Should handle missing element gracefully
      expect(() => eventUtils.off(null, 'click', handler)).not.toThrow();
      expect(() => eventUtils.offAll(null)).not.toThrow();
      expect(() => eventUtils.trigger(null, 'click')).not.toThrow();
    });

    test('should handle invalid event types gracefully', () => {
      const handler = jest.fn();
      
      // F2P: Should handle invalid event types gracefully
      expect(() => eventUtils.on(mockElement, '', handler)).not.toThrow();
      expect(() => eventUtils.trigger(mockElement, '')).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete event workflow', () => {
      const handler = jest.fn();
      const delegateHandler = jest.fn();
      
      // Setup regular listener
      eventUtils.on(mockElement, 'click', handler);
      
      // Setup delegation
      eventUtils.delegate(mockElement, '.child', 'click', delegateHandler);
      
      // Trigger event
      eventUtils.trigger(mockElement, 'custom-event', { data: 'test' });
      
      // Verify setup
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(2);
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
      
      // Cleanup
      eventUtils.off(mockElement, 'click', handler);
      eventUtils.undelegate(mockElement, '.child', 'click', delegateHandler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(2);
    });

    test('should handle complex event scenarios', async () => {
      const handler = jest.fn();
      
      // Setup throttled handler
      const throttled = eventUtils.throttle(handler, 50);
      
      // Setup debounced handler
      const debounced = eventUtils.debounce(handler, 50);
      
      // Test throttling
      throttled();
      throttled();
      throttled();
      
      // Test debouncing
      debounced();
      debounced();
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(handler).toHaveBeenCalledTimes(2); // Once for throttle, once for debounce
    });
  });
});

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('Basic Operations', () => {
    test('should subscribe to event', () => {
      const handler = jest.fn();
      
      eventBus.on('test-event', handler);
      
      expect(eventBus.getEventCount('test-event')).toBe(1);
    });

    test('should subscribe once', () => {
      const handler = jest.fn();
      
      eventBus.once('test-event', handler);
      eventBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(eventBus.getEventCount('test-event')).toBe(0);
    });

    test('should unsubscribe', () => {
      const handler = jest.fn();
      
      eventBus.on('test-event', handler);
      eventBus.off('test-event', handler);
      
      expect(eventBus.getEventCount('test-event')).toBe(0);
    });

    test('should emit event', () => {
      const handler = jest.fn();
      
      eventBus.on('test-event', handler);
      eventBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should handle multiple handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.emit('test-event', { data: 'test' });
      
      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should clear all events', () => {
      const handler = jest.fn();
      
      eventBus.on('event1', handler);
      eventBus.on('event2', handler);
      eventBus.clear();
      
      expect(eventBus.getAllEvents()).toHaveLength(0);
    });

    test('should get all events', () => {
      const handler = jest.fn();
      
      eventBus.on('event1', handler);
      eventBus.on('event2', handler);
      
      const events = eventBus.getAllEvents();
      
      expect(events).toEqual(['event1', 'event2']);
    });
  });

  describe('F2P Tests', () => {
    test('should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      const normalHandler = jest.fn();
      
      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', normalHandler);
      
      // F2P: Should handle errors without affecting other handlers
      expect(() => eventBus.emit('test-event', {})).not.toThrow();
      expect(normalHandler).toHaveBeenCalled();
    });

    test('should handle unsubscribing non-existent handler gracefully', () => {
      const handler = jest.fn();
      
      // F2P: Should handle non-existent handler gracefully
      expect(() => eventBus.off('non-existent-event', handler)).not.toThrow();
      expect(() => eventBus.off('test-event', handler)).not.toThrow();
    });

    test('should handle emitting to non-existent event gracefully', () => {
      // F2P: Should handle non-existent event gracefully
      expect(() => eventBus.emit('non-existent-event', {})).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex event bus workflow', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const onceHandler = jest.fn();
      
      // Setup multiple subscriptions
      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);
      eventBus.once('event1', onceHandler);
      
      // Emit events
      eventBus.emit('event1', { data: 'test1' });
      eventBus.emit('event2', { data: 'test2' });
      eventBus.emit('event1', { data: 'test3' });
      
      // Verify calls
      expect(handler1).toHaveBeenCalledTimes(2);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(onceHandler).toHaveBeenCalledTimes(1);
      
      // Cleanup
      eventBus.clear();
      expect(eventBus.getAllEvents()).toHaveLength(0);
    });
  });
});
