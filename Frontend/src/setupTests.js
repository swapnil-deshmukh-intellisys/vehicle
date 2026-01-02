import '@testing-library/jest-dom';

// Polyfill for TextEncoder
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder and TextDecoder available globally
if (typeof global !== 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
