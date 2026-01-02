/* eslint-disable */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
const mockResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

if (typeof global !== 'undefined') {
  global.IntersectionObserver = mockIntersectionObserver;
  global.ResizeObserver = mockResizeObserver;
  
  // Polyfill for TextEncoder and TextDecoder
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
