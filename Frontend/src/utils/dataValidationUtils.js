// Comprehensive data validation utility functions

// Basic Validation Functions
export const validateRequired = (value) => {
  if (value === null || value === undefined) {
    return { isValid: false, message: 'Field is required' };
  }
  
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      return { isValid: false, message: 'Field cannot be empty' };
    }
  }
  
  return { isValid: true };
};

export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: 'Phone number can only contain digits, spaces, and basic symbols' };
  }
  
  if (cleanPhone.length < 10) {
    return { isValid: false, message: 'Phone number must be at least 10 digits' };
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, message: 'Phone number is too long' };
  }
  
  return { isValid: true };
};

export const validateURL = (url) => {
  if (!url) {
    return { isValid: false, message: 'URL is required' };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, message: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check domain
    if (!urlObj.hostname) {
      return { isValid: false, message: 'URL must have a valid domain' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

export const validateCreditCard = (cardNumber) => {
  if (!cardNumber) {
    return { isValid: false, message: 'Credit card number is required' };
  }
  
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return { isValid: false, message: 'Credit card number must be between 13 and 19 digits' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  if (sum % 10 !== 0) {
    return { isValid: false, message: 'Invalid credit card number' };
  }
  
  return { isValid: true };
};

export const validateDate = (date, options = {}) => {
  const { minDate, maxDate } = options;
  
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return { isValid: false, message: 'Invalid date format' };
  }
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Invalid date' };
  }
  
  // Check min date
  if (minDate) {
    const minDateObj = new Date(minDate);
    if (dateObj < minDateObj) {
      return { isValid: false, message: `Date must be after ${minDateObj.toLocaleDateString()}` };
    }
  }
  
  // Check max date
  if (maxDate) {
    const maxDateObj = new Date(maxDate);
    if (dateObj > maxDateObj) {
      return { isValid: false, message: `Date must be before ${maxDateObj.toLocaleDateString()}` };
    }
  }
  
  return { isValid: true };
};

export const validateNumber = (value, options = {}) => {
  const { min, max, integer = false, positive = false } = options;
  
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: 'Number is required' };
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, message: 'Please enter a valid number' };
  }
  
  if (integer && !Number.isInteger(numValue)) {
    return { isValid: false, message: 'Please enter an integer' };
  }
  
  if (positive && numValue <= 0) {
    return { isValid: false, message: 'Number must be positive' };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, message: `Number must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, message: `Number must be at most ${max}` };
  }
  
  return { isValid: true };
};

export const validateStringLength = (value, options = {}) => {
  const { min, max, trim = true } = options;
  
  if (value === null || value === undefined) {
    return { isValid: false, message: 'Field is required' };
  }
  
  const stringValue = String(value);
  const processedValue = trim ? stringValue.trim() : stringValue;
  
  if (min !== undefined && processedValue.length < min) {
    return { isValid: false, message: `Must be at least ${min} characters long` };
  }
  
  if (max !== undefined && processedValue.length > max) {
    return { isValid: false, message: `Must be at most ${max} characters long` };
  }
  
  return { isValid: true };
};

// Advanced Validation Functions
export const validatePasswordStrength = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !/\s/.test(password)
  };
  
  const failedRequirements = Object.entries(requirements)
    .filter(([, passed]) => !passed)
    .map(([requirement]) => {
      switch (requirement) {
        case 'minLength': return 'at least 8 characters';
        case 'hasUpperCase': return 'uppercase letter';
        case 'hasLowerCase': return 'lowercase letter';
        case 'hasNumbers': return 'number';
        case 'hasSpecialChar': return 'special character';
        case 'noSpaces': return 'no spaces';
        default: return requirement;
      }
    });
  
  if (failedRequirements.length > 0) {
    return { 
      isValid: false, 
      message: `Password must contain: ${failedRequirements.join(', ')}` 
    };
  }
  
  return { isValid: true };
};

export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: 'Username is required' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' };
  }
  
  return { isValid: true };
};

export const validateAddress = (address) => {
  if (!address) {
    return { isValid: false, message: 'Address is required' };
  }
  
  if (typeof address !== 'string') {
    return { isValid: false, message: 'Address must be a string' };
  }
  
  if (address.trim().length < 5) {
    return { isValid: false, message: 'Address must be at least 5 characters long' };
  }
  
  if (address.trim().length > 200) {
    return { isValid: false, message: 'Address is too long' };
  }
  
  return { isValid: true };
};

export const validatePostalCode = (postalCode, countryCode = 'US') => {
  if (!postalCode) {
    return { isValid: false, message: 'Postal code is required' };
  }
  
  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    IT: /^\d{5}$/,
    JP: /^\d{3}-\d{4}$/,
    AU: /^\d{4}$/,
    NL: /^\d{4} [A-Z]{2}$/,
    ES: /^\d{5}$/,
    IN: /^\d{6}$/
  };
  
  const pattern = patterns[countryCode] || patterns.US;
  
  if (!pattern.test(postalCode)) {
    return { isValid: false, message: `Invalid postal code format for ${countryCode}` };
  }
  
  return { isValid: true };
};

// Form Validation Class
export class FormValidator {
  constructor() {
    this.rules = new Map();
    this.errors = new Map();
  }

  addRule(fieldName, validator, message = null) {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    
    this.rules.get(fieldName).push({ validator, message });
    return this;
  }

  validate(data) {
    this.errors.clear();
    let isValid = true;

    for (const [fieldName, fieldRules] of this.rules) {
      const value = data[fieldName];
      
      for (const rule of fieldRules) {
        const result = rule.validator(value);
        
        if (!result.isValid) {
          this.errors.set(fieldName, rule.message || result.message);
          isValid = false;
          break; // Stop at first error for this field
        }
      }
    }

    return {
      isValid,
      errors: Object.fromEntries(this.errors),
      errorCount: this.errors.size
    };
  }

  validateField(fieldName, value) {
    const fieldRules = this.rules.get(fieldName);
    if (!fieldRules) {
      return { isValid: true };
    }

    for (const rule of fieldRules) {
      const result = rule.validator(value);
      
      if (!result.isValid) {
        const message = rule.message || result.message;
        this.errors.set(fieldName, message);
        return { isValid: false, message };
      }
    }

    this.errors.delete(fieldName);
    return { isValid: true };
  }

  getErrors() {
    return Object.fromEntries(this.errors);
  }

  hasErrors() {
    return this.errors.size > 0;
  }

  clearErrors() {
    this.errors.clear();
  }

  clearFieldError(fieldName) {
    this.errors.delete(fieldName);
  }
}

// Validation Presets
export const createRegistrationValidator = () => {
  return new FormValidator()
    .addRule('username', validateUsername, 'Please enter a valid username')
    .addRule('email', validateEmail, 'Please enter a valid email address')
    .addRule('password', validatePasswordStrength, 'Please enter a strong password')
    .addRule('confirmPassword', (value, data) => {
      if (value !== data.password) {
        return { isValid: false, message: 'Passwords do not match' };
      }
      return { isValid: true };
    }, 'Passwords do not match');
};

export const createLoginValidator = () => {
  return new FormValidator()
    .addRule('username', validateRequired, 'Username is required')
    .addRule('password', validateRequired, 'Password is required');
};

export const createProfileValidator = () => {
  return new FormValidator()
    .addRule('firstName', (value) => validateStringLength(value, { min: 2, max: 50 }), 'First name must be 2-50 characters')
    .addRule('lastName', (value) => validateStringLength(value, { min: 2, max: 50 }), 'Last name must be 2-50 characters')
    .addRule('email', validateEmail, 'Please enter a valid email address')
    .addRule('phone', validatePhone, 'Please enter a valid phone number')
    .addRule('address', validateAddress, 'Please enter a valid address');
};

export const createPaymentValidator = () => {
  return new FormValidator()
    .addRule('cardNumber', validateCreditCard, 'Please enter a valid credit card number')
    .addRule('expiryDate', (value) => {
      const match = value.match(/^(0[1-9]|1[0-2])\/\d{2}$/);
      if (!match) {
        return { isValid: false, message: 'Please use MM/YY format' };
      }
      
      const month = parseInt(match[1]);
      const year = parseInt(match[2]) + 2000;
      const expiry = new Date(year, month, 0);
      const now = new Date();
      
      if (expiry < now) {
        return { isValid: false, message: 'Card has expired' };
      }
      
      return { isValid: true };
    }, 'Please enter a valid expiry date')
    .addRule('cvv', (value) => {
      if (!/^\d{3,4}$/.test(value)) {
        return { isValid: false, message: 'CVV must be 3 or 4 digits' };
      }
      return { isValid: true };
    }, 'Please enter a valid CVV')
    .addRule('name', (value) => validateStringLength(value, { min: 3, max: 100 }), 'Name must be 3-100 characters');
};

// Utility Functions
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const formatValidationErrors = (errors) => {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
};
