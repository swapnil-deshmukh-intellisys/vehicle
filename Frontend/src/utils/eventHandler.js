// Comprehensive event handling utility

// Event types
export const EVENT_TYPES = {
  MOUSE: 'mouse',
  KEYBOARD: 'keyboard',
  TOUCH: 'touch',
  SCROLL: 'scroll',
  RESIZE: 'resize',
  FOCUS: 'focus',
  CUSTOM: 'custom'
};

// Event handler manager class
export class EventHandlerManager {
  constructor() {
    this.listeners = new Map();
    this.delegatedListeners = new Map();
    this.throttledListeners = new Map();
    this.debouncedListeners = new Map();
    this.onceListeners = new Map();
    this.passiveListeners = new Map();
  }

  // Add event listener
  add(element, eventType, handler, options = {}) {
    const {
      passive = false,
      once = false,
      capture = false,
      throttle = null,
      debounce = null
    } = options;

    let finalHandler = handler;

    // Apply throttle
    if (throttle) {
      finalHandler = this.createThrottledHandler(handler, throttle);
      this.throttledListeners.set(handler, finalHandler);
    }

    // Apply debounce
    if (debounce) {
      finalHandler = this.createDebouncedHandler(handler, debounce);
      this.debouncedListeners.set(handler, finalHandler);
    }

    // Create listener info
    const listenerInfo = {
      element,
      eventType,
      handler: finalHandler,
      originalHandler: handler,
      options: { passive, once, capture }
    };

    // Store listener
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element).set(eventType, listenerInfo);

    // Add actual event listener
    element.addEventListener(eventType, finalHandler, { passive, once, capture });

    // Track once listeners
    if (once) {
      if (!this.onceListeners.has(element)) {
        this.onceListeners.set(element, new Map());
      }
      this.onceListeners.get(element).set(eventType, listenerInfo);
    }

    // Track passive listeners
    if (passive) {
      if (!this.passiveListeners.has(element)) {
        this.passiveListeners.set(element, new Map());
      }
      this.passiveListeners.get(element).set(eventType, listenerInfo);
    }

    return () => this.remove(element, eventType, handler);
  }

  // Remove event listener
  remove(element, eventType, handler) {
    const elementListeners = this.listeners.get(element);
    if (!elementListeners) return false;

    const listenerInfo = elementListeners.get(eventType);
    if (!listenerInfo) return false;

    // Remove actual event listener
    element.removeEventListener(eventType, listenerInfo.handler, listenerInfo.options);

    // Clean up tracking
    elementListeners.delete(eventType);
    if (elementListeners.size === 0) {
      this.listeners.delete(element);
    }

    // Clean up throttle/debounce tracking
    this.throttledListeners.delete(handler);
    this.debouncedListeners.delete(handler);

    // Clean up once tracking
    const onceListeners = this.onceListeners.get(element);
    if (onceListeners) {
      onceListeners.delete(eventType);
      if (onceListeners.size === 0) {
        this.onceListeners.delete(element);
      }
    }

    // Clean up passive tracking
    const passiveListeners = this.passiveListeners.get(element);
    if (passiveListeners) {
      passiveListeners.delete(eventType);
      if (passiveListeners.size === 0) {
        this.passiveListeners.delete(element);
      }
    }

    return true;
  }

  // Remove all listeners from element
  removeAll(element) {
    const elementListeners = this.listeners.get(element);
    if (!elementListeners) return false;

    elementListeners.forEach((listenerInfo, eventType) => {
      element.removeEventListener(eventType, listenerInfo.handler, listenerInfo.options);
    });

    this.listeners.delete(element);
    this.onceListeners.delete(element);
    this.passiveListeners.delete(element);

    return true;
  }

  // Event delegation
  delegate(parentElement, eventType, selector, handler, options = {}) {
    const delegatedHandler = (event) => {
      const target = event.target.closest(selector);
      if (target && parentElement.contains(target)) {
        handler.call(target, event);
      }
    };

    const listenerInfo = {
      parentElement,
      eventType,
      selector,
      handler: delegatedHandler,
      originalHandler: handler,
      options
    };

    // Store delegated listener
    if (!this.delegatedListeners.has(parentElement)) {
      this.delegatedListeners.set(parentElement, new Map());
    }
    this.delegatedListeners.get(parentElement).set(eventType, listenerInfo);

    // Add event listener
    parentElement.addEventListener(eventType, delegatedHandler, options);

    return () => this.undelegate(parentElement, eventType, selector);
  }

  // Remove delegated listener
  undelegate(parentElement, eventType, selector) {
    const delegatedListeners = this.delegatedListeners.get(parentElement);
    if (!delegatedListeners) return false;

    const listenerInfo = delegatedListeners.get(eventType);
    if (!listenerInfo || listenerInfo.selector !== selector) return false;

    parentElement.removeEventListener(eventType, listenerInfo.handler, listenerInfo.options);
    delegatedListeners.delete(eventType);

    if (delegatedListeners.size === 0) {
      this.delegatedListeners.delete(parentElement);
    }

    return true;
  }

  // Create throttled handler
  createThrottledHandler(handler, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return handler.apply(this, args);
      }
    };
  }

  // Create debounced handler
  createDebouncedHandler(handler, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler.apply(this, args), delay);
    };
  }

  // Add once listener
  once(element, eventType, handler, options = {}) {
    return this.add(element, eventType, handler, { ...options, once: true });
  }

  // Add passive listener
  passive(element, eventType, handler, options = {}) {
    return this.add(element, eventType, handler, { ...options, passive: true });
  }

  // Add throttled listener
  throttled(element, eventType, handler, delay, options = {}) {
    return this.add(element, eventType, handler, { ...options, throttle: delay });
  }

  // Add debounced listener
  debounced(element, eventType, handler, delay, options = {}) {
    return this.add(element, eventType, handler, { ...options, debounce: delay });
  }

  // Get all listeners for debugging
  getListeners() {
    const result = {
      direct: [],
      delegated: [],
      once: [],
      passive: []
    };

    // Direct listeners
    this.listeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        result.direct.push({
          element,
          eventType,
          options: listenerInfo.options
        });
      });
    });

    // Delegated listeners
    this.delegatedListeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        result.delegated.push({
          element,
          eventType,
          selector: listenerInfo.selector,
          options: listenerInfo.options
        });
      });
    });

    // Once listeners
    this.onceListeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        result.once.push({
          element,
          eventType,
          options: listenerInfo.options
        });
      });
    });

    // Passive listeners
    this.passiveListeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        result.passive.push({
          element,
          eventType,
          options: listenerInfo.options
        });
      });
    });

    return result;
  }

  // Clean up all listeners
  cleanup() {
    this.listeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        element.removeEventListener(eventType, listenerInfo.handler, listenerInfo.options);
      });
    });

    this.delegatedListeners.forEach((listeners, element) => {
      listeners.forEach((listenerInfo, eventType) => {
        element.removeEventListener(eventType, listenerInfo.handler, listenerInfo.options);
      });
    });

    this.listeners.clear();
    this.delegatedListeners.clear();
    this.throttledListeners.clear();
    this.debouncedListeners.clear();
    this.onceListeners.clear();
    this.passiveListeners.clear();
  }
}

// Create global event handler manager
export const eventHandlerManager = new EventHandlerManager();

// Utility functions
export const addEventListener = (element, eventType, handler, options) => {
  return eventHandlerManager.add(element, eventType, handler, options);
};

export const removeEventListener = (element, eventType, handler) => {
  return eventHandlerManager.remove(element, eventType, handler);
};

export const delegateEvent = (parentElement, eventType, selector, handler, options) => {
  return eventHandlerManager.delegate(parentElement, eventType, selector, handler, options);
};

export const addOnceListener = (element, eventType, handler, options) => {
  return eventHandlerManager.once(element, eventType, handler, options);
};

export const addPassiveListener = (element, eventType, handler, options) => {
  return eventHandlerManager.passive(element, eventType, handler, options);
};

export const addThrottledListener = (element, eventType, handler, delay, options) => {
  return eventHandlerManager.throttled(element, eventType, handler, delay, options);
};

export const addDebouncedListener = (element, eventType, handler, delay, options) => {
  return eventHandlerManager.debounced(element, eventType, handler, delay, options);
};

// Common event utilities
export const onClick = (element, handler, options) => {
  return addEventListener(element, 'click', handler, options);
};

export const onScroll = (element, handler, options) => {
  return addPassiveListener(element, 'scroll', handler, options);
};

export const onResize = (element, handler, options) => {
  return addPassiveListener(element, 'resize', handler, options);
};

export const onKeydown = (element, handler, options) => {
  return addEventListener(element, 'keydown', handler, options);
};

export const onKeyup = (element, handler, options) => {
  return addEventListener(element, 'keyup', handler, options);
};

export const onFocus = (element, handler, options) => {
  return addEventListener(element, 'focus', handler, options);
};

export const onBlur = (element, handler, options) => {
  return addEventListener(element, 'blur', handler, options);
};

export const onMouseEnter = (element, handler, options) => {
  return addEventListener(element, 'mouseenter', handler, options);
};

export const onMouseLeave = (element, handler, options) => {
  return addEventListener(element, 'mouseleave', handler, options);
};

// Custom event utilities
export const createCustomEvent = (eventName, detail = {}, options = {}) => {
  return new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true,
    ...options
  });
};

export const dispatchCustomEvent = (element, eventName, detail = {}, options = {}) => {
  const event = createCustomEvent(eventName, detail, options);
  return element.dispatchEvent(event);
};

// Event delegation utilities
export const delegateClick = (parentElement, selector, handler, options) => {
  return delegateEvent(parentElement, 'click', selector, handler, options);
};

export const delegateScroll = (parentElement, selector, handler, options) => {
  return delegateEvent(parentElement, 'scroll', selector, handler, options);
};

// Keyboard event utilities
export const onEnterKey = (element, handler, options) => {
  return onKeydown(element, (event) => {
    if (event.key === 'Enter') {
      handler(event);
    }
  }, options);
};

export const onEscapeKey = (element, handler, options) => {
  return onKeydown(element, (event) => {
    if (event.key === 'Escape') {
      handler(event);
    }
  }, options);
};

// Touch event utilities
export const onTouchStart = (element, handler, options) => {
  return addEventListener(element, 'touchstart', handler, options);
};

export const onTouchEnd = (element, handler, options) => {
  return addEventListener(element, 'touchend', handler, options);
};

export const onTouchMove = (element, handler, options) => {
  return addPassiveListener(element, 'touchmove', handler, options);
};

// Form event utilities
export const onSubmit = (element, handler, options) => {
  return addEventListener(element, 'submit', handler, options);
};

export const onInputChange = (element, handler, options) => {
  return addEventListener(element, 'input', handler, options);
};

export const onSelectChange = (element, handler, options) => {
  return addEventListener(element, 'change', handler, options);
};

// Performance utilities
export const addPerformanceListener = (handler, options = {}) => {
  return addEventListener(window, 'performance', handler, options);
};

export const addErrorListener = (handler, options = {}) => {
  return addEventListener(window, 'error', handler, options);
};

export const addUnhandledRejectionListener = (handler, options = {}) => {
  return addEventListener(window, 'unhandledrejection', handler, options);
};

// Cleanup utility
export const cleanupEventListeners = () => {
  eventHandlerManager.cleanup();
};
