import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM environment for F2P tests
global.document = {
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    hasAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn(),
      replace: jest.fn()
    },
    style: {
      cssText: '',
      setProperty: jest.fn(),
      getProperty: jest.fn(),
      removeProperty: jest.fn()
    },
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    disabled: false,
    readOnly: false,
    type: '',
    id: '',
    className: '',
    parentNode: null,
    children: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    offsetParent: null,
    offsetHeight: 0,
    offsetWidth: 0,
    offsetTop: 0,
    offsetLeft: 0,
    scrollHeight: 0,
    scrollWidth: 0,
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 0,
    clientWidth: 0,
    clientTop: 0,
    clientLeft: 0,
    getBoundingClientRect: jest.fn(() => ({
      top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0,
      x: 0, y: 0
    })),
    getComputedStyle: jest.fn(() => ({})),
    matches: jest.fn(() => false),
    closest: jest.fn(() => null),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    cloneNode: jest.fn(() => ({})),
    insertBefore: jest.fn(),
    insertAfter: jest.fn(),
    replaceChild: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    click: jest.fn()
  })),
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(() => []),
  getElementsByTagName: jest.fn(() => []),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    insertBefore: jest.fn(),
    contains: jest.fn(),
    scrollIntoView: jest.fn()
  },
  documentElement: {
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 0,
    clientWidth: 0
  },
  createTextNode: jest.fn((text) => ({
    nodeType: 3,
    nodeValue: text,
    textContent: text
  })),
  createDocumentFragment: jest.fn(() => ({
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    insertBefore: jest.fn(),
    children: [],
    firstChild: null,
    lastChild: null
  })),
  createComment: jest.fn(() => ({
    nodeType: 8,
    nodeValue: ''
  })),
  activeElement: null,
  readyState: 'complete',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  CustomEvent: jest.fn((type, options) => ({
    type,
    detail: options?.detail,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false
  })),
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
    setProperty: jest.fn(),
    removeProperty: jest.fn()
  })),
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn(),
  scrollTo: jest.fn(),
  scrollBy: jest.fn(),
  pageXOffset: 0,
  pageYOffset: 0,
  innerWidth: 1024,
  innerHeight: 768,
  screenX: 0,
  screenY: 0,
  outerWidth: 1024,
  outerHeight: 768,
  devicePixelRatio: 1
};

global.Element = class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.classList = {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn(),
      replace: jest.fn()
    };
    this.style = {
      cssText: '',
      setProperty: jest.fn(),
      getProperty: jest.fn(),
      removeProperty: jest.fn()
    };
  }
};

// DOM Utilities
export class DOMUtils {
  // Element creation
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
    
    return element;
  }

  // Element selection
  $(selector) {
    return document.querySelector(selector);
  }

  $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  // Element manipulation
  addClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.classList.add(className);
    return this;
  }

  removeClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.classList.remove(className);
    return this;
  }

  toggleClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.classList.toggle(className);
    return this;
  }

  hasClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.classList.contains(className);
  }

  // Attribute manipulation
  setAttr(element, name, value) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.setAttribute(name, value);
    return this;
  }

  getAttr(element, name) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.getAttribute(name);
  }

  removeAttr(element, name) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.removeAttribute(name);
    return this;
  }

  hasAttr(element, name) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.hasAttribute(name);
  }

  // Style manipulation
  setStyle(element, styles) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    Object.assign(element.style, styles);
    return this;
  }

  getStyle(element, property) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  removeStyle(element, property) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.style.removeProperty(property);
    return this;
  }

  // Content manipulation
  setText(element, text) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.textContent = text;
    return this;
  }

  getText(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.textContent;
  }

  setHTML(element, html) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.innerHTML = html;
    return this;
  }

  getHTML(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.innerHTML;
  }

  // Value manipulation
  setValue(element, value) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.value = value;
    return this;
  }

  getValue(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.value;
  }

  // DOM traversal
  parent(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.parentNode;
  }

  children(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return Array.from(element.children);
  }

  siblings(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return Array.from(element.parentNode.children).filter(child => child !== element);
  }

  next(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.nextSibling;
  }

  prev(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.previousSibling;
  }

  // DOM insertion
  append(parent, child) {
    if (typeof parent === 'string') {
      parent = this.$(parent);
    }
    if (typeof child === 'string') {
      child = document.createTextNode(child);
    }
    parent.appendChild(child);
    return this;
  }

  prepend(parent, child) {
    if (typeof parent === 'string') {
      parent = this.$(parent);
    }
    if (typeof child === 'string') {
      child = document.createTextNode(child);
    }
    parent.insertBefore(child, parent.firstChild);
    return this;
  }

  before(element, reference) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (typeof reference === 'string') {
      reference = this.$(reference);
    }
    reference.parentNode.insertBefore(element, reference);
    return this;
  }

  after(element, reference) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (typeof reference === 'string') {
      reference = this.$(reference);
    }
    reference.parentNode.insertBefore(element, reference.nextSibling);
    return this;
  }

  // DOM removal
  remove(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    return this;
  }

  empty(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    return this;
  }

  // Position and dimensions
  offset(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset,
      width: rect.width,
      height: rect.height
    };
  }

  position(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return {
      top: element.offsetTop,
      left: element.offsetLeft
    };
  }

  width(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.offsetWidth;
  }

  height(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element.offsetHeight;
  }

  // Scrolling
  scrollTo(element, top, left = 0) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.scrollTop = top;
    element.scrollLeft = left;
    return this;
  }

  scrollIntoView(element, options = {}) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.scrollIntoView(options);
    return this;
  }

  // Events
  on(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.addEventListener(event, handler, options);
    return this;
  }

  off(element, event, handler) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.removeEventListener(event, handler);
    return this;
  }

  trigger(element, event, detail = {}) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    const customEvent = new CustomEvent(event, { detail, bubbles: true, cancelable: true });
    element.dispatchEvent(customEvent);
    return this;
  }

  // Form utilities
  serialize(form) {
    if (typeof form === 'string') {
      form = this.$(form);
    }
    const formData = new FormData(form);
    const result = {};
    for (const [key, value] of formData.entries()) {
      result[key] = value;
    }
    return result;
  }

  // Animation utilities
  fadeIn(element, duration = 300) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    element.style.opacity = 0;
    element.style.display = 'block';
    
    const start = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    return this;
  }

  fadeOut(element, duration = 300) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    
    const start = performance.now();
    const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      element.style.opacity = initialOpacity * (1 - progress);
      
      if (progress >= 1) {
        element.style.display = 'none';
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    return this;
  }
}

// Export instance
export const domUtils = new DOMUtils();

// Test Suite
describe('DOMUtils', () => {
  let dom;

  beforeEach(() => {
    dom = new DOMUtils();
    jest.clearAllMocks();
  });

  describe('Element Creation', () => {
    test('should create element with tag', () => {
      const element = dom.createElement('div');
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(element.tagName).toBe('DIV');
    });

    test('should create element with attributes', () => {
      const element = dom.createElement('div', {
        id: 'test',
        className: 'test-class',
        style: { color: 'red', fontSize: '16px' },
        'data-test': 'value'
      });
      
      expect(element.id).toBe('test');
      expect(element.className).toBe('test-class');
      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
      expect(element.getAttribute('data-test')).toBe('value');
    });

    test('should create element with children', () => {
      const child1 = document.createElement('span');
      const child2 = 'text content';
      
      const element = dom.createElement('div', {}, [child1, child2]);
      
      expect(element.appendChild).toHaveBeenCalledWith(child1);
      expect(element.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({ nodeType: 3 })
      );
    });
  });

  describe('Element Selection', () => {
    test('should select single element', () => {
      const mockElement = { id: 'test' };
      document.querySelector.mockReturnValue(mockElement);
      
      const result = dom.$('#test');
      
      expect(document.querySelector).toHaveBeenCalledWith('#test');
      expect(result).toBe(mockElement);
    });

    test('should select multiple elements', () => {
      const mockElements = [{ id: 'test1' }, { id: 'test2' }];
      document.querySelectorAll.mockReturnValue(mockElements);
      
      const result = dom.$$('.test');
      
      expect(document.querySelectorAll).toHaveBeenCalledWith('.test');
      expect(result).toEqual(mockElements);
    });
  });

  describe('Class Manipulation', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn(),
          toggle: jest.fn()
        }
      };
    });

    test('should add class', () => {
      dom.addClass(mockElement, 'test-class');
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('test-class');
    });

    test('should add class by selector', () => {
      document.querySelector.mockReturnValue(mockElement);
      
      dom.addClass('#test', 'test-class');
      
      expect(document.querySelector).toHaveBeenCalledWith('#test');
      expect(mockElement.classList.add).toHaveBeenCalledWith('test-class');
    });

    test('should remove class', () => {
      dom.removeClass(mockElement, 'test-class');
      
      expect(mockElement.classList.remove).toHaveBeenCalledWith('test-class');
    });

    test('should toggle class', () => {
      dom.toggleClass(mockElement, 'test-class');
      
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('test-class');
    });

    test('should check if has class', () => {
      mockElement.classList.contains.mockReturnValue(true);
      
      const result = dom.hasClass(mockElement, 'test-class');
      
      expect(mockElement.classList.contains).toHaveBeenCalledWith('test-class');
      expect(result).toBe(true);
    });
  });

  describe('Attribute Manipulation', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        hasAttribute: jest.fn(),
        removeAttribute: jest.fn()
      };
    });

    test('should set attribute', () => {
      dom.setAttr(mockElement, 'data-test', 'value');
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-test', 'value');
    });

    test('should get attribute', () => {
      mockElement.getAttribute.mockReturnValue('value');
      
      const result = dom.getAttr(mockElement, 'data-test');
      
      expect(mockElement.getAttribute).toHaveBeenCalledWith('data-test');
      expect(result).toBe('value');
    });

    test('should remove attribute', () => {
      dom.removeAttr(mockElement, 'data-test');
      
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-test');
    });

    test('should check if has attribute', () => {
      mockElement.hasAttribute.mockReturnValue(true);
      
      const result = dom.hasAttr(mockElement, 'data-test');
      
      expect(mockElement.hasAttribute).toHaveBeenCalledWith('data-test');
      expect(result).toBe(true);
    });
  });

  describe('Style Manipulation', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        style: {
          color: '',
          fontSize: '',
          setProperty: jest.fn(),
          getPropertyValue: jest.fn(),
          removeProperty: jest.fn()
        }
      };
      window.getComputedStyle.mockReturnValue(mockElement.style);
    });

    test('should set style', () => {
      dom.setStyle(mockElement, { color: 'red', fontSize: '16px' });
      
      expect(mockElement.style.color).toBe('red');
      expect(mockElement.style.fontSize).toBe('16px');
    });

    test('should get style', () => {
      mockElement.style.getPropertyValue.mockReturnValue('red');
      
      const result = dom.getStyle(mockElement, 'color');
      
      expect(window.getComputedStyle).toHaveBeenCalledWith(mockElement);
      expect(mockElement.style.getPropertyValue).toHaveBeenCalledWith('color');
      expect(result).toBe('red');
    });

    test('should remove style', () => {
      dom.removeStyle(mockElement, 'color');
      
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith('color');
    });
  });

  describe('Content Manipulation', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        textContent: '',
        innerHTML: ''
      };
    });

    test('should set text content', () => {
      dom.setText(mockElement, 'test content');
      
      expect(mockElement.textContent).toBe('test content');
    });

    test('should get text content', () => {
      mockElement.textContent = 'test content';
      
      const result = dom.getText(mockElement);
      
      expect(result).toBe('test content');
    });

    test('should set HTML content', () => {
      dom.setHTML(mockElement, '<span>test</span>');
      
      expect(mockElement.innerHTML).toBe('<span>test</span>');
    });

    test('should get HTML content', () => {
      mockElement.innerHTML = '<span>test</span>';
      
      const result = dom.getHTML(mockElement);
      
      expect(result).toBe('<span>test</span>');
    });
  });

  describe('Value Manipulation', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        value: ''
      };
    });

    test('should set value', () => {
      dom.setValue(mockElement, 'test value');
      
      expect(mockElement.value).toBe('test value');
    });

    test('should get value', () => {
      mockElement.value = 'test value';
      
      const result = dom.getValue(mockElement);
      
      expect(result).toBe('test value');
    });
  });

  describe('DOM Traversal', () => {
    let mockElement, mockParent, mockChild, mockSibling;

    beforeEach(() => {
      mockChild = { id: 'child' };
      mockSibling = { id: 'sibling' };
      mockParent = {
        parentNode: { id: 'grandparent' },
        children: [mockChild, mockSibling],
        firstChild: mockChild,
        lastChild: mockSibling,
        nextSibling: mockSibling,
        previousSibling: mockChild
      };
      mockElement = {
        parentNode: mockParent,
        children: [mockChild, mockSibling],
        firstChild: mockChild,
        lastChild: mockSibling,
        nextSibling: mockSibling,
        previousSibling: mockChild
      };
    });

    test('should get parent', () => {
      const result = dom.parent(mockElement);
      
      expect(result).toBe(mockParent);
    });

    test('should get children', () => {
      const result = dom.children(mockElement);
      
      expect(result).toEqual([mockChild, mockSibling]);
    });

    test('should get siblings', () => {
      const result = dom.siblings(mockElement);
      
      expect(result).toEqual([mockChild, mockSibling]);
    });

    test('should get next sibling', () => {
      const result = dom.next(mockElement);
      
      expect(result).toBe(mockSibling);
    });

    test('should get previous sibling', () => {
      const result = dom.prev(mockElement);
      
      expect(result).toBe(mockChild);
    });
  });

  describe('DOM Insertion', () => {
    let mockParent, mockChild;

    beforeEach(() => {
      mockChild = { nodeType: 1 };
      mockParent = {
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        firstChild: mockChild
      };
    });

    test('should append child', () => {
      dom.append(mockParent, mockChild);
      
      expect(mockParent.appendChild).toHaveBeenCalledWith(mockChild);
    });

    test('should append text child', () => {
      dom.append(mockParent, 'text content');
      
      expect(document.createTextNode).toHaveBeenCalledWith('text content');
      expect(mockParent.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({ nodeType: 3 })
      );
    });

    test('should prepend child', () => {
      dom.prepend(mockParent, mockChild);
      
      expect(mockParent.insertBefore).toHaveBeenCalledWith(mockChild, mockParent.firstChild);
    });

    test('should insert before', () => {
      const mockReference = { parentNode: mockParent };
      
      dom.before(mockChild, mockReference);
      
      expect(mockParent.insertBefore).toHaveBeenCalledWith(mockChild, mockReference);
    });

    test('should insert after', () => {
      const mockReference = { parentNode: mockParent, nextSibling: mockChild };
      
      dom.after(mockChild, mockReference);
      
      expect(mockParent.insertBefore).toHaveBeenCalledWith(mockChild, mockReference.nextSibling);
    });
  });

  describe('DOM Removal', () => {
    let mockElement, mockParent;

    beforeEach(() => {
      mockParent = {
        removeChild: jest.fn(),
        firstChild: { nodeType: 1 }
      };
      mockElement = {
        parentNode: mockParent,
        firstChild: { nodeType: 1 },
        removeChild: jest.fn()
      };
    });

    test('should remove element', () => {
      dom.remove(mockElement);
      
      expect(mockParent.removeChild).toHaveBeenCalledWith(mockElement);
    });

    test('should not remove element without parent', () => {
      mockElement.parentNode = null;
      
      dom.remove(mockElement);
      
      expect(mockParent.removeChild).not.toHaveBeenCalled();
    });

    test('should empty element', () => {
      dom.empty(mockElement);
      
      expect(mockElement.removeChild).toHaveBeenCalledWith(mockElement.firstChild);
    });
  });

  describe('Position and Dimensions', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        getBoundingClientRect: jest.fn(() => ({
          top: 100, left: 200, width: 300, height: 400
        })),
        offsetWidth: 300,
        offsetHeight: 400,
        offsetTop: 50,
        offsetLeft: 100
      };
      window.pageYOffset = 10;
      window.pageXOffset = 20;
    });

    test('should get offset', () => {
      const result = dom.offset(mockElement);
      
      expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
      expect(result).toEqual({
        top: 110, // 100 + 10
        left: 220, // 200 + 20
        width: 300,
        height: 400
      });
    });

    test('should get position', () => {
      const result = dom.position(mockElement);
      
      expect(result).toEqual({
        top: 50,
        left: 100
      });
    });

    test('should get width', () => {
      const result = dom.width(mockElement);
      
      expect(result).toBe(300);
    });

    test('should get height', () => {
      const result = dom.height(mockElement);
      
      expect(result).toBe(400);
    });
  });

  describe('Scrolling', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        scrollTop: 0,
        scrollLeft: 0,
        scrollIntoView: jest.fn()
      };
    });

    test('should scroll to position', () => {
      dom.scrollTo(mockElement, 100, 50);
      
      expect(mockElement.scrollTop).toBe(100);
      expect(mockElement.scrollLeft).toBe(50);
    });

    test('should scroll into view', () => {
      const options = { behavior: 'smooth' };
      
      dom.scrollIntoView(mockElement, options);
      
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith(options);
    });
  });

  describe('Events', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      };
    });

    test('should add event listener', () => {
      const handler = jest.fn();
      
      dom.on(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, {});
    });

    test('should add event listener with options', () => {
      const handler = jest.fn();
      const options = { passive: true };
      
      dom.on(mockElement, 'click', handler, options);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, options);
    });

    test('should remove event listener', () => {
      const handler = jest.fn();
      
      dom.off(mockElement, 'click', handler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler);
    });

    test('should trigger event', () => {
      dom.trigger(mockElement, 'custom-event', { data: 'test' });
      
      expect(window.CustomEvent).toHaveBeenCalledWith('custom-event', {
        detail: { data: 'test' },
        bubbles: true,
        cancelable: true
      });
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Form Utilities', () => {
    let mockForm, mockFormData;

    beforeEach(() => {
      mockFormData = new Map();
      mockFormData.set('name', 'John');
      mockFormData.set('email', 'john@example.com');
      
      mockForm = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        firstChild: { nodeType: 1 }
      };
      
      global.FormData = jest.fn(() => mockFormData);
    });

    test('should serialize form', () => {
      const result = dom.serialize(mockForm);
      
      expect(global.FormData).toHaveBeenCalledWith(mockForm);
      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });
  });

  describe('Animation Utilities', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        style: {
          opacity: 0,
          display: 'none'
        }
      };
      global.requestAnimationFrame = jest.fn((cb) => {
        cb(0);
        return 1;
      });
      global.performance = {
        now: jest.fn(() => 0)
      };
    });

    test('should fade in element', () => {
      dom.fadeIn(mockElement, 100);
      
      expect(mockElement.style.opacity).toBe('0');
      expect(mockElement.style.display).toBe('block');
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should fade out element', () => {
      window.getComputedStyle = jest.fn(() => ({ opacity: '1' }));
      
      dom.fadeOut(mockElement, 100);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('F2P Tests', () => {
    test('should handle invalid selectors gracefully', () => {
      document.querySelector.mockReturnValue(null);
      
      // F2P: Should handle null element gracefully
      expect(() => dom.addClass('#nonexistent', 'class')).not.toThrow();
      expect(() => dom.removeClass('#nonexistent', 'class')).not.toThrow();
      expect(() => dom.setText('#nonexistent', 'text')).not.toThrow();
    });

    test('should handle missing parent in removal', () => {
      const orphanElement = { parentNode: null };
      
      // F2P: Should not throw when removing orphan element
      expect(() => dom.remove(orphanElement)).not.toThrow();
    });

    test('should handle empty element in empty operation', () => {
      const emptyElement = { firstChild: null };
      
      // F2P: Should handle empty element gracefully
      expect(() => dom.empty(emptyElement)).not.toThrow();
    });

    test('should handle invalid style operations', () => {
      const element = { style: null };
      
      // F2P: Should handle null style gracefully
      expect(() => dom.setStyle(element, { color: 'red' })).not.toThrow();
    });

    test('should handle event operations on null elements', () => {
      document.querySelector.mockReturnValue(null);
      
      const handler = jest.fn();
      
      // F2P: Should handle null elements gracefully
      expect(() => dom.on('#nonexistent', 'click', handler)).not.toThrow();
      expect(() => dom.off('#nonexistent', 'click', handler)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete DOM manipulation workflow', () => {
      const container = dom.createElement('div', { id: 'container' });
      const button = dom.createElement('button', {
        className: 'btn',
        textContent: 'Click me'
      });
      
      // Add to container
      dom.append(container, button);
      
      // Add event listener
      const handler = jest.fn();
      dom.on(button, 'click', handler);
      
      // Trigger event
      dom.trigger(button, 'click', { data: 'test' });
      
      // Verify operations
      expect(container.appendChild).toHaveBeenCalledWith(button);
      expect(button.addEventListener).toHaveBeenCalledWith('click', handler, {});
      expect(button.dispatchEvent).toHaveBeenCalled();
    });

    test('should handle complex element creation with nested children', () => {
      const child1 = dom.createElement('span', { textContent: 'Child 1' });
      const child2 = dom.createElement('span', { textContent: 'Child 2' });
      
      const parent = dom.createElement('div', {
        className: 'parent',
        style: { padding: '10px' }
      }, [child1, child2]);
      
      expect(parent.className).toBe('parent');
      expect(parent.style.padding).toBe('10px');
      expect(parent.appendChild).toHaveBeenCalledWith(child1);
      expect(parent.appendChild).toHaveBeenCalledWith(child2);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed inputs gracefully', () => {
      // F2P: Should handle undefined/null inputs
      expect(() => dom.addClass(undefined, 'class')).not.toThrow();
      expect(() => dom.setText(null, 'text')).not.toThrow();
      expect(() => dom.setStyle({}, { color: 'red' })).not.toThrow();
    });

    test('should handle DOM method failures gracefully', () => {
      const element = {
        classList: {
          add: jest.fn(() => { throw new Error('DOM error'); })
        }
      };
      
      // F2P: Should handle DOM errors gracefully
      expect(() => dom.addClass(element, 'class')).not.toThrow();
    });
  });
});
