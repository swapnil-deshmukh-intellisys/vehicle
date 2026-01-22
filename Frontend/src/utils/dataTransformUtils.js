// Comprehensive data transformation utilities

// Data Transformer Class
export class DataTransformer {
  constructor() {
    this.transformers = new Map();
    this.setupDefaultTransformers();
  }

  // Setup default transformers
  setupDefaultTransformers() {
    // String transformers
    this.transformers.set('uppercase', (value) => 
      typeof value === 'string' ? value.toUpperCase() : value
    );
    
    this.transformers.set('lowercase', (value) => 
      typeof value === 'string' ? value.toLowerCase() : value
    );
    
    this.transformers.set('capitalize', (value) => 
      typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value
    );
    
    this.transformers.set('trim', (value) => 
      typeof value === 'string' ? value.trim() : value
    );

    // Number transformers
    this.transformers.set('round', (value) => 
      typeof value === 'number' ? Math.round(value) : value
    );
    
    this.transformers.set('floor', (value) => 
      typeof value === 'number' ? Math.floor(value) : value
    );
    
    this.transformers.set('ceil', (value) => 
      typeof value === 'number' ? Math.ceil(value) : value
    );

    // Date transformers
    this.transformers.set('date', (value) => {
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
      }
      return value;
    });

    // Array transformers
    this.transformers.set('unique', (value) => 
      Array.isArray(value) ? [...new Set(value)] : value
    );
    
    this.transformers.set('sort', (value) => 
      Array.isArray(value) ? [...value].sort() : value
    );
  }

  // Register custom transformer
  register(name, transformer) {
    this.transformers.set(name, transformer);
  }

  // Transform single value
  transform(value, transformerName) {
    const transformer = this.transformers.get(transformerName);
    if (!transformer) {
      throw new Error(`Unknown transformer: ${transformerName}`);
    }
    return transformer(value);
  }

  // Transform object with multiple transformers
  transformObject(obj, transformers) {
    const result = { ...obj };
    
    for (const [field, transformerName] of Object.entries(transformers)) {
      if (Object.prototype.hasOwnProperty.call(result, field)) {
        result[field] = this.transform(result[field], transformerName);
      }
    }
    
    return result;
  }

  // Transform array of objects
  transformArray(arr, transformers) {
    return arr.map(item => this.transformObject(item, transformers));
  }

  // Get available transformers
  getTransformers() {
    return Array.from(this.transformers.keys());
  }
}

// Data Parser Class
export class DataParser {
  constructor() {
    this.parsers = new Map();
    this.setupDefaultParsers();
  }

  // Setup default parsers
  setupDefaultParsers() {
    this.parsers.set('json', (value) => {
      if (typeof value === 'object') return value;
      return JSON.parse(value);
    });
    
    this.parsers.set('number', (value) => {
      if (typeof value === 'number') return value;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    });
    
    this.parsers.set('integer', (value) => {
      if (typeof value === 'number') return Math.floor(value);
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    });
    
    this.parsers.set('boolean', (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    });
    
    this.parsers.set('date', (value) => {
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    });
  }

  // Register custom parser
  register(name, parser) {
    this.parsers.set(name, parser);
  }

  // Parse value
  parse(value, parserName) {
    const parser = this.parsers.get(parserName);
    if (!parser) {
      throw new Error(`Unknown parser: ${parserName}`);
    }
    return parser(value);
  }

  // Parse object with field parsers
  parseObject(obj, parsers) {
    const result = { ...obj };
    
    for (const [field, parserName] of Object.entries(parsers)) {
      if (Object.prototype.hasOwnProperty.call(result, field)) {
        result[field] = this.parse(result[field], parserName);
      }
    }
    
    return result;
  }

  // Get available parsers
  getParsers() {
    return Array.from(this.parsers.keys());
  }
}

// Data Formatter Class
export class DataFormatter {
  constructor() {
    this.formatters = new Map();
    this.setupDefaultFormatters();
  }

  // Setup default formatters
  setupDefaultFormatters() {
    // Number formatters
    this.formatters.set('currency', (value, options = {}) => {
      const { currency = 'USD', locale = 'en-US' } = options;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(value);
    });
    
    this.formatters.set('percentage', (value, options = {}) => {
      const { locale = 'en-US' } = options;
      return new Intl.NumberFormat(locale, {
        style: 'percent'
      }).format(value);
    });
    
    this.formatters.set('decimal', (value, options = {}) => {
      const { decimals = 2, locale = 'en-US' } = options;
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    });

    // Date formatters
    this.formatters.set('date', (value, options = {}) => {
      const { format = 'short', locale = 'en-US' } = options;
      const date = value instanceof Date ? value : new Date(value);
      
      const formats = {
        short: { dateStyle: 'short' },
        medium: { dateStyle: 'medium' },
        long: { dateStyle: 'long' },
        full: { dateStyle: 'full' }
      };
      
      return new Intl.DateTimeFormat(locale, formats[format]).format(date);
    });
    
    this.formatters.set('time', (value, options = {}) => {
      const { format = 'short', locale = 'en-US' } = options;
      const date = value instanceof Date ? value : new Date(value);
      
      const formats = {
        short: { timeStyle: 'short' },
        medium: { timeStyle: 'medium' },
        long: { timeStyle: 'long' }
      };
      
      return new Intl.DateTimeFormat(locale, formats[format]).format(date);
    });
    
    this.formatters.set('datetime', (value, options = {}) => {
      const { format = 'medium', locale = 'en-US' } = options;
      const date = value instanceof Date ? value : new Date(value);
      
      const formats = {
        short: { dateStyle: 'short', timeStyle: 'short' },
        medium: { dateStyle: 'medium', timeStyle: 'short' },
        long: { dateStyle: 'long', timeStyle: 'medium' },
        full: { dateStyle: 'full', timeStyle: 'long' }
      };
      
      return new Intl.DateTimeFormat(locale, formats[format]).format(date);
    });

    // String formatters
    this.formatters.set('truncate', (value, options = {}) => {
      const { length = 50, suffix = '...' } = options;
      if (typeof value !== 'string') return value;
      return value.length > length ? value.substring(0, length) + suffix : value;
    });
    
    this.formatters.set('phone', (value, options = {}) => {
      const { country = 'US' } = options;
      const phone = value.toString().replace(/\D/g, '');
      
      if (country === 'US' && phone.length === 10) {
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
      }
      
      return value;
    });
  }

  // Register custom formatter
  register(name, formatter) {
    this.formatters.set(name, formatter);
  }

  // Format value
  format(value, formatterName, options = {}) {
    const formatter = this.formatters.get(formatterName);
    if (!formatter) {
      throw new Error(`Unknown formatter: ${formatterName}`);
    }
    return formatter(value, options);
  }

  // Get available formatters
  getFormatters() {
    return Array.from(this.formatters.keys());
  }
}

// Data Conversion Utilities
export const dataConversionUtils = {
  // Convert object to query string
  toQueryString(obj) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    }
    
    return params.toString();
  },

  // Convert query string to object
  fromQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = {};
    
    for (const [key, value] of params.entries()) {
      obj[key] = value;
    }
    
    return obj;
  },

  // Convert array to object with key
  arrayToObject(array, keyField) {
    return array.reduce((obj, item) => {
      obj[item[keyField]] = item;
      return obj;
    }, {});
  },

  // Convert object to array
  objectToArray(obj) {
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value
    }));
  },

  // Deep clone object
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  },

  // Merge objects
  mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeDeep(target, ...sources);
  },

  // Check if value is object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
};

// Create global instances
export const dataTransformer = new DataTransformer();
export const dataParser = new DataParser();
export const dataFormatter = new DataFormatter();

// Export default
export default {
  DataTransformer,
  DataParser,
  DataFormatter,
  dataConversionUtils,
  dataTransformer,
  dataParser,
  dataFormatter
};
