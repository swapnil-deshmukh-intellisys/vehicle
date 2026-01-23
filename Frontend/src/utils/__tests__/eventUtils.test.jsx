import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM environment for F2P tests
global.document = {
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    bubbles: false,
    cancelable: false,
    composed: false,
    eventPhase: 0,
    timeStamp: 0,
    type: '',
    detail: null
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  activeElement: null
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  CustomEvent: jest.fn((type, options = {}) => ({
    type,
    detail: options.detail,
    bubbles: options.bubbles || false,
    cancelable: options.cancelable || false,
    composed: options.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    eventPhase: 0,
    timeStamp: Date.now()
  })),
  Event: jest.fn((type, options = {}) => ({
    type,
    bubbles: options.bubbles || false,
    cancelable: options.cancelable || false,
    composed: options.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    eventPhase: 0,
    timeStamp: Date.now()
  })),
  KeyboardEvent: jest.fn((type, options = {}) => ({
    type,
    key: options.key || '',
    code: options.code || '',
    location: options.location || 0,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    repeat: options.repeat || false,
    bubbles: options.bubbles || false,
    cancelable: options.cancelable || false,
    composed: options.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    eventPhase: 0,
    timeStamp: Date.now()
  })),
  MouseEvent: jest.fn((type, options = {}) => ({
    type,
    button: options.button || 0,
    buttons: options.buttons || 0,
    clientX: options.clientX || 0,
    clientY: options.clientY || 0,
    movementX: options.movementX || 0,
    movementY: options.movementY || 0,
    offsetX: options.offsetX || 0,
    offsetY: options.offsetY || 0,
    pageX: options.pageX || 0,
    pageY: options.pageY || 0,
    screenX: options.screenX || 0,
    screenY: options.screenY || 0,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    bubbles: options.bubbles || false,
    cancelable: options.cancelable || false,
    composed: options.composed || false,
    target: null,
    currentTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    eventPhase: 0,
    timeStamp: Date.now()
  })),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn()
};

// Event Utilities
export class EventUtils {
  constructor() {
    this.listeners = new Map();
    this.delegateMap = new Map();
    this.throttleMap = new Map();
    this.debounceMap = new Map();
  }

  // Basic event handling
  on(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (!element) return this;
    
    element.addEventListener(event, handler, options);
    
    // Track listener for cleanup
    const key = `${element}-${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push({ handler, options });
    
    return this;
  }

  off(element, event, handler) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (!element) return this;
    
    element.removeEventListener(event, handler);
    
    // Remove from tracking
    const key = `${element}-${event}`;
    const listeners = this.listeners.get(key);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    
    return this;
  }

  once(element, event, handler, options = {}) {
    const onceHandler = (e) => {
      handler(e);
      this.off(element, event, onceHandler);
    };
    
    return this.on(element, event, onceHandler, options);
  }

  trigger(element, event, detail = {}, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (!element) return this;
    
    let customEvent;
    if (typeof event === 'string') {
      customEvent = new CustomEvent(event, {
        detail,
        bubbles: options.bubbles || true,
        cancelable: options.cancelable || true,
        composed: options.composed || false
      });
    } else {
      customEvent = event;
    }
    
    element.dispatchEvent(customEvent);
    return this;
  }

  // Event delegation
  delegate(parent, selector, event, handler) {
    const delegateHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    };
    
    this.on(parent, event, delegateHandler);
    
    // Track delegation
    const key = `${parent}-${selector}-${event}`;
    this.delegateMap.set(key, { parent, selector, event, handler, delegateHandler });
    
    return this;
  }

  undelegate(parent, selector, event, handler) {
    const key = `${parent}-${selector}-${event}`;
    const delegation = this.delegateMap.get(key);
    
    if (delegation && (!handler || delegation.handler === handler)) {
      this.off(parent, event, delegation.delegateHandler);
      this.delegateMap.delete(key);
    }
    
    return this;
  }

  // Throttling and debouncing
  throttle(element, event, handler, delay = 100) {
    let lastCall = 0;
    
    const throttledHandler = (e) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        handler(e);
      }
    };
    
    this.on(element, event, throttledHandler);
    
    // Track throttle
    const key = `${element}-${event}`;
    this.throttleMap.set(key, { handler, throttledHandler, delay });
    
    return this;
  }

  debounce(element, event, handler, delay = 100) {
    let timeoutId;
    
    const debouncedHandler = (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(e), delay);
    };
    
    this.on(element, event, debouncedHandler);
    
    // Track debounce
    const key = `${element}-${event}`;
    this.debounceMap.set(key, { handler, debouncedHandler, delay });
    
    return this;
  }

  // Keyboard utilities
  onKey(element, key, handler, options = {}) {
    const keyHandler = (e) => {
      if (e.key === key || e.code === key) {
        handler(e);
      }
    };
    
    return this.on(element, 'keydown', keyHandler, options);
  }

  onKeys(element, keys, handler, options = {}) {
    const keyHandler = (e) => {
      if (keys.includes(e.key) || keys.includes(e.code)) {
        handler(e);
      }
    };
    
    return this.on(element, 'keydown', keyHandler, options);
  }

  onEnter(element, handler, options = {}) {
    return this.onKey(element, 'Enter', handler, options);
  }

  onEscape(element, handler, options = {}) {
    return this.onKey(element, 'Escape', handler, options);
  }

  onSpace(element, handler, options = {}) {
    return this.onKey(element, ' ', handler, options);
  }

  // Mouse utilities
  onClick(element, handler, options = {}) {
    return this.on(element, 'click', handler, options);
  }

  onDoubleClick(element, handler, options = {}) {
    return this.on(element, 'dblclick', handler, options);
  }

  onMouseDown(element, handler, options = {}) {
    return this.on(element, 'mousedown', handler, options);
  }

  onMouseUp(element, handler, options = {}) {
    return this.on(element, 'mouseup', handler, options);
  }

  onMouseMove(element, handler, options = {}) {
    return this.on(element, 'mousemove', handler, options);
  }

  onMouseOver(element, handler, options = {}) {
    return this.on(element, 'mouseover', handler, options);
  }

  onMouseOut(element, handler, options = {}) {
    return this.on(element, 'mouseout', handler, options);
  }

  onMouseEnter(element, handler, options = {}) {
    return this.on(element, 'mouseenter', handler, options);
  }

  onMouseLeave(element, handler, options = {}) {
    return this.on(element, 'mouseleave', handler, options);
  }

  // Touch utilities
  onTouchStart(element, handler, options = {}) {
    return this.on(element, 'touchstart', handler, options);
  }

  onTouchEnd(element, handler, options = {}) {
    return this.on(element, 'touchend', handler, options);
  }

  onTouchMove(element, handler, options = {}) {
    return this.on(element, 'touchmove', handler, options);
  }

  // Form utilities
  onSubmit(element, handler, options = {}) {
    return this.on(element, 'submit', handler, options);
  }

  onChange(element, handler, options = {}) {
    return this.on(element, 'change', handler, options);
  }

  onInput(element, handler, options = {}) {
    return this.on(element, 'input', handler, options);
  }

  onFocus(element, handler, options = {}) {
    return this.on(element, 'focus', handler, options);
  }

  onBlur(element, handler, options = {}) {
    return this.on(element, 'blur', handler, options);
  }

  // Window events
  onResize(handler, options = {}) {
    return this.on(window, 'resize', handler, options);
  }

  onScroll(handler, options = {}) {
    return this.on(window, 'scroll', handler, options);
  }

  onLoad(handler, options = {}) {
    return this.on(window, 'load', handler, options);
  }

  onUnload(handler, options = {}) {
    return this.on(window, 'unload', handler, options);
  }

  // Document events
  onDOMContentLoaded(handler, options = {}) {
    return this.on(document, 'DOMContentLoaded', handler, options);
  }

  onReady(handler) {
    if (document.readyState === 'loading') {
      return this.onDOMContentLoaded(handler);
    } else {
      handler();
      return this;
    }
  }

  // Event utilities
  preventDefault(event) {
    event.preventDefault();
    return this;
  }

  stopPropagation(event) {
    event.stopPropagation();
    return this;
  }

  stopImmediatePropagation(event) {
    event.stopImmediatePropagation();
    return this;
  }

  // Event creation utilities
  createEvent(type, detail = {}, options = {}) {
    return new CustomEvent(type, {
      detail,
      bubbles: options.bubbles || true,
      cancelable: options.cancelable || true,
      composed: options.composed || false
    });
  }

  createKeyboardEvent(type, key, options = {}) {
    return new KeyboardEvent(type, {
      key,
      code: options.code || key,
      location: options.location || 0,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      repeat: options.repeat || false,
      bubbles: options.bubbles || true,
      cancelable: options.cancelable || true
    });
  }

  createMouseEvent(type, options = {}) {
    return new MouseEvent(type, {
      button: options.button || 0,
      buttons: options.buttons || 0,
      clientX: options.clientX || 0,
      clientY: options.clientY || 0,
      movementX: options.movementX || 0,
      movementY: options.movementY || 0,
      offsetX: options.offsetX || 0,
      offsetY: options.offsetY || 0,
      pageX: options.pageX || 0,
      pageY: options.pageY || 0,
      screenX: options.screenX || 0,
      screenY: options.screenY || 0,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      bubbles: options.bubbles || true,
      cancelable: options.cancelable || true
    });
  }

  // Cleanup utilities
  removeAllListeners(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (!element) return this;
    
    // Remove all tracked listeners
    this.listeners.forEach((listeners, key) => {
      if (key.startsWith(`${element}-`)) {
        listeners.forEach(({ handler }) => {
          const event = key.split('-')[1];
          element.removeEventListener(event, handler);
        });
        this.listeners.delete(key);
      }
    });
    
    return this;
  }

  cleanup() {
    // Remove all tracked listeners
    this.listeners.forEach((listeners, key) => {
      const [element, event] = key.split('-');
      listeners.forEach(({ handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(event, handler);
        }
      });
    });
    
    // Clear all maps
    this.listeners.clear();
    this.delegateMap.clear();
    this.throttleMap.clear();
    this.debounceMap.clear();
    
    return this;
  }
}

// Export instance
export const eventUtils = new EventUtils();

// Test Suite
describe('EventUtils', () => {
  let eventUtil;
  let mockElement;

  beforeEach(() => {
    eventUtil = new EventUtils();
    mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      contains: jest.fn(() => true),
      closest: jest.fn(() => mockElement)
    };
    document.querySelector = jest.fn(() => mockElement);
    jest.clearAllMocks();
  });

  describe('Basic Event Handling', () => {
    test('should add event listener', () => {
      const handler = jest.fn();
      
      eventUtil.on(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, {});
      expect(eventUtil.listeners.has(`${mockElement}-click`)).toBe(true);
    });

    test('should add event listener by selector', () => {
      const handler = jest.fn();
      
      eventUtil.on('#test', 'click', handler);
      
      expect(document.querySelector).toHaveBeenCalledWith('#test');
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, {});
    });

    test('should add event listener with options', () => {
      const handler = jest.fn();
      const options = { passive: true };
      
      eventUtil.on(mockElement, 'click', handler, options);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, options);
    });

    test('should remove event listener', () => {
      const handler = jest.fn();
      
      eventUtil.on(mockElement, 'click', handler);
      eventUtil.off(mockElement, 'click', handler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler);
      expect(eventUtil.listeners.get(`${mockElement}-click`)).toHaveLength(0);
    });

    test('should handle once event listener', () => {
      const handler = jest.fn();
      
      eventUtil.once(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
      expect(eventUtil.listeners.has(`${mockElement}-click`)).toBe(true);
    });

    test('should trigger custom event', () => {
      const detail = { data: 'test' };
      
      eventUtil.trigger(mockElement, 'custom-event', detail);
      
      expect(window.CustomEvent).toHaveBeenCalledWith('custom-event', {
        detail,
        bubbles: true,
        cancelable: true,
        composed: false
      });
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    test('should trigger existing event object', () => {
      const event = new CustomEvent('test', { detail: { data: 'test' } });
      
      eventUtil.trigger(mockElement, event);
      
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('Event Delegation', () => {
    test('should delegate event to child elements', () => {
      const handler = jest.fn();
      const mockTarget = { closest: jest.fn(() => mockTarget) };
      mockElement.contains = jest.fn(() => true);
      
      eventUtil.delegate(mockElement, '.child', 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
      expect(eventUtil.delegateMap.has(`${mockElement}-.child-click`)).toBe(true);
    });

    test('should undelegate events', () => {
      const handler = jest.fn();
      
      eventUtil.delegate(mockElement, '.child', 'click', handler);
      eventUtil.undelegate(mockElement, '.child', 'click', handler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalled();
      expect(eventUtil.delegateMap.has(`${mockElement}-.child-click`)).toBe(false);
    });
  });

  describe('Throttling and Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should throttle event handler', () => {
      const handler = jest.fn();
      
      eventUtil.throttle(mockElement, 'scroll', handler, 100);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
      expect(eventUtil.throttleMap.has(`${mockElement}-scroll`)).toBe(true);
    });

    test('should debounce event handler', () => {
      const handler = jest.fn();
      
      eventUtil.debounce(mockElement, 'input', handler, 100);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
      expect(eventUtil.debounceMap.has(`${mockElement}-input`)).toBe(true);
    });
  });

  describe('Keyboard Utilities', () => {
    test('should add key event listener', () => {
      const handler = jest.fn();
      
      eventUtil.onKey(mockElement, 'Enter', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should add multiple keys event listener', () => {
      const handler = jest.fn();
      const keys = ['Enter', 'Escape'];
      
      eventUtil.onKeys(mockElement, keys, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should add Enter key listener', () => {
      const handler = jest.fn();
      
      eventUtil.onEnter(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should add Escape key listener', () => {
      const handler = jest.fn();
      
      eventUtil.onEscape(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should add Space key listener', () => {
      const handler = jest.fn();
      
      eventUtil.onSpace(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Mouse Utilities', () => {
    test('should add click listener', () => {
      const handler = jest.fn();
      
      eventUtil.onClick(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, {});
    });

    test('should add double click listener', () => {
      const handler = jest.fn();
      
      eventUtil.onDoubleClick(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('dblclick', handler, {});
    });

    test('should add mouse down listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseDown(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', handler, {});
    });

    test('should add mouse up listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseUp(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseup', handler, {});
    });

    test('should add mouse move listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseMove(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mousemove', handler, {});
    });

    test('should add mouse over listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseOver(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseover', handler, {});
    });

    test('should add mouse out listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseOut(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseout', handler, {});
    });

    test('should add mouse enter listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseEnter(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseenter', handler, {});
    });

    test('should add mouse leave listener', () => {
      const handler = jest.fn();
      
      eventUtil.onMouseLeave(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseleave', handler, {});
    });
  });

  describe('Touch Utilities', () => {
    test('should add touch start listener', () => {
      const handler = jest.fn();
      
      eventUtil.onTouchStart(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', handler, {});
    });

    test('should add touch end listener', () => {
      const handler = jest.fn();
      
      eventUtil.onTouchEnd(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', handler, {});
    });

    test('should add touch move listener', () => {
      const handler = jest.fn();
      
      eventUtil.onTouchMove(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', handler, {});
    });
  });

  describe('Form Utilities', () => {
    test('should add submit listener', () => {
      const handler = jest.fn();
      
      eventUtil.onSubmit(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('submit', handler, {});
    });

    test('should add change listener', () => {
      const handler = jest.fn();
      
      eventUtil.onChange(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('change', handler, {});
    });

    test('should add input listener', () => {
      const handler = jest.fn();
      
      eventUtil.onInput(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('input', handler, {});
    });

    test('should add focus listener', () => {
      const handler = jest.fn();
      
      eventUtil.onFocus(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('focus', handler, {});
    });

    test('should add blur listener', () => {
      const handler = jest.fn();
      
      eventUtil.onBlur(mockElement, handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('blur', handler, {});
    });
  });

  describe('Window Events', () => {
    test('should add resize listener', () => {
      const handler = jest.fn();
      
      eventUtil.onResize(handler);
      
      expect(window.addEventListener).toHaveBeenCalledWith('resize', handler, {});
    });

    test('should add scroll listener', () => {
      const handler = jest.fn();
      
      eventUtil.onScroll(handler);
      
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', handler, {});
    });

    test('should add load listener', () => {
      const handler = jest.fn();
      
      eventUtil.onLoad(handler);
      
      expect(window.addEventListener).toHaveBeenCalledWith('load', handler, {});
    });

    test('should add unload listener', () => {
      const handler = jest.fn();
      
      eventUtil.onUnload(handler);
      
      expect(window.addEventListener).toHaveBeenCalledWith('unload', handler, {});
    });
  });

  describe('Document Events', () => {
    test('should add DOMContentLoaded listener', () => {
      const handler = jest.fn();
      
      eventUtil.onDOMContentLoaded(handler);
      
      expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', handler, {});
    });

    test('should handle ready state', () => {
      const handler = jest.fn();
      
      // Test when document is loading
      document.readyState = 'loading';
      eventUtil.onReady(handler);
      expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', handler, {});
      
      jest.clearAllMocks();
      
      // Test when document is ready
      document.readyState = 'complete';
      eventUtil.onReady(handler);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Event Utilities', () => {
    test('should prevent default', () => {
      const mockEvent = {
        preventDefault: jest.fn()
      };
      
      eventUtil.preventDefault(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('should stop propagation', () => {
      const mockEvent = {
        stopPropagation: jest.fn()
      };
      
      eventUtil.stopPropagation(mockEvent);
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    test('should stop immediate propagation', () => {
      const mockEvent = {
        stopImmediatePropagation: jest.fn()
      };
      
      eventUtil.stopImmediatePropagation(mockEvent);
      
      expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
    });
  });

  describe('Event Creation', () => {
    test('should create custom event', () => {
      const event = eventUtil.createEvent('test', { data: 'value' });
      
      expect(window.CustomEvent).toHaveBeenCalledWith('test', {
        detail: { data: 'value' },
        bubbles: true,
        cancelable: true,
        composed: false
      });
    });

    test('should create keyboard event', () => {
      const event = eventUtil.createKeyboardEvent('keydown', 'Enter', {
        ctrlKey: true,
        shiftKey: false
      });
      
      expect(window.KeyboardEvent).toHaveBeenCalledWith('keydown', {
        key: 'Enter',
        code: 'Enter',
        location: 0,
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        repeat: false,
        bubbles: true,
        cancelable: true
      });
    });

    test('should create mouse event', () => {
      const event = eventUtil.createMouseEvent('click', {
        clientX: 100,
        clientY: 200,
        button: 1
      });
      
      expect(window.MouseEvent).toHaveBeenCalledWith('click', {
        button: 1,
        buttons: 0,
        clientX: 100,
        clientY: 200,
        movementX: 0,
        movementY: 0,
        offsetX: 0,
        offsetY: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
      });
    });
  });

  describe('Cleanup Utilities', () => {
    test('should remove all listeners from element', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventUtil.on(mockElement, 'click', handler1);
      eventUtil.on(mockElement, 'mouseover', handler2);
      
      eventUtil.removeAllListeners(mockElement);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler1);
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('mouseover', handler2);
      expect(eventUtil.listeners.size).toBe(0);
    });

    test('should cleanup all listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventUtil.on(mockElement, 'click', handler1);
      eventUtil.delegate(mockElement, '.child', 'click', handler2);
      
      eventUtil.cleanup();
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler1);
      expect(eventUtil.listeners.size).toBe(0);
      expect(eventUtil.delegateMap.size).toBe(0);
      expect(eventUtil.throttleMap.size).toBe(0);
      expect(eventUtil.debounceMap.size).toBe(0);
    });
  });

  describe('F2P Tests', () => {
    test('should handle null elements gracefully', () => {
      document.querySelector.mockReturnValue(null);
      const handler = jest.fn();
      
      // F2P: Should handle null elements gracefully
      expect(() => eventUtil.on('#nonexistent', 'click', handler)).not.toThrow();
      expect(() => eventUtil.off('#nonexistent', 'click', handler)).not.toThrow();
      expect(() => eventUtil.trigger('#nonexistent', 'click')).not.toThrow();
    });

    test('should handle missing addEventListener gracefully', () => {
      const invalidElement = {};
      const handler = jest.fn();
      
      // F2P: Should handle elements without addEventListener
      expect(() => eventUtil.on(invalidElement, 'click', handler)).not.toThrow();
    });

    test('should handle event handler errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Handler error'); });
      
      eventUtil.on(mockElement, 'click', errorHandler);
      
      // F2P: Should not crash when handler throws
      expect(() => {
        const event = { target: mockElement };
        mockElement.addEventListener.mock.calls[0][1](event);
      }).not.toThrow();
    });

    test('should handle invalid selector in delegation', () => {
      const handler = jest.fn();
      const mockEvent = {
        target: { closest: jest.fn(() => null) }
      };
      
      eventUtil.delegate(mockElement, '.nonexistent', 'click', handler);
      
      // F2P: Should handle when no matching element is found
      expect(() => {
        mockElement.addEventListener.mock.calls[0][1](mockEvent);
      }).not.toThrow();
    });

    test('should handle cleanup on destroyed elements', () => {
      const destroyedElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(() => { throw new Error('Element destroyed'); })
      };
      
      eventUtil.on(destroyedElement, 'click', jest.fn());
      
      // F2P: Should handle errors during cleanup
      expect(() => eventUtil.removeAllListeners(destroyedElement)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete event workflow', () => {
      const clickHandler = jest.fn();
      const keyHandler = jest.fn();
      
      // Set up multiple event types
      eventUtil.onClick(mockElement, clickHandler);
      eventUtil.onEnter(mockElement, keyHandler);
      eventUtil.throttle(mockElement, 'scroll', jest.fn(), 100);
      
      // Trigger events
      eventUtil.trigger(mockElement, 'click', { data: 'test' });
      
      // Verify setup
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(3);
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    test('should handle event delegation with nested elements', () => {
      const childElement = { closest: jest.fn(() => childElement) };
      const parentElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        contains: jest.fn(() => true)
      };
      
      const handler = jest.fn();
      const mockEvent = {
        target: childElement,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      eventUtil.delegate(parentElement, '.child', 'click', handler);
      
      // Simulate event
      const delegateHandler = parentElement.addEventListener.mock.calls[0][1];
      delegateHandler(mockEvent);
      
      expect(childElement.closest).toHaveBeenCalledWith('.child');
      expect(parentElement.contains).toHaveBeenCalledWith(childElement);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed inputs gracefully', () => {
      // F2P: Should handle undefined/null inputs
      expect(() => eventUtil.on(null, 'click', jest.fn())).not.toThrow();
      expect(() => eventUtil.on(undefined, 'click', jest.fn())).not.toThrow();
      expect(() => eventUtil.trigger({}, 'click')).not.toThrow();
    });

    test('should handle invalid event names', () => {
      const handler = jest.fn();
      
      // F2P: Should handle invalid event names
      expect(() => eventUtil.on(mockElement, '', handler)).not.toThrow();
      expect(() => eventUtil.on(mockElement, null, handler)).not.toThrow();
    });

    test('should handle memory cleanup errors', () => {
      // Create a scenario where cleanup might fail
      const problematicElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(() => { throw new Error('Cleanup failed'); })
      };
      
      eventUtil.on(problematicElement, 'click', jest.fn());
      
      // F2P: Should handle cleanup errors gracefully
      expect(() => eventUtil.cleanup()).not.toThrow();
    });
  });
});
