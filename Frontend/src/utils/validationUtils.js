// Comprehensive data validation utility functions

// Validation Rules
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  NUMBER: 'number',
  INTEGER: 'integer',
  POSITIVE: 'positive',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  PATTERN: 'pattern',
  ALPHA: 'alpha',
  ALPHA_NUMERIC: 'alphaNumeric',
  PASSWORD: 'password',
  CREDIT_CARD: 'creditCard',
  DATE: 'date',
  TIME: 'time',
  COLOR: 'color',
  FILE: 'file',
  IMAGE: 'image'
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&=]*)$/,
  ALPHA: /^[A-Za-z]+$/,
  ALPHA_NUMERIC: /^[A-Za-z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SLUG: /^[a-z0-9-]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  POSTAL_CODE: /^[A-Za-z0-9\s-]{3,10}$/
};

// Error Messages
export const VALIDATION_MESSAGES = {
  [VALIDATION_RULES.REQUIRED]: 'This field is required',
  [VALIDATION_RULES.EMAIL]: 'Please enter a valid email address',
  [VALIDATION_RULES.PHONE]: 'Please enter a valid phone number',
  [VALIDATION_RULES.URL]: 'Please enter a valid URL',
  [VALIDATION_RULES.NUMBER]: 'Please enter a valid number',
  [VALIDATION_RULES.INTEGER]: 'Please enter a whole number',
  [VALIDATION_RULES.POSITIVE]: 'Please enter a positive number',
  [VALIDATION_RULES.MIN_LENGTH]: 'Must be at least {{min}} characters',
  [VALIDATION_RULES.MAX_LENGTH]: 'Must be no more than {{max}} characters',
  [VALIDATION_RULES.MIN_VALUE]: 'Must be at least {{min}}',
  [VALIDATION_RULES.MAX_VALUE]: 'Must be no more than {{max}}',
  [VALIDATION_RULES.PATTERN]: 'Please enter a valid format',
  [VALIDATION_RULES.ALPHA]: 'Please enter letters only',
  [VALIDATION_RULES.ALPHA_NUMERIC]: 'Please enter letters and numbers only',
  [VALIDATION_RULES.PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  [VALIDATION_RULES.CREDIT_CARD]: 'Please enter a valid credit card number',
  [VALIDATION_RULES.DATE]: 'Please enter a valid date (YYYY-MM-DD)',
  [VALIDATION_RULES.TIME]: 'Please enter a valid time (HH:MM)',
  [VALIDATION_RULES.COLOR]: 'Please enter a valid color (hex format)',
  [VALIDATION_RULES.FILE]: 'Please select a valid file',
  [VALIDATION_RULES.IMAGE]: 'Please select a valid image file'
};

// Validator Class
export class Validator {
  constructor() {
    this.rules = new Map();
    this.messages = { ...VALIDATION_MESSAGES };
  }

  // Add custom validation rule
  addRule(name, validator, message) {
    this.rules.set(name, validator);
    if (message) {
      this.messages[name] = message;
    }
  }

  // Add custom message
  addMessage(rule, message) {
    this.messages[rule] = message;
  }

  // Validate single value
  validate(value, rules, options = {}) {
    const errors = [];
    const { fieldName = 'Field', context = {} } = options;

    if (!Array.isArray(rules)) {
      rules = [rules];
    }

    for (const rule of rules) {
      const error = this.validateRule(value, rule, fieldName, context);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate single rule
  validateRule(value, rule, fieldName, context) {
    if (typeof rule === 'string') {
      rule = { type: rule };
    }

    const { type, ...params } = rule;

    // Skip validation if value is empty and not required
    if (!this.isRequired(rule) && this.isEmpty(value)) {
      return null;
    }

    const validator = this.rules.get(type) || this.getDefaultValidator(type);
    
    if (validator) {
      const isValid = validator(value, params, context);
      if (!isValid) {
        return this.formatMessage(this.messages[type], params, fieldName);
      }
    }

    return null;
  }

  // Check if rule is required
  isRequired(rule) {
    if (typeof rule === 'string') {
      return rule === VALIDATION_RULES.REQUIRED;
    }
    return rule.type === VALIDATION_RULES.REQUIRED || rule.required === true;
  }

  // Check if value is empty
  isEmpty(value) {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  // Get default validator
  getDefaultValidator(type) {
    switch (type) {
      case VALIDATION_RULES.REQUIRED:
        return (value) => !this.isEmpty(value);
      
      case VALIDATION_RULES.EMAIL:
        return (value) => VALIDATION_PATTERNS.EMAIL.test(value);
      
      case VALIDATION_RULES.PHONE:
        return (value) => VALIDATION_PATTERNS.PHONE.test(value) && 
                          value.replace(/\D/g, '').length >= 10;
      
      case VALIDATION_RULES.URL:
        return (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        };
      
      case VALIDATION_RULES.NUMBER:
        return (value) => !isNaN(parseFloat(value)) && isFinite(value);
      
      case VALIDATION_RULES.INTEGER:
        return (value) => Number.isInteger(Number(value));
      
      case VALIDATION_RULES.POSITIVE:
        return (value) => Number(value) > 0;
      
      case VALIDATION_RULES.MIN_LENGTH:
        return (value, params) => value.length >= params.min;
      
      case VALIDATION_RULES.MAX_LENGTH:
        return (value, params) => value.length <= params.max;
      
      case VALIDATION_RULES.MIN_VALUE:
        return (value, params) => Number(value) >= params.min;
      
      case VALIDATION_RULES.MAX_VALUE:
        return (value, params) => Number(value) <= params.max;
      
      case VALIDATION_RULES.PATTERN:
        return (value, params) => new RegExp(params.pattern).test(value);
      
      case VALIDATION_RULES.ALPHA:
        return (value) => VALIDATION_PATTERNS.ALPHA.test(value);
      
      case VALIDATION_RULES.ALPHA_NUMERIC:
        return (value) => VALIDATION_PATTERNS.ALPHA_NUMERIC.test(value);
      
      case VALIDATION_RULES.PASSWORD:
        return (value) => VALIDATION_PATTERNS.PASSWORD.test(value);
      
      case VALIDATION_RULES.CREDIT_CARD:
        return (value) => this.validateCreditCard(value);
      
      case VALIDATION_RULES.DATE:
        return (value) => {
          const date = new Date(value);
          return !isNaN(date.getTime()) && VALIDATION_PATTERNS.DATE.test(value);
        };
      
      case VALIDATION_RULES.TIME:
        return (value) => VALIDATION_PATTERNS.TIME.test(value);
      
      case VALIDATION_RULES.COLOR:
        return (value) => VALIDATION_PATTERNS.COLOR.test(value);
      
      case VALIDATION_RULES.FILE:
        return (value, params) => this.validateFile(value, params);
      
      case VALIDATION_RULES.IMAGE:
        return (value, params) => this.validateImage(value, params);
      
      default:
        return null;
    }
  }

  // Validate credit card
  validateCreditCard(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 && cleaned.length >= 13 && cleaned.length <= 19;
  }

  // Validate file
  validateFile(file, params) {
    if (!file || !(file instanceof File)) {
      return false;
    }

    const { maxSize, allowedTypes } = params;

    if (maxSize && file.size > maxSize) {
      return false;
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return false;
    }

    return true;
  }

  // Validate image
  validateImage(file, params) {
    if (!this.validateFile(file, params)) {
      return false;
    }

    return file.type.startsWith('image/');
  }

  // Format error message
  formatMessage(template, params, fieldName) {
    let message = template || 'Invalid value';
    
    // Replace field name
    message = message.replace('{{field}}', fieldName);
    
    // Replace parameters
    Object.keys(params).forEach(key => {
      message = message.replace(`{{${key}}}`, params[key]);
    });

    return message;
  }

  // Validate form data
  validateForm(data, schema) {
    const errors = {};
    let isValid = true;

    Object.keys(schema).forEach(fieldName => {
      const value = data[fieldName];
      const rules = schema[fieldName];
      
      const result = this.validate(value, rules, { fieldName });
      
      if (!result.isValid) {
        errors[fieldName] = result.errors;
        isValid = false;
      }
    });

    return {
      isValid,
      errors
    };
  }

  // Validate and sanitize
  validateAndSanitize(value, rules, options = {}) {
    const validation = this.validate(value, rules, options);
    
    return {
      ...validation,
      sanitized: this.sanitize(value, rules)
    };
  }

  // Sanitize value
  sanitize(value, rules) {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value.trim();

    // Apply sanitization based on rules
    rules.forEach(rule => {
      const type = typeof rule === 'string' ? rule : rule.type;

      switch (type) {
        case VALIDATION_RULES.EMAIL:
          sanitized = sanitized.toLowerCase();
          break;
        
        case VALIDATION_RULES.PHONE:
          sanitized = sanitized.replace(/[^\d+\-()]/g, '');
          break;
        
        case VALIDATION_RULES.NUMBER:
        case VALIDATION_RULES.INTEGER:
          sanitized = sanitized.replace(/[^\d.-]/g, '');
          break;
        
        case VALIDATION_RULES.ALPHA:
          sanitized = sanitized.replace(/[^A-Za-z]/g, '');
          break;
        
        case VALIDATION_RULES.ALPHA_NUMERIC:
          sanitized = sanitized.replace(/[^A-Za-z0-9]/g, '');
          break;
        
        case VALIDATION_RULES.URL:
          try {
            const url = new URL(sanitized);
            sanitized = url.toString();
          } catch {
            // Keep original if invalid
          }
          break;
      }
    });

    return sanitized;
  }
}

// Create global validator
export const validator = new Validator();

// Utility functions
export const validate = (value, rules, options) => {
  return validator.validate(value, rules, options);
};

export const validateForm = (data, schema) => {
  return validator.validateForm(data, schema);
};

export const validateAndSanitize = (value, rules, options) => {
  return validator.validateAndSanitize(value, rules, options);
};

export const sanitize = (value, rules) => {
  return validator.sanitize(value, rules);
};

// Common validation schemas
export const COMMON_SCHEMAS = {
  userRegistration: {
    username: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, min: 3 },
      { type: VALIDATION_RULES.MAX_LENGTH, max: 20 },
      { type: VALIDATION_RULES.PATTERN, pattern: VALIDATION_PATTERNS.USERNAME }
    ],
    email: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.EMAIL }
    ],
    password: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.PASSWORD }
    ],
    confirmPassword: [
      { type: VALIDATION_RULES.REQUIRED },
      (value, context) => value === context.password
    ]
  },

  contactForm: {
    name: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, min: 2 },
      { type: VALIDATION_RULES.MAX_LENGTH, max: 50 }
    ],
    email: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.EMAIL }
    ],
    phone: [
      { type: VALIDATION_RULES.PHONE }
    ],
    message: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, min: 10 },
      { type: VALIDATION_RULES.MAX_LENGTH, max: 500 }
    ]
  },

  paymentForm: {
    cardNumber: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.CREDIT_CARD }
    ],
    expiryDate: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.PATTERN, pattern: /^(0[1-9]|1[0-2])\/\d{2}$/ }
    ],
    cvv: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.PATTERN, pattern: /^\d{3,4}$/ }
    ],
    amount: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.NUMBER },
      { type: VALIDATION_RULES.POSITIVE },
      { type: VALIDATION_RULES.MIN_VALUE, min: 0.01 }
    ]
  }
};

// Add custom validators
validator.addRule('confirmPassword', (value, params, context) => {
  return value === context.password;
}, 'Passwords must match');

validator.addRule('strongPassword', (value) => {
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isLongEnough = value.length >= 8;

  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
}, 'Password must contain uppercase, lowercase, number, and special character');

validator.addRule('futureDate', (value) => {
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date >= today;
}, 'Date must be in the future');

validator.addRule('age', (value, params) => {
  const birthDate = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (params.min) {
    return age >= params.min;
  }
  
  if (params.max) {
    return age <= params.max;
  }
  
  return age >= 0;
}, 'Age must be between {{min}} and {{max}}');
