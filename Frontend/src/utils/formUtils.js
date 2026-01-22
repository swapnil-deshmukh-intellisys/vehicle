// Comprehensive form utilities with validation and submission handling

// Form Validator Class
export class FormValidator {
  constructor(rules = {}) {
    this.rules = rules;
    this.errors = {};
  }

  // Validate entire form
  validate(formData) {
    this.errors = {};
    
    for (const field in this.rules) {
      const fieldRules = this.rules[field];
      const value = formData[field];
      const fieldErrors = this.validateField(field, value, fieldRules);
      
      if (fieldErrors.length > 0) {
        this.errors[field] = fieldErrors;
      }
    }
    
    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors
    };
  }

  // Validate single field
  validateField(fieldName, value, rules) {
    const errors = [];
    
    for (const rule of rules) {
      const error = this.checkRule(value, rule, fieldName);
      if (error) {
        errors.push(error);
      }
    }
    
    return errors;
  }

  // Check individual rule
  checkRule(value, rule, fieldName) {
    switch (rule.type) {
      case 'required':
        if (!value || value.toString().trim() === '') {
          return rule.message || `${fieldName} is required`;
        }
        break;
        
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return rule.message || 'Please enter a valid email address';
        }
        break;
      }
        
      case 'minLength':
        if (value && value.toString().length < rule.value) {
          return rule.message || `Must be at least ${rule.value} characters`;
        }
        break;
        
      case 'maxLength':
        if (value && value.toString().length > rule.value) {
          return rule.message || `Must be no more than ${rule.value} characters`;
        }
        break;
        
      case 'pattern':
        if (value && !rule.value.test(value)) {
          return rule.message || 'Invalid format';
        }
        break;
        
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message || 'Invalid value';
        }
        break;
    }
    
    return null;
  }

  // Get field errors
  getFieldErrors(fieldName) {
    return this.errors[fieldName] || [];
  }

  // Clear field errors
  clearFieldErrors(fieldName) {
    delete this.errors[fieldName];
  }

  // Clear all errors
  clearAllErrors() {
    this.errors = {};
  }
}

// Form Submission Handler
export class FormSubmissionHandler {
  constructor(options = {}) {
    this.options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };
  }

  // Submit form with retry logic
  async submit(url, data, options = {}) {
    const config = { ...this.options, ...options };
    let lastError;
    
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(url, data, config);
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  // Make HTTP request
  async makeRequest(url, data, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Handle response
  async handleResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Form Field Manager
export class FormFieldManager {
  constructor(initialValues = {}) {
    this.values = { ...initialValues };
    this.touched = {};
    this.dirty = {};
    this.listeners = new Set();
  }

  // Set field value
  setValue(fieldName, value) {
    const oldValue = this.values[fieldName];
    this.values[fieldName] = value;
    this.dirty[fieldName] = oldValue !== value;
    
    this.notifyListeners('fieldChanged', {
      fieldName,
      value,
      oldValue,
      dirty: this.dirty[fieldName]
    });
  }

  // Get field value
  getValue(fieldName) {
    return this.values[fieldName];
  }

  // Get all values
  getValues() {
    return { ...this.values };
  }

  // Set field as touched
  setTouched(fieldName, touched = true) {
    this.touched[fieldName] = touched;
    
    this.notifyListeners('fieldTouched', {
      fieldName,
      touched
    });
  }

  // Check if field is dirty
  isDirty(fieldName) {
    return this.dirty[fieldName] || false;
  }

  // Check if any field is dirty
  isAnyDirty() {
    return Object.values(this.dirty).some(dirty => dirty);
  }

  // Reset form
  reset(values = {}) {
    this.values = { ...values };
    this.touched = {};
    this.dirty = {};
    
    this.notifyListeners('formReset', { values });
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Form field manager listener error:', error);
      }
    });
  }
}

// Form Utilities
export const formUtils = {
  // Create form validator
  createValidator(rules) {
    return new FormValidator(rules);
  },

  // Create submission handler
  createSubmissionHandler(options) {
    return new FormSubmissionHandler(options);
  },

  // Create field manager
  createFieldManager(initialValues) {
    return new FormFieldManager(initialValues);
  },

  // Common validation rules
  validationRules: {
    required: (message) => ({ type: 'required', message }),
    email: (message) => ({ type: 'email', message }),
    minLength: (value, message) => ({ type: 'minLength', value, message }),
    maxLength: (value, message) => ({ type: 'maxLength', value, message }),
    pattern: (regex, message) => ({ type: 'pattern', value: regex, message }),
    custom: (validator, message) => ({ type: 'custom', validator, message })
  },

  // Format form data for submission
  formatFormData(data) {
    const formData = new FormData();
    
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    }
    
    return formData;
  },

  // Extract form data from form element
  extractFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  },

  // Sanitize form data
  sanitizeFormData(data) {
    const sanitized = {};
    
    for (const key in data) {
      if (typeof data[key] === 'string') {
        sanitized[key] = data[key].trim();
      } else {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized;
  }
};

// Export default
export default formUtils;
