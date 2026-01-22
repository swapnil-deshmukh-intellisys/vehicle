import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DateFormatter,
  DateParser,
  DateCalculator,
  dateUtils,
  dateFormatter,
  dateParser,
  dateCalculator
} from '../dateUtils';

// Mock Intl.DateTimeFormat and Intl.RelativeTimeFormat
const mockDateTimeFormat = jest.fn().mockImplementation((locale, options) => ({
  format: jest.fn(() => '1/1/2023')
}));

const mockRelativeTimeFormat = jest.fn().mockImplementation((locale, options) => ({
  format: jest.fn((value, unit) => `${value} ${unit} ago`)
}));

Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: mockDateTimeFormat,
    RelativeTimeFormat: mockRelativeTimeFormat
  },
  writable: true
});

describe('DateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('DateFormatter', () => {
    // P2P Tests - Should pass consistently
    test('should create date formatter with default locale', () => {
      const formatter = new DateFormatter();
      expect(formatter.locale).toBe('en-US');
      expect(formatter.formats).toHaveProperty('date');
      expect(formatter.formats).toHaveProperty('time');
      expect(formatter.formats).toHaveProperty('datetime');
    });

    test('should create date formatter with custom locale', () => {
      const formatter = new DateFormatter('fr-FR');
      expect(formatter.locale).toBe('fr-FR');
    });

    test('should format date with predefined format', () => {
      const formatter = new DateFormatter();
      const date = new Date('2023-01-01');
      
      const result = formatter.format(date, 'date');
      expect(mockDateTimeFormat).toHaveBeenCalledWith('en-US', formatter.formats.date);
      expect(typeof result).toBe('string');
    });

    test('should format date with custom pattern', () => {
      const formatter = new DateFormatter();
      const date = new Date('2023-01-01T12:30:45');
      
      const result = formatter.formatPattern(date, 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2023-01-01 12:30:45');
    });

    test('should set locale', () => {
      const formatter = new DateFormatter();
      formatter.setLocale('es-ES');
      expect(formatter.locale).toBe('es-ES');
    });

    // F2P Tests - Will fail before fix, pass after
    test('should format relative time correctly', () => {
      const formatter = new DateFormatter();
      const date = new Date();
      date.setHours(date.getHours() - 2); // 2 hours ago
      
      const result = formatter.formatRelative(date);
      expect(mockRelativeTimeFormat).toHaveBeenCalled();
      expect(typeof result).toBe('string');
    });

    test('should handle different relative time ranges', () => {
      const formatter = new DateFormatter();
      const baseDate = new Date('2023-01-01T12:00:00');
      
      // Test different time differences
      const pastDate = new Date('2023-01-01T10:00:00'); // 2 hours ago
      const futureDate = new Date('2023-01-01T14:00:00'); // 2 hours later
      const oldDate = new Date('2022-12-01'); // More than a week ago
      
      const pastResult = formatter.formatRelative(pastDate, baseDate);
      const futureResult = formatter.formatRelative(futureDate, baseDate);
      const oldResult = formatter.formatRelative(oldDate, baseDate);
      
      expect(typeof pastResult).toBe('string');
      expect(typeof futureResult).toBe('string');
      expect(typeof oldResult).toBe('string');
    });

    test('should handle custom format options', () => {
      const formatter = new DateFormatter();
      const date = new Date('2023-01-01');
      
      formatter.format(date, 'date', { locale: 'fr-FR' });
      expect(mockDateTimeFormat).toHaveBeenCalledWith('fr-FR', expect.any(Object));
    });
  });

  describe('DateParser', () => {
    // P2P Tests
    test('should create date parser', () => {
      const parser = new DateParser();
      expect(parser.formats).toBeInstanceOf(Array);
      expect(parser.formats.length).toBeGreaterThan(0);
    });

    test('should parse date objects', () => {
      const parser = new DateParser();
      const date = new Date('2023-01-01');
      
      const result = parser.parse(date);
      expect(result).toBe(date);
    });

    test('should parse valid date strings', () => {
      const parser = new DateParser();
      
      const result1 = parser.parse('2023-01-01');
      expect(result1).toBeInstanceOf(Date);
      expect(result1.getFullYear()).toBe(2023);
      
      const result2 = parser.parse('01/01/2023');
      expect(result2).toBeInstanceOf(Date);
    });

    test('should parse with flexible formats', () => {
      const parser = new DateParser();
      const formats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
      
      const result = parser.parseFlexible('2023-01-01', formats);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
    });

    // F2P Tests
    test('should handle invalid date strings', () => {
      const parser = new DateParser();
      
      const result = parser.parse('invalid-date');
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });

    test('should parse different date formats', () => {
      const parser = new DateParser();
      
      // ISO format
      const isoDate = parser.parse('2023-01-01T12:00:00Z');
      expect(isoDate.getFullYear()).toBe(2023);
      
      // US format
      const usDate = parser.parse('01/15/2023');
      expect(usDate.getMonth()).toBe(0); // January
      expect(usDate.getDate()).toBe(15);
      
      // European format
      const euDate = parser.parse('15.01.2023');
      expect(euDate.getMonth()).toBe(0); // January
      expect(euDate.getDate()).toBe(15);
    });

    test('should parse with custom patterns', () => {
      const parser = new DateParser();
      
      const result = parser.parseWithPattern('2023-01-15', 'YYYY-MM-DD');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
      
      const result2 = parser.parseWithPattern('01/15/2023', 'MM/DD/YYYY');
      expect(result2.getFullYear()).toBe(2023);
      expect(result2.getMonth()).toBe(0);
      expect(result2.getDate()).toBe(15);
    });

    test('should handle edge cases in parsing', () => {
      const parser = new DateParser();
      
      // Handle null/undefined
      expect(parser.parse(null)).toBeInstanceOf(Date);
      expect(parser.parse(undefined)).toBeInstanceOf(Date);
      
      // Handle numbers
      const timestamp = Date.parse('2023-01-01');
      const result = parser.parse(timestamp);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('DateCalculator', () => {
    // P2P Tests
    test('should create date calculator', () => {
      const calculator = new DateCalculator();
      expect(calculator).toBeInstanceOf(DateCalculator);
    });

    test('should add time to date', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-01');
      
      const result = calculator.add(date, 1, 'days');
      expect(result.getDate()).toBe(2);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
    });

    test('should subtract time from date', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-02');
      
      const result = calculator.subtract(date, 1, 'days');
      expect(result.getDate()).toBe(1);
    });

    test('should get difference between dates', () => {
      const calculator = new DateCalculator();
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');
      
      const result = calculator.diff(date1, date2, 'days');
      expect(result).toBe(1);
    });

    test('should check if date is in range', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-01');
      const startDate = new Date('2022-12-31');
      const endDate = new Date('2023-01-02');
      
      expect(calculator.isInRange(date, startDate, endDate)).toBe(true);
      expect(calculator.isInRange(new Date('2023-01-03'), startDate, endDate)).toBe(false);
    });

    // F2P Tests
    test('should handle different time units in add/subtract', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-01T12:00:00');
      
      // Add years
      const yearResult = calculator.add(date, 1, 'years');
      expect(yearResult.getFullYear()).toBe(2024);
      
      // Add months
      const monthResult = calculator.add(date, 2, 'months');
      expect(monthResult.getMonth()).toBe(2); // March
      
      // Add weeks
      const weekResult = calculator.add(date, 1, 'weeks');
      expect(weekResult.getDate()).toBe(8);
      
      // Add hours
      const hourResult = calculator.add(date, 5, 'hours');
      expect(hourResult.getHours()).toBe(17);
      
      // Add minutes
      const minuteResult = calculator.add(date, 30, 'minutes');
      expect(minuteResult.getMinutes()).toBe(30);
      
      // Add seconds
      const secondResult = calculator.add(date, 45, 'seconds');
      expect(secondResult.getSeconds()).toBe(45);
    });

    test('should handle different time units in diff', () => {
      const calculator = new DateCalculator();
      const date1 = new Date('2023-01-01T00:00:00');
      const date2 = new Date('2024-01-01T12:30:45');
      
      expect(calculator.diff(date1, date2, 'years')).toBe(1);
      expect(calculator.diff(date1, date2, 'months')).toBe(12);
      expect(calculator.diff(date1, date2, 'days')).toBe(365);
      expect(calculator.diff(date1, date2, 'hours')).toBeGreaterThan(8000);
      expect(calculator.diff(date1, date2, 'minutes')).toBeGreaterThan(500000);
      expect(calculator.diff(date1, date2, 'seconds')).toBeGreaterThan(30000000);
    });

    test('should get start of period', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-15T14:30:45');
      
      const startOfYear = calculator.startOf(date, 'year');
      expect(startOfYear.getMonth()).toBe(0);
      expect(startOfYear.getDate()).toBe(1);
      expect(startOfYear.getHours()).toBe(0);
      
      const startOfMonth = calculator.startOf(date, 'month');
      expect(startOfMonth.getDate()).toBe(1);
      expect(startOfMonth.getHours()).toBe(0);
      
      const startOfDay = calculator.startOf(date, 'day');
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      
      const startOfHour = calculator.startOf(date, 'hour');
      expect(startOfHour.getMinutes()).toBe(0);
      expect(startOfHour.getSeconds()).toBe(0);
    });

    test('should get end of period', () => {
      const calculator = new DateCalculator();
      const date = new Date('2023-01-15T14:30:45');
      
      const endOfYear = calculator.endOf(date, 'year');
      expect(endOfYear.getMonth()).toBe(11);
      expect(endOfYear.getDate()).toBe(31);
      expect(endOfYear.getHours()).toBe(23);
      
      const endOfMonth = calculator.endOf(date, 'month');
      expect(endOfMonth.getDate()).toBe(31); // January has 31 days
      expect(endOfMonth.getHours()).toBe(23);
      
      const endOfDay = calculator.endOf(date, 'day');
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      
      const endOfHour = calculator.endOf(date, 'hour');
      expect(endOfHour.getMinutes()).toBe(59);
      expect(endOfHour.getSeconds()).toBe(59);
    });
  });

  describe('dateUtils', () => {
    // P2P Tests
    test('should create formatter', () => {
      const formatter = dateUtils.createFormatter('fr-FR');
      expect(formatter).toBeInstanceOf(DateFormatter);
      expect(formatter.locale).toBe('fr-FR');
    });

    test('should create parser', () => {
      const parser = dateUtils.createParser();
      expect(parser).toBeInstanceOf(DateParser);
    });

    test('should create calculator', () => {
      const calculator = dateUtils.createCalculator();
      expect(calculator).toBeInstanceOf(DateCalculator);
    });

    test('should provide quick format functions', () => {
      const date = new Date('2023-01-01');
      
      expect(typeof dateUtils.format(date, 'date')).toBe('string');
      expect(typeof dateUtils.formatRelative(date)).toBe('string');
      expect(dateUtils.parse('2023-01-01')).toBeInstanceOf(Date);
    });

    test('should provide quick calculation functions', () => {
      const date = new Date('2023-01-01');
      
      const added = dateUtils.add(date, 1, 'days');
      expect(added).toBeInstanceOf(Date);
      expect(added.getDate()).toBe(2);
      
      const subtracted = dateUtils.subtract(date, 1, 'days');
      expect(subtracted).toBeInstanceOf(Date);
      expect(subtracted.getDate()).toBe(31); // December 31
      
      const diff = dateUtils.diff(date, added, 'days');
      expect(diff).toBe(1);
    });

    // F2P Tests
    test('should check date validity', () => {
      expect(dateUtils.isValid(new Date())).toBe(true);
      expect(dateUtils.isValid('2023-01-01')).toBe(true);
      expect(dateUtils.isValid('invalid-date')).toBe(false);
      expect(dateUtils.isValid(null)).toBe(false);
      expect(dateUtils.isValid(undefined)).toBe(false);
    });

    test('should check if date is today', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(dateUtils.isToday(today)).toBe(true);
      expect(dateUtils.isToday(yesterday)).toBe(false);
    });

    test('should check if dates are same', () => {
      const date1 = new Date('2023-01-01T12:00:00');
      const date2 = new Date('2023-01-01T18:30:00');
      const date3 = new Date('2023-01-02T12:00:00');
      
      expect(dateUtils.isSame(date1, date2, 'day')).toBe(true);
      expect(dateUtils.isSame(date1, date2, 'hour')).toBe(false);
      expect(dateUtils.isSame(date1, date3, 'day')).toBe(false);
      expect(dateUtils.isSame(date1, date2, 'month')).toBe(true);
      expect(dateUtils.isSame(date1, date2, 'year')).toBe(true);
    });

    test('should get timezone offset', () => {
      const offset = dateUtils.getTimezoneOffset();
      expect(typeof offset).toBe('number');
      expect(offset).toBeGreaterThanOrEqual(-720);
      expect(offset).toBeLessThanOrEqual(720);
    });

    test('should convert to and from UTC', () => {
      const localDate = new Date('2023-01-01T12:00:00');
      
      const utcDate = dateUtils.toUTC(localDate);
      expect(utcDate).toBeInstanceOf(Date);
      expect(utcDate.getTime()).not.toBe(localDate.getTime());
      
      const convertedBack = dateUtils.fromUTC(utcDate);
      expect(convertedBack).toBeInstanceOf(Date);
    });
  });

  describe('Global Instances', () => {
    // P2P Tests
    test('should provide global date formatter', () => {
      expect(dateFormatter).toBeInstanceOf(DateFormatter);
      expect(dateFormatter.locale).toBe('en-US');
    });

    test('should provide global date parser', () => {
      expect(dateParser).toBeInstanceOf(DateParser);
    });

    test('should provide global date calculator', () => {
      expect(dateCalculator).toBeInstanceOf(DateCalculator);
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete date workflow', () => {
      // Parse date string
      const parsed = dateUtils.parse('2023-01-15');
      expect(parsed).toBeInstanceOf(Date);
      
      // Format for display
      const formatted = dateUtils.format(parsed, 'datetime');
      expect(typeof formatted).toBe('string');
      
      // Calculate relative time
      const relative = dateUtils.formatRelative(parsed);
      expect(typeof relative).toBe('string');
      
      // Add time
      const future = dateUtils.add(parsed, 7, 'days');
      expect(future.getTime()).toBeGreaterThan(parsed.getTime());
      
      // Check if same month
      expect(dateUtils.isSame(parsed, future, 'month')).toBe(true);
      expect(dateUtils.isSame(parsed, future, 'day')).toBe(false);
      
      // Get difference
      const diff = dateUtils.diff(parsed, future, 'days');
      expect(diff).toBe(7);
      
      // Get start of month
      const startOfMonth = dateCalculator.startOf(parsed, 'month');
      expect(startOfMonth.getDate()).toBe(1);
    });
  });
});
