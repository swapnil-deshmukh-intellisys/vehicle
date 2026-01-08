// Internationalization constants and configurations

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English', code: 'en', flag: '🇺🇸', rtl: false },
  'es-ES': { name: 'Español', code: 'es', flag: '🇪🇸', rtl: false },
  'fr-FR': { name: 'Français', code: 'fr', flag: '🇫🇷', rtl: false },
  'de-DE': { name: 'Deutsch', code: 'de', flag: '🇩🇪', rtl: false },
  'it-IT': { name: 'Italiano', code: 'it', flag: '🇮🇹', rtl: false },
  'pt-BR': { name: 'Português', code: 'pt', flag: '🇧🇷', rtl: false },
  'ja-JP': { name: '日本語', code: 'ja', flag: '🇯🇵', rtl: false },
  'ko-KR': { name: '한국어', code: 'ko', flag: '🇰🇷', rtl: false },
  'zh-CN': { name: '中文', code: 'zh', flag: '🇨🇳', rtl: false },
  'ru-RU': { name: 'Русский', code: 'ru', flag: '🇷🇺', rtl: false },
  'ar-SA': { name: 'العربية', code: 'ar', flag: '🇸🇦', rtl: true },
  'hi-IN': { name: 'हिन्दी', code: 'hi', flag: '🇮🇳', rtl: false }
};

// Language families
export const LANGUAGE_FAMILIES = {
  GERMANIC: ['en-US', 'de-DE'],
  ROMANCE: ['es-ES', 'fr-FR', 'it-IT', 'pt-BR'],
  SLAVIC: ['ru-RU'],
  ASIAN: ['ja-JP', 'ko-KR', 'zh-CN'],
  SEMITIC: ['ar-SA'],
  INDIC: ['hi-IN']
};

// RTL languages
export const RTL_LANGUAGES = ['ar-SA', 'he-IL', 'fa-IR', 'ur-PK', 'yi'];

// Date/time formats
export const DATE_FORMATS = {
  SHORT: { year: 'numeric', month: 'short', day: 'numeric' },
  MEDIUM: { year: 'numeric', month: 'long', day: 'numeric' },
  LONG: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  FULL: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
};

export const TIME_FORMATS = {
  SHORT: { hour: 'numeric', minute: 'numeric' },
  MEDIUM: { hour: '2-digit', minute: '2-digit' },
  LONG: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  FULL: { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }
};

// Number formats
export const NUMBER_FORMATS = {
  DECIMAL: { style: 'decimal' },
  CURRENCY: { style: 'currency' },
  PERCENT: { style: 'percent' },
  UNIT: { style: 'unit' }
};

// Currency codes
export const CURRENCY_CODES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' }
};

// Plural rules
export const PLURAL_RULES = {
  ZERO: 'zero',
  ONE: 'one',
  TWO: 'two',
  FEW: 'few',
  MANY: 'many',
  OTHER: 'other'
};

// Text directions
export const TEXT_DIRECTIONS = {
  LTR: 'ltr',
  RTL: 'rtl',
  AUTO: 'auto'
};

// Common translation keys
export const COMMON_TRANSLATIONS = {
  // Navigation
  HOME: 'home',
  ABOUT: 'about',
  CONTACT: 'contact',
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  
  // Actions
  SAVE: 'save',
  CANCEL: 'cancel',
  DELETE: 'delete',
  EDIT: 'edit',
  CREATE: 'create',
  UPDATE: 'update',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  
  // Status
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  
  // Forms
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  SUBMIT: 'submit',
  RESET: 'reset',
  
  // Time
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  TOMORROW: 'tomorrow',
  NOW: 'now',
  
  // Numbers
  THOUSAND: 'thousand',
  MILLION: 'million',
  BILLION: 'billion'
};

// Fallback languages
export const FALLBACK_LANGUAGES = {
  'es-ES': 'en-US',
  'fr-FR': 'en-US',
  'de-DE': 'en-US',
  'it-IT': 'en-US',
  'pt-BR': 'en-US',
  'ja-JP': 'en-US',
  'ko-KR': 'en-US',
  'zh-CN': 'en-US',
  'ru-RU': 'en-US',
  'ar-SA': 'en-US',
  'hi-IN': 'en-US'
};

// Translation loading strategies
export const LOADING_STRATEGIES = {
  LAZY: 'lazy',
  EAGER: 'eager',
  ON_DEMAND: 'on_demand'
};

// Cache strategies
export const CACHE_STRATEGIES = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  INDEXED_DB: 'indexedDB'
};

// Error messages
export const I18N_ERRORS = {
  TRANSLATION_NOT_FOUND: 'Translation not found',
  LANGUAGE_NOT_SUPPORTED: 'Language not supported',
  LOADING_FAILED: 'Translation loading failed',
  PARSING_ERROR: 'Translation parsing error',
  INVALID_KEY: 'Invalid translation key'
};
