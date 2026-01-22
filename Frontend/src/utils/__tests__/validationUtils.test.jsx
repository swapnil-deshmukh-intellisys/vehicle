import React from 'react';
import { render, screen } from '@testing-library/react';

// Validation Utilities
export class ValidationEngine {
  constructor() {
    this.rules = new Map();
    this.messages = new Map();
    this.setupDefaultRules();
  }

  // Setup default validation rules
  setupDefaultRules() {
    this.rules.set('required', (value) => {
      return value !== null && value !== undefined && value.toString().trim() !== '';
    });

    this.rules.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    });

    this.rules.set('minLength', (value, min) => {
      return !value || value.toString().length >= min;
    });

    this.rules.set('maxLength', (value, max) => {
      return !value || value.toString().length <= max;
    });

    this.rules.set('pattern', (value, pattern) => {
      return !value || new RegExp(pattern).test(value);
    });

    this.rules.set('numeric', (value) => {
      return !value || !isNaN(parseFloat(value)) && isFinite(value);
    });

    this.rules.set('url', (value) => {
      const urlRegex = /^https?:\/\/.+/;
      return !value || urlRegex.test(value);
    });
  }

  // Add custom rule
  addRule(name, validator, message) {
    this.rules.set(name, validator);
    this.messages.set(name, message);
  }

  // Validate field
  validateField(value, rules) {
    const errors = [];

    for (const rule of rules) {
      const [ruleName, ...params] = rule.split(':');
      const validator = this.rules.get(ruleName);
      
      if (validator) {
        const isValid = validator(value, ...params);
        if (!isValid) {
          errors.push(this.getMessage(ruleName, params));
        }
      }
    }

    return errors;
  }

  // Validate object
  validate(data, schema) {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const fieldErrors = this.validateField(data[field], rules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Get error message
  getMessage(ruleName, params) {
    const customMessage = this.messages.get(ruleName);
    if (customMessage) {
      return customMessage;
    }

    const defaultMessages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: `Must be at least ${params[0]} characters`,
      maxLength: `Must be no more than ${params[0]} characters`,
      pattern: 'Invalid format',
      numeric: 'Please enter a valid number',
      url: 'Please enter a valid URL'
    };

    return defaultMessages[ruleName] || 'Invalid value';
  }
}

// Form Validation Helper
export const validationUtils = {
  // Create validation engine
  createEngine() {
    return new ValidationEngine();
  },

  // Common validation patterns
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    url: /^https?:\/\/.+/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  },

  // Quick validators
  validators: {
    isRequired: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
    isEmail: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    isNumeric: (value) => !value || !isNaN(parseFloat(value)) && isFinite(value),
    isUrl: (value) => !value || /^https?:\/\/.+/.test(value),
    isPhone: (value) => !value || /^\+?[\d\s\-\(\)]+$/.test(value)
  },

  // Sanitize input
  sanitize(value, type = 'string') {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : '';
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      case 'email':
        return typeof value === 'string' ? value.toLowerCase().trim() : '';
      case 'phone':
        return typeof value === 'string' ? value.replace(/[^\d\+\-\(\)\s]/g, '') : '';
      default:
        return value;
    }
  },

  // Validate password strength
  validatePassword(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

    return {
      checks,
      score,
      strength,
      isValid: checks.length && checks.length === Object.keys(checks).length
    };
  }
};

describe('ValidationUtils', () => {
  let validationEngine;

  beforeEach(() => {
    validationEngine = validationUtils.createEngine();
  });

  describe('ValidationEngine', () => {
    // P2P Tests
    test('should create validation engine with default rules', () => {
      expect(validationEngine.rules.has('required')).toBe(true);
      expect(validationEngine.rules.has('email')).toBe(true);
      expect(validationEngine.rules.has('minLength')).toBe(true);
    });

    test('should add custom rules', () => {
      const customValidator = (value) => value === 'custom';
      validationEngine.addRule('custom', customValidator, 'Must be custom');
      
      expect(validationEngine.rules.has('custom')).toBe(true);
      expect(validationEngine.messages.get('custom')).toBe('Must be custom');
    });

    test('should validate required field', () => {
      const errors = validationEngine.validateField('', ['required']);
      expect(errors).toContain('This field is required');
    });

    test('should validate email format', () => {
      const errors1 = validationEngine.validateField('invalid-email', ['email']);
      expect(errors1).toContain('Please enter a valid email address');

      const errors2 = validationEngine.validateField('test@example.com', ['email']);
      expect(errors2).toHaveLength(0);
    });

    // F2P Tests
    test('should validate object with schema', () => {
      const schema = {
        name: ['required'],
        email: ['required', 'email'],
        age: ['numeric']
      };

      const data = {
        name: '',
        email: 'invalid-email',
        age: 'not-a-number'
      };

      const result = validationEngine.validate(data, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('This field is required');
      expect(result.errors.email).toContain('Please enter a valid email address');
      expect(result.errors.age).toContain('Please enter a valid number');
    });

    test('should validate with parameters', () => {
      const errors1 = validationEngine.validateField('123', ['minLength:5']);
      expect(errors1).toContain('Must be at least 5 characters');

      const errors2 = validationEngine.validateField('12345', ['minLength:5']);
      expect(errors2).toHaveLength(0);

      const errors3 = validationEngine.validateField('123456789', ['maxLength:5']);
      expect(errors3).toContain('Must be no more than 5 characters');
    });

    test('should validate pattern matching', () => {
      const errors1 = validationEngine.validateField('abc', ['pattern:^[0-9]+$']);
      expect(errors1).toContain('Invalid format');

      const errors2 = validationEngine.validateField('123', ['pattern:^[0-9]+$']);
      expect(errors2).toHaveLength(0);
    });

    test('should handle multiple validation rules', () => {
      const errors = validationEngine.validateField('', ['required', 'minLength:5', 'email']);
      expect(errors).toContain('This field is required');
      expect(errors).toHaveLength(1); // Required should stop validation
    });
  });

  describe('validationUtils', () => {
    // P2P Tests
    test('should create validation engine', () => {
      const engine = validationUtils.createEngine();
      expect(engine).toBeInstanceOf(ValidationEngine);
    });

    test('should provide validation patterns', () => {
      expect(validationUtils.patterns.email).toBeInstanceOf(RegExp);
      expect(validationUtils.patterns.phone).toBeInstanceOf(RegExp);
      expect(validationUtils.patterns.url).toBeInstanceOf(RegExp);
    });

    test('should provide quick validators', () => {
      expect(validationUtils.validators.isRequired('test')).toBe(true);
      expect(validationUtils.validators.isRequired('')).toBe(false);
      expect(validationUtils.validators.isEmail('test@example.com')).toBe(true);
      expect(validationUtils.validators.isEmail('invalid')).toBe(false);
      expect(validationUtils.validators.isNumeric('123')).toBe(true);
      expect(validationUtils.validators.isNumeric('abc')).toBe(false);
    });

    // F2P Tests
    test('should sanitize different data types', () => {
      expect(validationUtils.sanitize('  test  ', 'string')).toBe('test');
      expect(validationUtils.sanitize('123.45', 'number')).toBe(123.45);
      expect(validationUtils.sanitize('TEST@EXAMPLE.COM', 'email')).toBe('test@example.com');
      expect(validationUtils.sanitize('(123) 456-7890', 'phone')).toBe('(123) 456-7890');
      expect(validationUtils.sanitize('abc123!@#', 'alphanumeric')).toBe('abc123');
    });

    test('should validate password strength', () => {
      const weakPassword = validationUtils.validatePassword('weak');
      expect(weakPassword.strength).toBe('weak');
      expect(weakPassword.isValid).toBe(false);

      const strongPassword = validationUtils.validatePassword('StrongPass123!');
      expect(strongPassword.strength).toBe('strong');
      expect(strongPassword.isValid).toBe(true);

      const mediumPassword = validationUtils.validatePassword('Medium123');
      expect(mediumPassword.strength).toBe('medium');
      expect(mediumPassword.checks.lowercase).toBe(true);
      expect(mediumPassword.checks.uppercase).toBe(true);
      expect(mediumPassword.checks.numbers).toBe(true);
      expect(mediumPassword.checks.special).toBe(false);
    });

    test('should handle edge cases in validation', () => {
      // Handle null/undefined values
      expect(validationEngine.validateField(null, ['required'])).toContain('This field is required');
      expect(validationEngine.validateField(undefined, ['required'])).toContain('This field is required');
      expect(validationEngine.validateField('', ['email'])).toHaveLength(0); // Empty email should pass
      expect(validationEngine.validateField(null, ['email'])).toHaveLength(0); // Null email should pass
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete validation workflow', () => {
      const schema = {
        name: ['required', 'minLength:2'],
        email: ['required', 'email'],
        password: ['required', 'minLength:8'],
        phone: ['pattern:^\\+?[\\d\\s\\-\\(\\)]+$']
      };

      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        phone: '+1 (555) 123-4567'
      };

      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: 'weak',
        phone: 'invalid-phone'
      };

      // Test valid data
      const validResult = validationEngine.validate(validData, schema);
      expect(validResult.isValid).toBe(true);
      expect(Object.keys(validResult.errors)).toHaveLength(0);

      // Test invalid data
      const invalidResult = validationEngine.validate(invalidData, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(Object.keys(invalidResult.errors)).toHaveLength(4);

      // Test password strength
      const passwordStrength = validationUtils.validatePassword(invalidData.password);
      expect(passwordStrength.strength).toBe('weak');
      expect(passwordStrength.isValid).toBe(false);

      // Sanitize phone number
      const sanitizedPhone = validationUtils.sanitize(invalidData.phone, 'phone');
      expect(sanitizedPhone).toBe('invalid-phone'); // No special chars to remove
    });
  });
});
