import React from 'react';
import { render, screen } from '@testing-library/react';

// String Utilities
export class StringUtils {
  // Capitalize first letter
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Convert to camel case
  static toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  // Convert to snake case
  static toSnakeCase(str) {
    return str.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  // Convert to kebab case
  static toKebabCase(str) {
    return str.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }

  // Convert to title case
  static toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  // Truncate string
  static truncate(str, length, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  // Pad string
  static pad(str, length, padString = ' ', padType = 'right') {
    str = str.toString();
    if (str.length >= length) return str;
    
    const padLength = length - str.length;
    const padding = padString.repeat(Math.ceil(padLength / padString.length)).slice(0, padLength);
    
    switch (padType) {
      case 'left':
        return padding + str;
      case 'both':
        const leftPad = padding.slice(0, Math.ceil(padding.length / 2));
        const rightPad = padding.slice(Math.ceil(padding.length / 2));
        return leftPad + str + rightPad;
      default:
        return str + padding;
    }
  }

  // Remove extra whitespace
  static normalizeWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  // Escape HTML
  static escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Unescape HTML
  static unescapeHtml(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  }

  // Generate slug
  static slug(str) {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Count words
  static wordCount(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
  }

  // Count characters (excluding spaces)
  static charCount(str, includeSpaces = false) {
    if (!str) return 0;
    return includeSpaces ? str.length : str.replace(/\s/g, '').length;
  }

  // Reverse string
  static reverse(str) {
    return str.split('').reverse().join('');
  }

  // Check if string contains substring
  static contains(str, substring, caseSensitive = true) {
    if (!caseSensitive) {
      str = str.toLowerCase();
      substring = substring.toLowerCase();
    }
    return str.includes(substring);
  }

  // Check if string starts with substring
  static startsWith(str, substring, caseSensitive = true) {
    if (!caseSensitive) {
      str = str.toLowerCase();
      substring = substring.toLowerCase();
    }
    return str.startsWith(substring);
  }

  // Check if string ends with substring
  static endsWith(str, substring, caseSensitive = true) {
    if (!caseSensitive) {
      str = str.toLowerCase();
      substring = substring.toLowerCase();
    }
    return str.endsWith(substring);
  }

  // Extract numbers from string
  static extractNumbers(str) {
    const matches = str.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  }

  // Remove numbers from string
  static removeNumbers(str) {
    return str.replace(/\d+/g, '');
  }

  // Generate random string
  static random(length, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate UUID
  static uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Calculate similarity between two strings (Levenshtein distance)
  static similarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        const cost = str1.charAt(j - 1) === str2.charAt(i - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i][j - 1] + 1,     // deletion
          matrix[i - 1][j] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
  }
}

// Advanced String Utilities
export class AdvancedStringUtils {
  // Format template string with variables
  static template(str, variables) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return variables.hasOwnProperty(key) ? variables[key] : match;
    });
  }

  // Extract URLs from string
  static extractUrls(str) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return str.match(urlRegex) || [];
  }

  // Extract emails from string
  static extractEmails(str) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return str.match(emailRegex) || [];
  }

  // Highlight search terms
  static highlight(str, searchTerm, className = 'highlight') {
    if (!searchTerm) return str;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return str.replace(regex, `<span class="${className}">$1</span>`);
  }

  // Mask sensitive data
  static mask(str, options = {}) {
    const {
      maskChar = '*',
      unmaskedStart = 0,
      unmaskedEnd = 0,
      unmaskedChars = []
    } = options;
    
    if (str.length <= unmaskedStart + unmaskedEnd) {
      return str;
    }
    
    let result = '';
    for (let i = 0; i < str.length; i++) {
      if (i < unmaskedStart || i >= str.length - unmaskedEnd || unmaskedChars.includes(i)) {
        result += str[i];
      } else {
        result += maskChar;
      }
    }
    
    return result;
  }

  // Pluralize words
  static pluralize(count, word, suffix = 's') {
    return count === 1 ? word : word + suffix;
  }

  // Convert bytes to human readable string
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

describe('StringUtils', () => {
  describe('Basic String Operations', () => {
    // P2P Tests
    test('should capitalize strings', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
      expect(StringUtils.capitalize('HELLO')).toBe('Hello');
      expect(StringUtils.capitalize('hELLO WORLD')).toBe('Hello world');
      expect(StringUtils.capitalize('')).toBe('');
      expect(StringUtils.capitalize(null)).toBe('');
    });

    test('should convert case formats', () => {
      expect(StringUtils.toCamelCase('hello world')).toBe('helloWorld');
      expect(StringUtils.toCamelCase('Hello World')).toBe('helloWorld');
      expect(StringUtils.toSnakeCase('helloWorld')).toBe('hello_world');
      expect(StringUtils.toSnakeCase('Hello World')).toBe('hello_world');
      expect(StringUtils.toKebabCase('helloWorld')).toBe('hello-world');
      expect(StringUtils.toKebabCase('Hello World')).toBe('hello-world');
      expect(StringUtils.toTitleCase('hello world')).toBe('Hello World');
    });

    test('should truncate strings', () => {
      expect(StringUtils.truncate('Hello World', 5)).toBe('He...');
      expect(StringUtils.truncate('Hello World', 8)).toBe('Hello W...');
      expect(StringUtils.truncate('Hello', 10)).toBe('Hello');
      expect(StringUtils.truncate('', 5)).toBe('');
    });

    test('should pad strings', () => {
      expect(StringUtils.pad('test', 8)).toBe('test    ');
      expect(StringUtils.pad('test', 8, '0', 'left')).toBe('0000test');
      expect(StringUtils.pad('test', 8, '0', 'both')).toBe('00test00');
      expect(StringUtils.pad('test', 2)).toBe('test');
    });

    // F2P Tests
    test('should normalize whitespace', () => {
      expect(StringUtils.normalizeWhitespace('  hello   world  ')).toBe('hello world');
      expect(StringUtils.normalizeWhitespace('multiple   spaces')).toBe('multiple spaces');
      expect(StringUtils.normalizeWhitespace('\t\n  test  \n')).toBe('test');
    });

    test('should escape and unescape HTML', () => {
      expect(StringUtils.escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(StringUtils.unescapeHtml('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'))
        .toBe('<script>alert("xss")</script>');
    });

    test('should generate slugs', () => {
      expect(StringUtils.slug('Hello World!')).toBe('hello-world');
      expect(StringUtils.slug('This is a test---string')).toBe('this-is-a-test-string');
      expect(StringUtils.slug('Multiple   spaces   here')).toBe('multiple-spaces-here');
      expect(StringUtils.slug('')).toBe('');
    });
  });

  describe('String Analysis', () => {
    // P2P Tests
    test('should count words', () => {
      expect(StringUtils.wordCount('Hello world')).toBe(2);
      expect(StringUtils.wordCount('  Hello   world  ')).toBe(2);
      expect(StringUtils.wordCount('')).toBe(0);
      expect(StringUtils.wordCount(null)).toBe(0);
    });

    test('should count characters', () => {
      expect(StringUtils.charCount('Hello world')).toBe(10);
      expect(StringUtils.charCount('Hello world', true)).toBe(11);
      expect(StringUtils.charCount('  Hello   world  ')).toBe(10);
      expect(StringUtils.charCount('')).toBe(0);
    });

    test('should check string containment', () => {
      expect(StringUtils.contains('Hello World', 'World')).toBe(true);
      expect(StringUtils.contains('Hello World', 'world')).toBe(false);
      expect(StringUtils.contains('Hello World', 'world', false)).toBe(true);
      expect(StringUtils.contains('', 'test')).toBe(false);
    });

    test('should check string start/end', () => {
      expect(StringUtils.startsWith('Hello World', 'Hello')).toBe(true);
      expect(StringUtils.startsWith('Hello World', 'hello')).toBe(false);
      expect(StringUtils.startsWith('Hello World', 'hello', false)).toBe(true);
      
      expect(StringUtils.endsWith('Hello World', 'World')).toBe(true);
      expect(StringUtils.endsWith('Hello World', 'world')).toBe(false);
      expect(StringUtils.endsWith('Hello World', 'world', false)).toBe(true);
    });

    // F2P Tests
    test('should extract and remove numbers', () => {
      expect(StringUtils.extractNumbers('abc123def456')).toEqual([123, 456]);
      expect(StringUtils.extractNumbers('no numbers here')).toEqual([]);
      expect(StringUtils.extractNumbers('')).toEqual([]);
      
      expect(StringUtils.removeNumbers('abc123def456')).toBe('abcdef');
      expect(StringUtils.removeNumbers('no numbers')).toBe('no numbers');
    });

    test('should reverse strings', () => {
      expect(StringUtils.reverse('hello')).toBe('olleh');
      expect(StringUtils.reverse('Hello World')).toBe('dlroW olleH');
      expect(StringUtils.reverse('')).toBe('');
    });
  });

  describe('String Generation', () => {
    // P2P Tests
    test('should generate random strings', () => {
      const random1 = StringUtils.random(10);
      const random2 = StringUtils.random(10);
      
      expect(random1).toHaveLength(10);
      expect(random2).toHaveLength(10);
      expect(random1).not.toBe(random2);
      
      const randomWithCustomChars = StringUtils.random(5, 'ABC');
      expect(randomWithCustomChars).toHaveLength(5);
      expect(/^[ABC]+$/.test(randomWithCustomChars)).toBe(true);
    });

    test('should generate UUIDs', () => {
      const uuid1 = StringUtils.uuid();
      const uuid2 = StringUtils.uuid();
      
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid1).not.toBe(uuid2);
    });

    // F2P Tests
    test('should calculate string similarity', () => {
      expect(StringUtils.similarity('hello', 'hello')).toBe(100);
      expect(StringUtils.similarity('hello', 'hell')).toBeCloseTo(80, 0);
      expect(StringUtils.similarity('hello', 'world')).toBeLessThan(50);
      expect(StringUtils.similarity('', '')).toBe(100);
      expect(StringUtils.similarity('test', '')).toBe(0);
    });
  });
});

describe('AdvancedStringUtils', () => {
  describe('Template and Extraction', () => {
    // P2P Tests
    test('should format templates', () => {
      const template = 'Hello {name}, you have {count} messages';
      const variables = { name: 'John', count: 5 };
      
      expect(AdvancedStringUtils.template(template, variables))
        .toBe('Hello John, you have 5 messages');
      
      expect(AdvancedStringUtils.template('Missing {var}', {}))
        .toBe('Missing {var}');
    });

    test('should extract URLs', () => {
      const text = 'Visit https://example.com and http://test.org for more info';
      const urls = AdvancedStringUtils.extractUrls(text);
      
      expect(urls).toEqual(['https://example.com', 'http://test.org']);
      expect(AdvancedStringUtils.extractUrls('no urls here')).toEqual([]);
    });

    test('should extract emails', () => {
      const text = 'Contact john@example.com or jane@test.org';
      const emails = AdvancedStringUtils.extractEmails(text);
      
      expect(emails).toEqual(['john@example.com', 'jane@test.org']);
      expect(AdvancedStringUtils.extractEmails('no emails')).toEqual([]);
    });

    // F2P Tests
    test('should highlight search terms', () => {
      const text = 'This is a test string';
      const highlighted = AdvancedStringUtils.highlight(text, 'test');
      
      expect(highlighted).toBe('<span class="highlight">test</span>');
      expect(AdvancedStringUtils.highlight(text, 'notfound')).toBe(text);
      expect(AdvancedStringUtils.highlight(text, '')).toBe(text);
    });

    test('should mask sensitive data', () => {
      expect(AdvancedStringUtils.mask('1234567890', { unmaskedStart: 2, unmaskedEnd: 4 }))
        .toBe('12****7890');
      
      expect(AdvancedStringUtils.mask('password', { maskChar: 'x' }))
        .toBe('xxxxxxx');
      
      expect(AdvancedStringUtils.mask('123456', { unmaskedChars: [0, 5] }))
        .toBe('1****6');
    });

    test('should pluralize words', () => {
      expect(AdvancedStringUtils.pluralize(1, 'cat')).toBe('cat');
      expect(AdvancedStringUtils.pluralize(2, 'cat')).toBe('cats');
      expect(AdvancedStringUtils.pluralize(0, 'cat')).toBe('cats');
      expect(AdvancedStringUtils.pluralize(5, 'person', 'ren')).toBe('personren');
    });
  });

  describe('Edge Cases', () => {
    // F2P Tests
    test('should handle edge cases', () => {
      // Handle null/undefined
      expect(StringUtils.capitalize(null)).toBe('');
      expect(StringUtils.capitalize(undefined)).toBe('');
      expect(StringUtils.wordCount(null)).toBe(0);
      expect(StringUtils.charCount(null)).toBe(0);
      
      // Handle empty strings
      expect(StringUtils.reverse('')).toBe('');
      expect(StringUtils.truncate('', 5)).toBe('');
      expect(StringUtils.similarity('', '')).toBe(100);
      
      // Handle very long strings
      const longString = 'a'.repeat(1000);
      expect(StringUtils.truncate(longString, 10)).toHaveLength(10);
    });

    test('should handle special characters', () => {
      expect(StringUtils.slug('Hello @#$% World!')).toBe('hello-world');
      expect(StringUtils.extractNumbers('abc123!@#456def')).toEqual([123, 456]);
      expect(StringUtils.normalizeWhitespace('hello\t\n\rworld')).toBe('hello world');
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complex string processing workflow', () => {
      const input = '  John.Doe@example.com visited https://example.com  ';
      
      // Normalize and extract
      const normalized = StringUtils.normalizeWhitespace(input);
      const emails = AdvancedStringUtils.extractEmails(normalized);
      const urls = AdvancedStringUtils.extractUrls(normalized);
      
      expect(normalized).toBe('John.Doe@example.com visited https://example.com');
      expect(emails).toEqual(['John.Doe@example.com']);
      expect(urls).toEqual(['https://example.com']);
      
      // Transform and format
      const username = emails[0].split('@')[0];
      const formatted = AdvancedStringUtils.template(
        'User {username} visited {url}',
        { username, url: urls[0] }
      );
      
      expect(formatted).toBe('User John.Doe visited https://example.com');
      
      // Generate summary
      const wordCount = StringUtils.wordCount(formatted);
      const charCount = StringUtils.charCount(formatted);
      const summary = AdvancedStringUtils.pluralize(wordCount, 'word') + 
                     ' and ' + AdvancedStringUtils.pluralize(charCount, 'character');
      
      expect(summary).toBe('7 words and 41 characters');
    });
  });
});
