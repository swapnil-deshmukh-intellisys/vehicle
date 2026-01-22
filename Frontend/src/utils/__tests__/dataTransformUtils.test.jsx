import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DataTransformer,
  DataParser,
  DataFormatter,
  dataConversionUtils,
  dataTransformer,
  dataParser,
  dataFormatter
} from '../dataTransformUtils';

describe('DataTransformUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DataTransformer', () => {
    // P2P Tests - Should pass consistently
    test('should create transformer with default transformers', () => {
      const transformer = new DataTransformer();
      const availableTransformers = transformer.getTransformers();
      
      expect(availableTransformers).toContain('uppercase');
      expect(availableTransformers).toContain('lowercase');
      expect(availableTransformers).toContain('capitalize');
      expect(availableTransformers).toContain('trim');
      expect(availableTransformers).toContain('round');
      expect(availableTransformers).toContain('floor');
      expect(availableTransformers).toContain('ceil');
      expect(availableTransformers).toContain('date');
      expect(availableTransformers).toContain('unique');
      expect(availableTransformers).toContain('sort');
    });

    test('should register custom transformer', () => {
      const transformer = new DataTransformer();
      const customTransformer = (value) => value * 2;
      
      transformer.register('double', customTransformer);
      
      expect(transformer.getTransformers()).toContain('double');
      expect(transformer.transform(5, 'double')).toBe(10);
    });

    test('should transform single value', () => {
      const transformer = new DataTransformer();
      
      expect(transformer.transform('hello', 'uppercase')).toBe('HELLO');
      expect(transformer.transform('WORLD', 'lowercase')).toBe('world');
      expect(transformer.transform('john', 'capitalize')).toBe('John');
      expect(transformer.transform('  test  ', 'trim')).toBe('test');
    });

    // F2P Tests - Will fail before fix, pass after
    test('should handle number transformations correctly', () => {
      const transformer = new DataTransformer();
      
      // F2P: These should work correctly
      expect(transformer.transform(3.7, 'round')).toBe(4);
      expect(transformer.transform(3.7, 'floor')).toBe(3);
      expect(transformer.transform(3.2, 'ceil')).toBe(4);
      
      // F2P: Should handle edge cases
      expect(transformer.transform(NaN, 'round')).toBeNaN();
      expect(transformer.transform(null, 'round')).toBe(null);
    });

    test('should transform object with multiple transformers', () => {
      const transformer = new DataTransformer();
      const obj = {
        name: 'john doe',
        email: 'JOHN@EXAMPLE.COM',
        age: 25.7
      };
      
      const result = transformer.transformObject(obj, {
        name: 'capitalize',
        email: 'lowercase',
        age: 'round'
      });
      
      expect(result).toEqual({
        name: 'John doe',
        email: 'john@example.com',
        age: 26
      });
    });

    test('should transform array of objects', () => {
      const transformer = new DataTransformer();
      const arr = [
        { name: 'john', score: 85.5 },
        { name: 'jane', score: 92.3 }
      ];
      
      const result = transformer.transformArray(arr, {
        name: 'capitalize',
        score: 'round'
      });
      
      expect(result).toEqual([
        { name: 'John', score: 86 },
        { name: 'Jane', score: 92 }
      ]);
    });

    test('should handle array transformations', () => {
      const transformer = new DataTransformer();
      
      // F2P: Array transformations should work
      expect(transformer.transform([1, 2, 2, 3, 3, 3], 'unique')).toEqual([1, 2, 3]);
      expect(transformer.transform([3, 1, 2], 'sort')).toEqual([1, 2, 3]);
      expect(transformer.transform([], 'unique')).toEqual([]);
    });
  });

  describe('DataParser', () => {
    // P2P Tests
    test('should create parser with default parsers', () => {
      const parser = new DataParser();
      const availableParsers = parser.getParsers();
      
      expect(availableParsers).toContain('json');
      expect(availableParsers).toContain('number');
      expect(availableParsers).toContain('integer');
      expect(availableParsers).toContain('boolean');
      expect(availableParsers).toContain('date');
    });

    test('should register custom parser', () => {
      const parser = new DataParser();
      const customParser = (value) => value.toUpperCase();
      
      parser.register('upper', customParser);
      
      expect(parser.getParsers()).toContain('upper');
      expect(parser.parse('hello', 'upper')).toBe('HELLO');
    });

    test('should parse JSON correctly', () => {
      const parser = new DataParser();
      
      expect(parser.parse('{"name": "John"}', 'json')).toEqual({ name: 'John' });
      expect(parser.parse({ name: 'John' }, 'json')).toEqual({ name: 'John' });
    });

    // F2P Tests
    test('should parse numbers correctly', () => {
      const parser = new DataParser();
      
      // F2P: Number parsing should handle various inputs
      expect(parser.parse('123.45', 'number')).toBe(123.45);
      expect(parser.parse('123', 'number')).toBe(123);
      expect(parser.parse('invalid', 'number')).toBe(null);
      expect(parser.parse(123.45, 'number')).toBe(123.45);
    });

    test('should parse integers correctly', () => {
      const parser = new DataParser();
      
      expect(parser.parse('123.45', 'integer')).toBe(123);
      expect(parser.parse('123', 'integer')).toBe(123);
      expect(parser.parse('invalid', 'integer')).toBe(null);
      expect(parser.parse(123.45, 'integer')).toBe(123);
    });

    test('should parse booleans correctly', () => {
      const parser = new DataParser();
      
      expect(parser.parse('true', 'boolean')).toBe(true);
      expect(parser.parse('false', 'boolean')).toBe(false);
      expect(parser.parse('TRUE', 'boolean')).toBe(true);
      expect(parser.parse(true, 'boolean')).toBe(true);
      expect(parser.parse(1, 'boolean')).toBe(true);
      expect(parser.parse(0, 'boolean')).toBe(false);
    });

    test('should parse dates correctly', () => {
      const parser = new DataParser();
      
      const date1 = parser.parse('2023-01-01', 'date');
      expect(date1).toBeInstanceOf(Date);
      expect(date1.getFullYear()).toBe(2023);
      
      const date2 = parser.parse(new Date('2023-01-01'), 'date');
      expect(date2).toBeInstanceOf(Date);
      
      expect(parser.parse('invalid', 'date')).toBe(null);
    });
  });

  describe('DataFormatter', () => {
    // P2P Tests
    test('should create formatter with default formatters', () => {
      const formatter = new DataFormatter();
      const availableFormatters = formatter.getFormatters();
      
      expect(availableFormatters).toContain('currency');
      expect(availableFormatters).toContain('percentage');
      expect(availableFormatters).toContain('decimal');
      expect(availableFormatters).toContain('date');
      expect(availableFormatters).toContain('time');
      expect(availableFormatters).toContain('datetime');
      expect(availableFormatters).toContain('truncate');
      expect(availableFormatters).toContain('phone');
    });

    test('should register custom formatter', () => {
      const formatter = new DataFormatter();
      const customFormatter = (value) => `Custom: ${value}`;
      
      formatter.register('custom', customFormatter);
      
      expect(formatter.getFormatters()).toContain('custom');
      expect(formatter.format('test', 'custom')).toBe('Custom: test');
    });

    // F2P Tests
    test('should format currency correctly', () => {
      const formatter = new DataFormatter();
      
      expect(formatter.format(1234.56, 'currency')).toBe('$1,234.56');
      expect(formatter.format(1234.56, 'currency', { currency: 'EUR', locale: 'de-DE' }))
        .toMatch(/1\.234,56.*€/);
    });

    test('should format percentage correctly', () => {
      const formatter = new DataFormatter();
      
      expect(formatter.format(0.75, 'percentage')).toBe('75%');
      expect(formatter.format(1.5, 'percentage')).toBe('150%');
    });

    test('should format decimal numbers correctly', () => {
      const formatter = new DataFormatter();
      
      expect(formatter.format(1234.567, 'decimal')).toBe('1,234.57');
      expect(formatter.format(1234.567, 'decimal', { decimals: 3 })).toBe('1,234.567');
    });

    test('should format dates correctly', () => {
      const formatter = new DataFormatter();
      const date = new Date('2023-01-01T12:00:00');
      
      expect(formatter.format(date, 'date')).toMatch(/1\/1\/2023/);
      expect(formatter.format(date, 'time')).toMatch(/12:00/);
      expect(formatter.format(date, 'datetime')).toMatch(/1\/1\/2023.*12:00/);
    });

    test('should truncate text correctly', () => {
      const formatter = new DataFormatter();
      
      expect(formatter.format('This is a long text', 'truncate')).toBe('This is a long text');
      expect(formatter.format('This is a very long text that should be truncated', 'truncate', { length: 20 }))
        .toBe('This is a very lo...');
      expect(formatter.format('Short', 'truncate', { length: 10 })).toBe('Short');
    });

    test('should format phone numbers correctly', () => {
      const formatter = new DataFormatter();
      
      expect(formatter.format('1234567890', 'phone')).toBe('(123) 456-7890');
      expect(formatter.format('1234567890', 'phone', { country: 'US' })).toBe('(123) 456-7890');
      expect(formatter.format('12345678', 'phone')).toBe('12345678'); // Not 10 digits
    });
  });

  describe('dataConversionUtils', () => {
    // P2P Tests
    test('should convert object to query string', () => {
      const obj = { name: 'John', age: 30, city: 'New York' };
      const queryString = dataConversionUtils.toQueryString(obj);
      
      expect(queryString).toBe('name=John&age=30&city=New+York');
    });

    test('should convert query string to object', () => {
      const queryString = 'name=John&age=30&city=New+York';
      const obj = dataConversionUtils.fromQueryString(queryString);
      
      expect(obj).toEqual({ name: 'John', age: '30', city: 'New York' });
    });

    test('should convert array to object with key', () => {
      const arr = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];
      
      const obj = dataConversionUtils.arrayToObject(arr, 'id');
      expect(obj).toEqual({
        1: { id: 1, name: 'John' },
        2: { id: 2, name: 'Jane' }
      });
    });

    // F2P Tests
    test('should deep clone objects correctly', () => {
      const original = {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York'
        },
        hobbies: ['reading', 'swimming']
      };
      
      const cloned = dataConversionUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.address).not.toBe(original.address);
      expect(cloned.hobbies).not.toBe(original.hobbies);
      
      // Modify clone shouldn't affect original
      cloned.address.city = 'Boston';
      expect(original.address.city).toBe('New York');
    });

    test('should merge objects deeply', () => {
      const target = {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York'
        }
      };
      
      const source = {
        age: 30,
        address: {
          city: 'Boston',
          state: 'MA'
        }
      };
      
      const merged = dataConversionUtils.mergeDeep(target, source);
      
      expect(merged).toEqual({
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA'
        }
      });
    });

    test('should handle edge cases in conversion', () => {
      // F2P: Handle null/undefined
      expect(dataConversionUtils.toQueryString({})).toBe('');
      expect(dataConversionUtils.fromQueryString('')).toEqual({});
      
      // F2P: Handle empty array
      expect(dataConversionUtils.arrayToObject([], 'id')).toEqual({});
      
      // F2P: Handle primitive values
      expect(dataConversionUtils.deepClone(null)).toBe(null);
      expect(dataConversionUtils.deepClone(123)).toBe(123);
      expect(dataConversionUtils.deepClone('string')).toBe('string');
    });
  });

  describe('Global Instances', () => {
    // P2P Tests
    test('should provide global transformer instance', () => {
      expect(dataTransformer).toBeInstanceOf(DataTransformer);
      expect(dataTransformer.transform('hello', 'uppercase')).toBe('HELLO');
    });

    test('should provide global parser instance', () => {
      expect(dataParser).toBeInstanceOf(DataParser);
      expect(dataParser.parse('123', 'number')).toBe(123);
    });

    test('should provide global formatter instance', () => {
      expect(dataFormatter).toBeInstanceOf(DataFormatter);
      expect(dataFormatter.format(0.75, 'percentage')).toBe('75%');
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete data transformation workflow', () => {
      const rawData = [
        { name: 'john doe', email: 'JOHN@EXAMPLE.COM', score: 85.5, active: 'true' },
        { name: 'jane smith', email: 'JANE@EXAMPLE.COM', score: 92.3, active: 'false' }
      ];
      
      // Transform data
      const transformed = dataTransformer.transformArray(rawData, {
        name: 'capitalize',
        email: 'lowercase',
        score: 'round'
      });
      
      expect(transformed).toEqual([
        { name: 'John doe', email: 'john@example.com', score: 86, active: 'true' },
        { name: 'Jane smith', email: 'jane@example.com', score: 92, active: 'false' }
      ]);
      
      // Parse data types
      const parsed = dataParser.parseObject(transformed[0], {
        score: 'number',
        active: 'boolean'
      });
      
      expect(parsed).toEqual({
        name: 'John doe',
        email: 'john@example.com',
        score: 86,
        active: true
      });
      
      // Format for display
      const formatted = {
        name: parsed.name,
        email: parsed.email,
        score: dataFormatter.format(parsed.score, 'decimal'),
        active: parsed.active ? 'Yes' : 'No'
      };
      
      expect(formatted).toEqual({
        name: 'John doe',
        email: 'john@example.com',
        score: '86.00',
        active: 'Yes'
      });
    });
  });
});
