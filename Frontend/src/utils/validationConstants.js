// Validation constants and configurations

// Validation types
export const VALIDATION_TYPES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  NUMBER: 'number',
  STRING: 'string',
  DATE: 'date',
  PASSWORD: 'password',
  USERNAME: 'username',
  CREDIT_CARD: 'credit_card',
  POSTAL_CODE: 'postal_code',
  ADDRESS: 'address'
};

// Validation rules
export const VALIDATION_RULES = {
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  PATTERN: 'pattern',
  CUSTOM: 'custom',
  REQUIRED: 'required',
  OPTIONAL: 'optional'
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_US: /^\+?1?[\d\s\-()]{10,}$/,
  PHONE_INTL: /^\+?[\d\s\-()]{10,}$/,
  URL_HTTPS: /^https?:\/\/.+\..+/,
  URL_STRICT: /^https:\/\/.+\..+/,
  USERNAME_ALPHANUMERIC: /^[a-zA-Z0-9_]{3,20}$/,
  USERNAME_STRICT: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
  PASSWORD_BASIC: /.{8,}/,
  PASSWORD_MEDIUM: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
  CREDIT_CARD_VISA: /^4[0-9]{12,18}$/,
  CREDIT_CARD_MASTERCARD: /^5[1-5][0-9]{14}$/,
  CREDIT_CARD_AMEX: /^3[47][0-9]{13}$/,
  CREDIT_CARD_DISCOVER: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  POSTAL_CODE_US: /^\d{5}(-\d{4})?$/,
  POSTAL_CODE_CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
  POSTAL_CODE_UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
  POSTAL_CODE_DE: /^\d{5}$/,
  POSTAL_CODE_FR: /^\d{5}$/,
  POSTAL_CODE_IT: /^\d{5}$/,
  POSTAL_CODE_JP: /^\d{3}-\d{4}$/,
  POSTAL_CODE_AU: /^\d{4}$/,
  POSTAL_CODE_NL: /^\d{4} [A-Z]{2}$/,
  POSTAL_CODE_ES: /^\d{5}$/,
  POSTAL_CODE_IN: /^\d{6}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  FIRST_NAME: /^[a-zA-Z]{2,30}$/,
  LAST_NAME: /^[a-zA-Z]{2,30}$/,
  COMPANY_NAME: /^[a-zA-Z0-9\s&'-]{2,100}$/,
  STREET_ADDRESS: /^[a-zA-Z0-9\s#\-.,]{5,200}$/,
  CITY: /^[a-zA-Z\s'-]{2,50}$/,
  STATE_US: /^[A-Za-z]{2}$/,
  COUNTRY: /^[A-Za-z\s'-]{2,50}$/,
  COLOR_HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  COLOR_RGB: /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
  COLOR_RGBA: /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
  IP_V4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IP_V6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  UUID_V4: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
  SLUG: /^[a-z0-9-]+$/,
  ALPHABETIC: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  DECIMAL: /^[0-9]+\.?[0-9]*$/,
  INTEGER: /^-?\d+$/,
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  NON_NEGATIVE_INTEGER: /^\d+$/,
  FLOAT: /^-?\d*\.?\d+$/,
  JSON_STRING: /^{.*}$|^\[.*\]$/,
  HTML_TAG: /^<[^>]+>.*<\/[^>]+>$/,
  SAFE_FILENAME: /^[a-zA-Z0-9._-]+$/,
  TWITTER_HANDLE: /^@[A-Za-z0-9_]{1,15}$/,
  INSTAGRAM_HANDLE: /^[a-zA-Z0-9_.]{1,30}$/,
  FACEBOOK_ID: /^[0-9]{15,}$/,
  YOUTUBE_CHANNEL: /^UC[a-zA-Z0-9_-]{22}$/,
  GITHUB_USERNAME: /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/
};

// Length constraints
export const LENGTH_CONSTRAINTS = {
  USERNAME: { MIN: 3, MAX: 20 },
  PASSWORD: { MIN: 8, MAX: 128 },
  FIRST_NAME: { MIN: 2, MAX: 30 },
  LAST_NAME: { MIN: 2, MAX: 30 },
  COMPANY_NAME: { MIN: 2, MAX: 100 },
  STREET_ADDRESS: { MIN: 5, MAX: 200 },
  CITY: { MIN: 2, MAX: 50 },
  STATE: { MIN: 2, MAX: 50 },
  COUNTRY: { MIN: 2, MAX: 50 },
  POSTAL_CODE: { MIN: 3, MAX: 10 },
  PHONE: { MIN: 10, MAX: 15 },
  EMAIL: { MIN: 5, MAX: 254 },
  URL: { MIN: 11, MAX: 2048 },
  TITLE: { MIN: 1, MAX: 200 },
  DESCRIPTION: { MIN: 1, MAX: 5000 },
  MESSAGE: { MIN: 1, MAX: 10000 },
  COMMENT: { MIN: 1, MAX: 1000 },
  BIO: { MIN: 1, MAX: 500 },
  NOTES: { MIN: 1, MAX: 2000 }
};

// Number constraints
export const NUMBER_CONSTRAINTS = {
  AGE: { MIN: 0, MAX: 150 },
  RATING: { MIN: 0, MAX: 5 },
  PERCENTAGE: { MIN: 0, MAX: 100 },
  PRICE: { MIN: 0, MAX: 999999.99 },
  QUANTITY: { MIN: 0, MAX: 999999 },
  DISCOUNT: { MIN: 0, MAX: 100 },
  YEAR: { MIN: 1900, MAX: 2100 },
  MONTH: { MIN: 1, MAX: 12 },
  DAY: { MIN: 1, MAX: 31 },
  HOUR: { MIN: 0, MAX: 23 },
  MINUTE: { MIN: 0, MAX: 59 },
  SECOND: { MIN: 0, MAX: 59 }
};

// Error messages
export const VALIDATION_ERRORS = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_NUMBER: 'Please enter a valid number',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_PASSWORD: 'Please enter a valid password',
  INVALID_USERNAME: 'Please enter a valid username',
  INVALID_CREDIT_CARD: 'Please enter a valid credit card number',
  INVALID_POSTAL_CODE: 'Please enter a valid postal code',
  INVALID_ADDRESS: 'Please enter a valid address',
  TOO_SHORT: 'This field is too short',
  TOO_LONG: 'This field is too long',
  TOO_SMALL: 'This value is too small',
  TOO_LARGE: 'This value is too large',
  INVALID_FORMAT: 'Invalid format',
  CONTAINS_SPACES: 'This field cannot contain spaces',
  CONTAINS_SPECIAL_CHARS: 'This field contains invalid characters',
  PASSWORD_TOO_WEAK: 'Password is too weak',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  INVALID_FORMAT_SPECIFIC: (field) => `Please enter a valid ${field}`,
  MIN_LENGTH_SPECIFIC: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH_SPECIFIC: (max) => `Must be at most ${max} characters`,
  MIN_VALUE_SPECIFIC: (min) => `Must be at least ${min}`,
  MAX_VALUE_SPECIFIC: (max) => `Must be at most ${max}`
};

// Success messages
export const VALIDATION_SUCCESS = {
  VALID_EMAIL: 'Email is valid',
  VALID_PHONE: 'Phone number is valid',
  VALID_URL: 'URL is valid',
  VALID_PASSWORD: 'Password is valid',
  STRONG_PASSWORD: 'Password is strong',
  USERNAME_AVAILABLE: 'Username is available',
  EMAIL_AVAILABLE: 'Email is available',
  FORM_VALID: 'All fields are valid',
  CARD_VALID: 'Credit card is valid',
  ADDRESS_VALID: 'Address is valid'
};

// Validation presets
export const VALIDATION_PRESETS = {
  REGISTRATION: {
    username: {
      type: VALIDATION_TYPES.USERNAME,
      required: true,
      minLength: LENGTH_CONSTRAINTS.USERNAME.MIN,
      maxLength: LENGTH_CONSTRAINTS.USERNAME.MAX,
      pattern: VALIDATION_PATTERNS.USERNAME_ALPHANUMERIC
    },
    email: {
      type: VALIDATION_TYPES.EMAIL,
      required: true,
      pattern: VALIDATION_PATTERNS.EMAIL
    },
    password: {
      type: VALIDATION_TYPES.PASSWORD,
      required: true,
      minLength: LENGTH_CONSTRAINTS.PASSWORD.MIN,
      maxLength: LENGTH_CONSTRAINTS.PASSWORD.MAX,
      pattern: VALIDATION_PATTERNS.PASSWORD_STRONG
    },
    confirmPassword: {
      type: VALIDATION_TYPES.PASSWORD,
      required: true,
      custom: 'passwordMatch'
    }
  },
  LOGIN: {
    username: {
      type: VALIDATION_TYPES.REQUIRED,
      required: true
    },
    password: {
      type: VALIDATION_TYPES.REQUIRED,
      required: true
    }
  },
  PROFILE: {
    firstName: {
      type: VALIDATION_TYPES.STRING,
      required: true,
      minLength: LENGTH_CONSTRAINTS.FIRST_NAME.MIN,
      maxLength: LENGTH_CONSTRAINTS.FIRST_NAME.MAX,
      pattern: VALIDATION_PATTERNS.FIRST_NAME
    },
    lastName: {
      type: VALIDATION_TYPES.STRING,
      required: true,
      minLength: LENGTH_CONSTRAINTS.LAST_NAME.MIN,
      maxLength: LENGTH_CONSTRAINTS.LAST_NAME.MAX,
      pattern: VALIDATION_PATTERNS.LAST_NAME
    },
    email: {
      type: VALIDATION_TYPES.EMAIL,
      required: true,
      pattern: VALIDATION_PATTERNS.EMAIL
    },
    phone: {
      type: VALIDATION_TYPES.PHONE,
      required: false,
      pattern: VALIDATION_PATTERNS.PHONE_INTL
    },
    address: {
      type: VALIDATION_TYPES.ADDRESS,
      required: false,
      minLength: LENGTH_CONSTRAINTS.STREET_ADDRESS.MIN,
      maxLength: LENGTH_CONSTRAINTS.STREET_ADDRESS.MAX
    }
  },
  PAYMENT: {
    cardNumber: {
      type: VALIDATION_TYPES.CREDIT_CARD,
      required: true,
      pattern: VALIDATION_PATTERNS.CREDIT_CARD_VISA
    },
    expiryDate: {
      type: VALIDATION_TYPES.STRING,
      required: true,
      pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
      custom: 'expiryDate'
    },
    cvv: {
      type: VALIDATION_TYPES.STRING,
      required: true,
      pattern: /^\d{3,4}$/
    },
    name: {
      type: VALIDATION_TYPES.STRING,
      required: true,
      minLength: 3,
      maxLength: 100,
      pattern: VALIDATION_PATTERNS.NAME
    }
  }
};

// Validation triggers
export const VALIDATION_TRIGGERS = {
  ON_CHANGE: 'onChange',
  ON_BLUR: 'onBlur',
  ON_SUBMIT: 'onSubmit',
  ON_FOCUS: 'onFocus',
  MANUAL: 'manual'
};

// Validation states
export const VALIDATION_STATES = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid',
  ERROR: 'error'
};
