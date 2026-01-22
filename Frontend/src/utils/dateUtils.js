// Comprehensive date and time utilities

// Date Formatter Class
export class DateFormatter {
  constructor(locale = 'en-US') {
    this.locale = locale;
    this.formats = {
      date: { dateStyle: 'medium' },
      time: { timeStyle: 'short' },
      datetime: { dateStyle: 'medium', timeStyle: 'short' },
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' }
    };
  }

  // Format date with predefined format
  format(date, formatName = 'date', options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const config = { ...this.formats[formatName], ...options };
    
    return new Intl.DateTimeFormat(this.locale, config).format(dateObj);
  }

  // Format date with custom pattern
  formatPattern(date, pattern) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const patterns = {
      'YYYY': dateObj.getFullYear(),
      'YY': dateObj.getFullYear().toString().slice(-2),
      'MM': (dateObj.getMonth() + 1).toString().padStart(2, '0'),
      'M': dateObj.getMonth() + 1,
      'DD': dateObj.getDate().toString().padStart(2, '0'),
      'D': dateObj.getDate(),
      'HH': dateObj.getHours().toString().padStart(2, '0'),
      'H': dateObj.getHours(),
      'mm': dateObj.getMinutes().toString().padStart(2, '0'),
      'm': dateObj.getMinutes(),
      'ss': dateObj.getSeconds().toString().padStart(2, '0'),
      's': dateObj.getSeconds()
    };
    
    let result = pattern;
    Object.entries(patterns).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value);
    });
    
    return result;
  }

  // Format relative time
  formatRelative(date, baseDate = new Date()) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const baseObj = baseDate instanceof Date ? baseDate : new Date(baseDate);
    
    const diffMs = dateObj.getTime() - baseObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
    
    if (Math.abs(diffDays) > 7) {
      return this.format(dateObj);
    } else if (Math.abs(diffDays) > 0) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffHours) > 0) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffMinutes) > 0) {
      return rtf.format(diffMinutes, 'minute');
    } else {
      return rtf.format(diffSeconds, 'second');
    }
  }

  // Set locale
  setLocale(locale) {
    this.locale = locale;
  }
}

// Date Parser Class
export class DateParser {
  constructor() {
    this.formats = [
      // ISO formats
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      /^\d{4}-\d{2}-\d{2}$/,
      // US formats
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      // European formats
      /^\d{1,2}\.\d{1,2}\.\d{4}$/,
      /^\d{4}\.\d{1,2}\.\d{1,2}$/
    ];
  }

  // Parse date string
  parse(dateString) {
    if (dateString instanceof Date) {
      return dateString;
    }
    
    if (typeof dateString !== 'string') {
      return new Date(dateString);
    }
    
    // Try native Date parsing first
    const nativeDate = new Date(dateString);
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate;
    }
    
    // Try custom formats
    for (const format of this.formats) {
      const match = dateString.match(format);
      if (match) {
        return this.parseWithFormat(dateString, format);
      }
    }
    
    return new Date(dateString);
  }

  // Parse with specific format
  parseWithFormat(dateString, format) {
    const parts = dateString.split(/[-/T:.]/);
    
    // ISO format: YYYY-MM-DD
    if (format.source.includes('\\d{4}-\\d{2}-\\d{2}')) {
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    }
    
    // US format: MM/DD/YYYY
    if (format.source.includes('\\d{1,2}\\/\\d{1,2}\\/\\d{4}')) {
      return new Date(
        parseInt(parts[2]),
        parseInt(parts[0]) - 1,
        parseInt(parts[1])
      );
    }
    
    // European format: DD.MM.YYYY
    if (format.source.includes('\\d{1,2}\\.\\d{1,2}\\.\\d{4}')) {
      return new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    }
    
    return new Date(dateString);
  }

  // Try to parse with multiple formats
  parseFlexible(dateString, formats = []) {
    const customFormats = formats.length > 0 ? formats : [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'DD.MM.YYYY'
    ];
    
    for (const format of customFormats) {
      const date = this.parseWithPattern(dateString, format);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return this.parse(dateString);
  }

  // Parse with pattern
  parseWithPattern(dateString, pattern) {
    const patternMap = {
      'YYYY': { length: 4, isYear: true },
      'MM': { length: 2, isMonth: true },
      'DD': { length: 2, isDay: true },
      'M': { length: 1, isMonth: true },
      'D': { length: 1, isDay: true }
    };
    
    let year = new Date().getFullYear();
    let month = 0;
    let day = 1;
    let index = 0;
    
    for (const part of pattern.split(/[-/.\s]/)) {
      if (patternMap[part]) {
        const config = patternMap[part];
        const value = dateString.substr(index, config.length);
        
        if (config.isYear) {
          year = parseInt(value);
        } else if (config.isMonth) {
          month = parseInt(value) - 1;
        } else if (config.isDay) {
          day = parseInt(value);
        }
        
        index += config.length;
        
        // Skip separator
        if (index < dateString.length) {
          index++;
        }
      }
    }
    
    return new Date(year, month, day);
  }
}

// Date Calculator Class
export class DateCalculator {
  // Add time to date
  add(date, amount, unit) {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    
    switch (unit) {
      case 'years':
        dateObj.setFullYear(dateObj.getFullYear() + amount);
        break;
      case 'months':
        dateObj.setMonth(dateObj.getMonth() + amount);
        break;
      case 'weeks':
        dateObj.setDate(dateObj.getDate() + (amount * 7));
        break;
      case 'days':
        dateObj.setDate(dateObj.getDate() + amount);
        break;
      case 'hours':
        dateObj.setHours(dateObj.getHours() + amount);
        break;
      case 'minutes':
        dateObj.setMinutes(dateObj.getMinutes() + amount);
        break;
      case 'seconds':
        dateObj.setSeconds(dateObj.getSeconds() + amount);
        break;
      case 'milliseconds':
        dateObj.setMilliseconds(dateObj.getMilliseconds() + amount);
        break;
    }
    
    return dateObj;
  }

  // Subtract time from date
  subtract(date, amount, unit) {
    return this.add(date, -amount, unit);
  }

  // Get difference between dates
  diff(date1, date2, unit = 'milliseconds') {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    const diffMs = d2.getTime() - d1.getTime();
    
    switch (unit) {
      case 'years':
        return d2.getFullYear() - d1.getFullYear();
      case 'months':
        return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
      case 'weeks':
        return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      case 'days':
        return Math.floor(diffMs / (24 * 60 * 60 * 1000));
      case 'hours':
        return Math.floor(diffMs / (60 * 60 * 1000));
      case 'minutes':
        return Math.floor(diffMs / (60 * 1000));
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'milliseconds':
      default:
        return diffMs;
    }
  }

  // Check if date is in range
  isInRange(date, startDate, endDate) {
    const d = date instanceof Date ? date : new Date(date);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    return d >= start && d <= end;
  }

  // Get start of period
  startOf(date, unit) {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    
    switch (unit) {
      case 'year':
        dateObj.setMonth(0, 1);
        dateObj.setHours(0, 0, 0, 0);
        break;
      case 'month':
        dateObj.setDate(1);
        dateObj.setHours(0, 0, 0, 0);
        break;
      case 'week': {
        const day = dateObj.getDay();
        dateObj.setDate(dateObj.getDate() - day);
        dateObj.setHours(0, 0, 0, 0);
        break;
      }
      case 'day':
        dateObj.setHours(0, 0, 0, 0);
        break;
      case 'hour':
        dateObj.setMinutes(0, 0, 0);
        break;
      case 'minute':
        dateObj.setSeconds(0, 0);
        break;
      case 'second':
        dateObj.setMilliseconds(0);
        break;
    }
    
    return dateObj;
  }

  // Get end of period
  endOf(date, unit) {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    
    switch (unit) {
      case 'year':
        dateObj.setMonth(11, 31);
        dateObj.setHours(23, 59, 59, 999);
        break;
      case 'month':
        dateObj.setMonth(dateObj.getMonth() + 1, 0);
        dateObj.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const day = dateObj.getDay();
        dateObj.setDate(dateObj.getDate() + (6 - day));
        dateObj.setHours(23, 59, 59, 999);
        break;
      }
      case 'day':
        dateObj.setHours(23, 59, 59, 999);
        break;
      case 'hour':
        dateObj.setMinutes(59, 59, 999);
        break;
      case 'minute':
        dateObj.setSeconds(59, 999);
        break;
      case 'second':
        dateObj.setMilliseconds(999);
        break;
    }
    
    return dateObj;
  }
}

// Date Utilities
export const dateUtils = {
  // Create formatter
  createFormatter(locale) {
    return new DateFormatter(locale);
  },

  // Create parser
  createParser() {
    return new DateParser();
  },

  // Create calculator
  createCalculator() {
    return new DateCalculator();
  },

  // Quick format functions
  format: (date, format = 'date', locale = 'en-US') => {
    return new DateFormatter(locale).format(date, format);
  },

  formatRelative: (date, baseDate, locale = 'en-US') => {
    return new DateFormatter(locale).formatRelative(date, baseDate);
  },

  parse: (dateString) => {
    return new DateParser().parse(dateString);
  },

  add: (date, amount, unit) => {
    return new DateCalculator().add(date, amount, unit);
  },

  subtract: (date, amount, unit) => {
    return new DateCalculator().subtract(date, amount, unit);
  },

  diff: (date1, date2, unit) => {
    return new DateCalculator().diff(date1, date2, unit);
  },

  // Check if date is valid
  isValid(date) {
    const d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime());
  },

  // Check if date is today
  isToday(date) {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  },

  // Check if date is same as another
  isSame(date1, date2, unit = 'day') {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    switch (unit) {
      case 'year':
        return d1.getFullYear() === d2.getFullYear();
      case 'month':
        return d1.getFullYear() === d2.getFullYear() && 
               d1.getMonth() === d2.getMonth();
      case 'day':
        return d1.toDateString() === d2.toDateString();
      case 'hour':
        return d1.getFullYear() === d2.getFullYear() && 
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate() &&
               d1.getHours() === d2.getHours();
      default:
        return d1.getTime() === d2.getTime();
    }
  },

  // Get timezone offset
  getTimezoneOffset(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return d.getTimezoneOffset();
  },

  // Convert to UTC
  toUTC(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
  },

  // Convert from UTC
  fromUTC(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
  }
};

// Create global instances
export const dateFormatter = new DateFormatter();
export const dateParser = new DateParser();
export const dateCalculator = new DateCalculator();

// Export default
export default {
  DateFormatter,
  DateParser,
  DateCalculator,
  dateUtils,
  dateFormatter,
  dateParser,
  dateCalculator
};
