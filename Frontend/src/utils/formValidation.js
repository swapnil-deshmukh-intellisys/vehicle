// Comprehensive form validation utilities

// Validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  NUMERIC: 'numeric',
  ALPHA: 'alpha',
  ALPHA_NUMERIC: 'alphaNumeric'
};

// Error messages
export const ERROR_MESSAGES = {
  [VALIDATION_RULES.REQUIRED]: 'This field is required',
  [VALIDATION_RULES.EMAIL]: 'Please enter a valid email address',
  [VALIDATION_RULES.PHONE]: 'Please enter a valid phone number',
  [VALIDATION_RULES.MIN_LENGTH]: (min) => `Minimum ${min} characters required`,
  [VALIDATION_RULES.MAX_LENGTH]: (max) => `Maximum ${max} characters allowed`,
  [VALIDATION_RULES.PATTERN]: 'Invalid format',
  [VALIDATION_RULES.NUMERIC]: 'Please enter numbers only',
  [VALIDATION_RULES.ALPHA]: 'Please enter letters only',
  [VALIDATION_RULES.ALPHA_NUMERIC]: 'Please enter letters and numbers only'
};

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports international formats)
export const PHONE_REGEX = /^\+?[\d\s\-()]+$/;

// Alpha validation regex
export const ALPHA_REGEX = /^[A-Za-z\s]+$/;

// Alpha-numeric validation regex
export const ALPHA_NUMERIC_REGEX = /^[A-Za-z0-9\s]+$/;

// Numeric validation regex
export const NUMERIC_REGEX = /^[0-9]+$/;

// Indian phone number regex
export const INDIAN_PHONE_REGEX = /^[+]?[91]?[\s-]?[6-9]\d{9}$/;

// Password strength regex
export const PASSWORD_STRENGTH_REGEX = {
  WEAK: /.{6,}/,
  MEDIUM: /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
  STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
};

// Validate single field
export const validateField = (value, rules) => {
  const errors = [];

  rules.forEach(rule => {
    const { type, param, message } = rule;

    switch (type) {
      case VALIDATION_RULES.REQUIRED:
        if (!value || value.trim() === '') {
          errors.push(message || ERROR_MESSAGES.REQUIRED);
        }
        break;

      case VALIDATION_RULES.EMAIL:
        if (value && !EMAIL_REGEX.test(value)) {
          errors.push(message || ERROR_MESSAGES.EMAIL);
        }
        break;

      case VALIDATION_RULES.PHONE:
        if (value && !PHONE_REGEX.test(value)) {
          errors.push(message || ERROR_MESSAGES.PHONE);
        }
        break;

      case VALIDATION_RULES.MIN_LENGTH:
        if (value && value.length < param) {
          errors.push(message || ERROR_MESSAGES.MIN_LENGTH(param));
        }
        break;

      case VALIDATION_RULES.MAX_LENGTH:
        if (value && value.length > param) {
          errors.push(message || ERROR_MESSAGES.MAX_LENGTH(param));
        }
        break;

      case VALIDATION_RULES.PATTERN:
        if (value && !param.test(value)) {
          errors.push(message || ERROR_MESSAGES.PATTERN);
        }
        break;

      case VALIDATION_RULES.NUMERIC:
        if (value && !NUMERIC_REGEX.test(value)) {
          errors.push(message || ERROR_MESSAGES.NUMERIC);
        }
        break;

      case VALIDATION_RULES.ALPHA:
        if (value && !ALPHA_REGEX.test(value)) {
          errors.push(message || ERROR_MESSAGES.ALPHA);
        }
        break;

      case VALIDATION_RULES.ALPHA_NUMERIC:
        if (value && !ALPHA_NUMERIC_REGEX.test(value)) {
          errors.push(message || ERROR_MESSAGES.ALPHA_NUMERIC);
        }
        break;
    }
  });

  return errors;
};

// Validate entire form
export const validateForm = (formData, validationSchema) => {
  const errors = {};

  Object.keys(validationSchema).forEach(field => {
    const fieldRules = validationSchema[field];
    const fieldValue = formData[field];
    const fieldErrors = validateField(fieldValue, fieldRules);
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time validation
export const validateFieldRealTime = (value, rules, debounceMs = 300) => {
  let timeout;
  
  return (callback) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const errors = validateField(value, rules);
      callback(errors);
    }, debounceMs);
  };
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  if (!password) return 'NONE';

  if (PASSWORD_STRENGTH_REGEX.STRONG.test(password)) {
    return 'STRONG';
  } else if (PASSWORD_STRENGTH_REGEX.MEDIUM.test(password)) {
    return 'MEDIUM';
  } else if (PASSWORD_STRENGTH_REGEX.WEAK.test(password)) {
    return 'WEAK';
  }
  
  return 'NONE';
};

// Form field sanitization
export const sanitizeField = (value, type) => {
  if (!value) return '';

  switch (type) {
    case 'email':
      return value.toLowerCase().trim();
    
    case 'phone':
      return value.replace(/[^\d+\-()\s]/g, '');
    
    case 'numeric':
      return value.replace(/[^\d]/g, '');
    
    case 'alpha':
      return value.replace(/[^A-Za-z\s]/g, '');
    
    case 'alphaNumeric':
      return value.replace(/[^A-Za-z0-9\s]/g, '');
    
    default:
      return value.trim();
  }
};

// Auto-format phone number
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format for Indian numbers
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

// Check if form has changes
export const hasFormChanges = (originalData, currentData) => {
  return JSON.stringify(originalData) !== JSON.stringify(currentData);
};

// Get first error message
export const getFirstError = (errors) => {
  if (!errors || typeof errors !== 'object') return '';
  
  for (const field in errors) {
    if (errors[field] && errors[field].length > 0) {
      return errors[field][0];
    }
  }
  
  return '';
};

// Common validation schemas
export const COMMON_SCHEMAS = {
  USER_REGISTRATION: {
    name: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.ALPHA },
      { type: VALIDATION_RULES.MIN_LENGTH, param: 2 },
      { type: VALIDATION_RULES.MAX_LENGTH, param: 50 }
    ],
    email: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.EMAIL }
    ],
    phone: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.PHONE }
    ],
    password: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, param: 8 }
    ]
  },
  
  BOOKING_FORM: {
    customerName: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.ALPHA }
    ],
    customerEmail: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.EMAIL }
    ],
    customerPhone: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.PHONE }
    ],
    serviceType: [
      { type: VALIDATION_RULES.REQUIRED }
    ],
    bookingDate: [
      { type: VALIDATION_RULES.REQUIRED }
    ]
  },
  
  CONTACT_FORM: {
    name: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.ALPHA }
    ],
    email: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.EMAIL }
    ],
    subject: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, param: 5 }
    ],
    message: [
      { type: VALIDATION_RULES.REQUIRED },
      { type: VALIDATION_RULES.MIN_LENGTH, param: 10 },
      { type: VALIDATION_RULES.MAX_LENGTH, param: 500 }
    ]
  }
};
