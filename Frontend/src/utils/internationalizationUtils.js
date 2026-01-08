// Comprehensive internationalization utility functions

// Language detection and management
export const detectUserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const shortLang = browserLang.split('-')[0];
  
  // Common language mappings
  const languageMap = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ru': 'ru-RU',
    'ar': 'ar-SA',
    'hi': 'hi-IN'
  };
  
  return languageMap[shortLang] || browserLang || 'en-US';
};

export const setLanguage = (language) => {
  try {
    localStorage.setItem('preferred-language', language);
    document.documentElement.lang = language;
    return true;
  } catch (error) {
    console.error('Failed to set language:', error);
    return false;
  }
};

export const getStoredLanguage = () => {
  try {
    return localStorage.getItem('preferred-language') || detectUserLanguage();
  } catch {
    return detectUserLanguage();
  }
};

// Translation management
export class TranslationManager {
  constructor(defaultLanguage = 'en-US') {
    this.currentLanguage = getStoredLanguage() || defaultLanguage;
    this.translations = new Map();
    this.fallbackLanguage = 'en-US';
    this.pluralRules = new Map();
    this.loadedLanguages = new Set();
  }

  // Add translations for a language
  addTranslations(language, translations) {
    if (!this.translations.has(language)) {
      this.translations.set(language, new Map());
    }
    
    const langMap = this.translations.get(language);
    Object.keys(translations).forEach(key => {
      langMap.set(key, translations[key]);
    });
    
    this.loadedLanguages.add(language);
  }

  // Get translation for a key
  translate(key, options = {}) {
    const { language = this.currentLanguage, count, defaultValue, variables = {} } = options;
    
    let translation = this.getTranslation(key, language);
    
    // Handle pluralization
    if (count !== undefined && typeof translation === 'object') {
      translation = this.getPluralTranslation(translation, count, language);
    }
    
    // Use fallback if translation not found
    if (!translation && language !== this.fallbackLanguage) {
      translation = this.getTranslation(key, this.fallbackLanguage);
    }
    
    // Use default value if still not found
    if (!translation && defaultValue) {
      translation = defaultValue;
    }
    
    // Replace variables
    if (translation && typeof translation === 'string') {
      translation = this.replaceVariables(translation, variables);
    }
    
    return translation || key;
  }

  // Get translation for specific language
  getTranslation(key, language) {
    const langMap = this.translations.get(language);
    return langMap ? langMap.get(key) : null;
  }

  // Handle pluralization
  getPluralTranslation(translations, count, language) {
    const pluralRule = this.getPluralRule(count, language);
    return translations[pluralRule] || translations.other || translations.one;
  }

  // Get plural rule for count and language
  getPluralRule(count, language) {
    // Simplified plural rules - in production, use Intl.PluralRules
    const rules = {
      'en-US': (n) => n === 1 ? 'one' : 'other',
      'es-ES': (n) => n === 1 ? 'one' : 'other',
      'fr-FR': (n) => n === 0 || n === 1 ? 'one' : 'other',
      'de-DE': (n) => n === 1 ? 'one' : 'other',
      'ru-RU': (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return 'one';
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'few';
        return 'many';
      },
      'ar-SA': (n) => {
        if (n === 0) return 'zero';
        if (n === 1) return 'one';
        if (n === 2) return 'two';
        if (n % 100 >= 3 && n % 100 <= 10) return 'few';
        if (n % 100 >= 11 && n % 100 <= 99) return 'many';
        return 'other';
      }
    };
    
    const rule = rules[language] || rules['en-US'];
    return rule(count);
  }

  // Replace variables in translation
  replaceVariables(translation, variables) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  // Change current language
  setLanguage(language) {
    this.currentLanguage = language;
    setLanguage(language);
    this.notifyLanguageChange(language);
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get available languages
  getAvailableLanguages() {
    return Array.from(this.loadedLanguages);
  }

  // Check if language is loaded
  isLanguageLoaded(language) {
    return this.loadedLanguages.has(language);
  }

  // Load translations from file or API
  async loadTranslations(language, source) {
    try {
      let translations;
      
      if (typeof source === 'string') {
        // Load from URL
        const response = await fetch(source);
        translations = await response.json();
      } else if (typeof source === 'function') {
        // Load from function
        translations = await source(language);
      } else {
        // Use provided translations
        translations = source;
      }
      
      this.addTranslations(language, translations);
      return true;
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
      return false;
    }
  }

  // Notify listeners of language change
  notifyLanguageChange(language) {
    if (this.onLanguageChange) {
      this.onLanguageChange(language);
    }
  }

  // Set language change callback
  onLanguageChange(callback) {
    this.onLanguageChange = callback;
  }
}

// Create global translation manager
export const translationManager = new TranslationManager();

// Date and time formatting
export const formatDate = (date, options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  try {
    return new Intl.DateTimeFormat(lang, { ...defaultOptions, ...options }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const formatTime = (date, options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(lang, { ...defaultOptions, ...options }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
};

export const formatDateTime = (date, options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(lang, { ...defaultOptions, ...options }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

export const formatRelativeTime = (date, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = (date - now) / 1000;
    
    const intervals = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];
    
    for (const interval of intervals) {
      const value = Math.abs(Math.round(diffInSeconds / interval.seconds));
      if (value >= 1) {
        return rtf.format(diffInSeconds < 0 ? -value : value, interval.unit);
      }
    }
    
    return rtf.format(0, 'second');
  } catch {
    return date.toLocaleString();
  }
};

// Number formatting
export const formatNumber = (number, options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  
  try {
    return new Intl.NumberFormat(lang, options).format(number);
  } catch {
    return number.toString();
  }
};

export const formatCurrency = (amount, currency = 'USD', options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const defaultOptions = {
    style: 'currency',
    currency
  };
  
  try {
    return new Intl.NumberFormat(lang, { ...defaultOptions, ...options }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export const formatPercent = (number, options = {}, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const defaultOptions = {
    style: 'percent'
  };
  
  try {
    return new Intl.NumberFormat(lang, { ...defaultOptions, ...options }).format(number);
  } catch {
    return `${(number * 100).toFixed(1)}%`;
  }
};

// Text direction
export const getTextDirection = (language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi'];
  const shortLang = lang.split('-')[0];
  
  return rtlLanguages.includes(shortLang) ? 'rtl' : 'ltr';
};

export const setTextDirection = (language = null) => {
  const direction = getTextDirection(language);
  document.documentElement.dir = direction;
  document.documentElement.setAttribute('data-direction', direction);
  
  return direction;
};

// Pluralization helper
export const pluralize = (count, singular, plural, language = null) => {
  const lang = language || translationManager.getCurrentLanguage();
  const rule = translationManager.getPluralRule(count, lang);
  
  if (rule === 'one') {
    return singular;
  }
  
  return plural || singular + 's';
};

// Translation function
export const t = (key, options = {}) => {
  return translationManager.translate(key, options);
};

// Language switcher component helper
export const createLanguageSwitcher = (availableLanguages, currentLanguage, onLanguageChange) => {
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Select language');
  
  availableLanguages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    option.selected = lang.code === currentLanguage;
    
    if (lang.flag) {
      option.setAttribute('data-flag', lang.flag);
    }
    
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    onLanguageChange(e.target.value);
  });
  
  return select;
};

// Load translations dynamically
export const loadTranslations = async (language, translationsUrl) => {
  return await translationManager.loadTranslations(language, translationsUrl);
};

// Initialize internationalization
export const initializeI18n = async (config = {}) => {
  const {
    defaultLanguage = 'en-US',
    translations = {},
    autoDetect = true,
    onLanguageChange = null
  } = config;
  
  // Set default language
  if (autoDetect) {
    const detectedLanguage = detectUserLanguage();
    translationManager.setLanguage(detectedLanguage);
  } else {
    translationManager.setLanguage(defaultLanguage);
  }
  
  // Add provided translations
  Object.keys(translations).forEach(lang => {
    translationManager.addTranslations(lang, translations[lang]);
  });
  
  // Set language change callback
  if (onLanguageChange) {
    translationManager.onLanguageChange = onLanguageChange;
  }
  
  // Set text direction
  setTextDirection();
  
  return translationManager;
};
