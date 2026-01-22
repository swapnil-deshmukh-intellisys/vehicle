import React from 'react';
import { render, screen } from '@testing-library/react';

// Math Utilities
export class MathUtils {
  // Round number to specified decimal places
  static round(number, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  }

  // Clamp number between min and max
  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  // Map number from one range to another
  static map(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  // Linear interpolation
  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Check if number is in range
  static inRange(number, min, max) {
    return number >= min && number <= max;
  }

  // Generate random number in range
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Generate random integer in range
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Calculate percentage
  static percentage(value, total) {
    return total === 0 ? 0 : (value / total) * 100;
  }

  // Calculate average of array
  static average(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  // Find sum of array
  static sum(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0);
  }

  // Find min in array
  static min(numbers) {
    if (!numbers || numbers.length === 0) return Infinity;
    return Math.min(...numbers);
  }

  // Find max in array
  static max(numbers) {
    if (!numbers || numbers.length === 0) return -Infinity;
    return Math.max(...numbers);
  }

  // Calculate standard deviation
  static standardDeviation(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    
    const mean = this.average(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    const avgSquaredDiff = this.average(squaredDiffs);
    
    return Math.sqrt(avgSquaredDiff);
  }

  // Format number with commas
  static formatNumber(number, options = {}) {
    const { decimals = 0, separator = ',', prefix = '', suffix = '' } = options;
    
    const rounded = this.round(number, decimals);
    const parts = rounded.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    return prefix + parts.join('.') + suffix;
  }

  // Convert bytes to human readable format
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  // Convert degrees to radians
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Convert radians to degrees
  static toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  // Normalize angle to 0-360 range
  static normalizeAngle(angle) {
    angle = angle % 360;
    return angle < 0 ? angle + 360 : angle;
  }
}

// Advanced Math Utilities
export class AdvancedMathUtils {
  // Fibonacci sequence generator
  static fibonacci(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  // Greatest common divisor
  static gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  // Least common multiple
  static lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  // Check if number is prime
  static isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  // Generate prime factors
  static primeFactors(n) {
    const factors = [];
    let divisor = 2;
    
    while (n >= 2) {
      if (n % divisor === 0) {
        factors.push(divisor);
        n = n / divisor;
      } else {
        divisor++;
      }
    }
    
    return factors;
  }

  // Calculate factorial
  static factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // Calculate combinations (n choose k)
  static combinations(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
  }

  // Calculate permutations (nPk)
  static permutations(n, k) {
    if (k > n) return 0;
    if (k === 0) return 1;
    
    return this.factorial(n) / this.factorial(n - k);
  }
}

describe('MathUtils', () => {
  describe('Basic Math Operations', () => {
    // P2P Tests
    test('should round numbers correctly', () => {
      expect(MathUtils.round(3.14159, 2)).toBe(3.14);
      expect(MathUtils.round(3.14159, 0)).toBe(3);
      expect(MathUtils.round(3.5, 0)).toBe(4);
      expect(MathUtils.round(3.5)).toBe(4);
    });

    test('should clamp numbers within range', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });

    test('should map numbers between ranges', () => {
      expect(MathUtils.map(5, 0, 10, 0, 100)).toBe(50);
      expect(MathUtils.map(0, 0, 10, 100, 200)).toBe(100);
      expect(MathUtils.map(10, 0, 10, 0, 100)).toBe(100);
    });

    test('should perform linear interpolation', () => {
      expect(MathUtils.lerp(0, 100, 0.5)).toBe(50);
      expect(MathUtils.lerp(10, 20, 0.5)).toBe(15);
      expect(MathUtils.lerp(0, 100, 0)).toBe(0);
      expect(MathUtils.lerp(0, 100, 1)).toBe(100);
    });

    test('should check if number is in range', () => {
      expect(MathUtils.inRange(5, 0, 10)).toBe(true);
      expect(MathUtils.inRange(0, 0, 10)).toBe(true);
      expect(MathUtils.inRange(10, 0, 10)).toBe(true);
      expect(MathUtils.inRange(-1, 0, 10)).toBe(false);
      expect(MathUtils.inRange(11, 0, 10)).toBe(false);
    });

    // F2P Tests
    test('should generate random numbers', () => {
      const random = MathUtils.random(0, 10);
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThanOrEqual(10);

      const randomInt = MathUtils.randomInt(1, 10);
      expect(randomInt).toBeGreaterThanOrEqual(1);
      expect(randomInt).toBeLessThanOrEqual(10);
      expect(Number.isInteger(randomInt)).toBe(true);
    });

    test('should calculate percentage', () => {
      expect(MathUtils.percentage(25, 100)).toBe(25);
      expect(MathUtils.percentage(50, 200)).toBe(25);
      expect(MathUtils.percentage(0, 100)).toBe(0);
      expect(MathUtils.percentage(100, 0)).toBe(0); // Avoid division by zero
    });
  });

  describe('Array Operations', () => {
    // P2P Tests
    test('should calculate average', () => {
      expect(MathUtils.average([1, 2, 3, 4, 5])).toBe(3);
      expect(MathUtils.average([10, 20, 30])).toBe(20);
      expect(MathUtils.average([])).toBe(0);
      expect(MathUtils.average(null)).toBe(0);
    });

    test('should calculate sum', () => {
      expect(MathUtils.sum([1, 2, 3, 4, 5])).toBe(15);
      expect(MathUtils.sum([10, 20, 30])).toBe(60);
      expect(MathUtils.sum([])).toBe(0);
      expect(MathUtils.sum(null)).toBe(0);
    });

    test('should find min and max', () => {
      expect(MathUtils.min([1, 2, 3, 4, 5])).toBe(1);
      expect(MathUtils.max([1, 2, 3, 4, 5])).toBe(5);
      expect(MathUtils.min([])).toBe(Infinity);
      expect(MathUtils.max([])).toBe(-Infinity);
    });

    // F2P Tests
    test('should calculate standard deviation', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const stdDev = MathUtils.standardDeviation(data);
      expect(stdDev).toBeCloseTo(2, 1);
      
      expect(MathUtils.standardDeviation([])).toBe(0);
      expect(MathUtils.standardDeviation(null)).toBe(0);
    });
  });

  describe('Formatting Utilities', () => {
    // P2P Tests
    test('should format numbers with options', () => {
      expect(MathUtils.formatNumber(1234.567, { decimals: 2 })).toBe('1,234.57');
      expect(MathUtils.formatNumber(1234.567, { decimals: 0 })).toBe('1,235');
      expect(MathUtils.formatNumber(1234, { separator: ' ' })).toBe('1 234');
      expect(MathUtils.formatNumber(1234, { prefix: '$' })).toBe('$1,234');
      expect(MathUtils.formatNumber(1234, { suffix: ' USD' })).toBe('1,234 USD');
    });

    test('should format bytes', () => {
      expect(MathUtils.formatBytes(0)).toBe('0 Bytes');
      expect(MathUtils.formatBytes(1024)).toBe('1 KB');
      expect(MathUtils.formatBytes(1048576)).toBe('1 MB');
      expect(MathUtils.formatBytes(1073741824)).toBe('1 GB');
      expect(MathUtils.formatBytes(123456789, 2)).toBe('117.74 MB');
    });
  });

  describe('Geometry Utilities', () => {
    // P2P Tests
    test('should calculate distance between points', () => {
      expect(MathUtils.distance(0, 0, 3, 4)).toBe(5);
      expect(MathUtils.distance(1, 1, 4, 5)).toBeCloseTo(5, 1);
    });

    test('should convert between degrees and radians', () => {
      expect(MathUtils.toRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(MathUtils.toRadians(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(MathUtils.toDegrees(Math.PI)).toBeCloseTo(180, 5);
      expect(MathUtils.toDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
    });

    // F2P Tests
    test('should normalize angles', () => {
      expect(MathUtils.normalizeAngle(0)).toBe(0);
      expect(MathUtils.normalizeAngle(360)).toBe(0);
      expect(MathUtils.normalizeAngle(450)).toBe(90);
      expect(MathUtils.normalizeAngle(-90)).toBe(270);
      expect(MathUtils.normalizeAngle(-450)).toBe(270);
    });
  });
});

describe('AdvancedMathUtils', () => {
  describe('Number Theory', () => {
    // P2P Tests
    test('should generate Fibonacci sequence', () => {
      expect(AdvancedMathUtils.fibonacci(0)).toBe(0);
      expect(AdvancedMathUtils.fibonacci(1)).toBe(1);
      expect(AdvancedMathUtils.fibonacci(5)).toBe(5);
      expect(AdvancedMathUtils.fibonacci(10)).toBe(55);
    });

    test('should calculate GCD', () => {
      expect(AdvancedMathUtils.gcd(48, 18)).toBe(6);
      expect(AdvancedMathUtils.gcd(17, 23)).toBe(1);
      expect(AdvancedMathUtils.gcd(0, 5)).toBe(5);
      expect(AdvancedMathUtils.gcd(-12, 18)).toBe(6);
    });

    test('should calculate LCM', () => {
      expect(AdvancedMathUtils.lcm(4, 6)).toBe(12);
      expect(AdvancedMathUtils.lcm(5, 7)).toBe(35);
      expect(AdvancedMathUtils.lcm(3, 6)).toBe(6);
    });

    // F2P Tests
    test('should check for prime numbers', () => {
      expect(AdvancedMathUtils.isPrime(2)).toBe(true);
      expect(AdvancedMathUtils.isPrime(3)).toBe(true);
      expect(AdvancedMathUtils.isPrime(5)).toBe(true);
      expect(AdvancedMathUtils.isPrime(7)).toBe(true);
      expect(AdvancedMathUtils.isPrime(11)).toBe(true);
      
      expect(AdvancedMathUtils.isPrime(1)).toBe(false);
      expect(AdvancedMathUtils.isPrime(4)).toBe(false);
      expect(AdvancedMathUtils.isPrime(9)).toBe(false);
      expect(AdvancedMathUtils.isPrime(15)).toBe(false);
    });

    test('should generate prime factors', () => {
      expect(AdvancedMathUtils.primeFactors(12)).toEqual([2, 2, 3]);
      expect(AdvancedMathUtils.primeFactors(17)).toEqual([17]);
      expect(AdvancedMathUtils.primeFactors(100)).toEqual([2, 2, 5, 5]);
      expect(AdvancedMathUtils.primeFactors(1)).toEqual([]);
    });

    test('should calculate factorial', () => {
      expect(AdvancedMathUtils.factorial(0)).toBe(1);
      expect(AdvancedMathUtils.factorial(1)).toBe(1);
      expect(AdvancedMathUtils.factorial(5)).toBe(120);
      expect(AdvancedMathUtils.factorial(6)).toBe(720);
      expect(AdvancedMathUtils.factorial(-1)).toBeNaN();
    });

    test('should calculate combinations and permutations', () => {
      expect(AdvancedMathUtils.combinations(5, 2)).toBe(10);
      expect(AdvancedMathUtils.combinations(10, 3)).toBe(120);
      expect(AdvancedMathUtils.combinations(5, 0)).toBe(1);
      expect(AdvancedMathUtils.combinations(5, 5)).toBe(1);
      
      expect(AdvancedMathUtils.permutations(5, 2)).toBe(20);
      expect(AdvancedMathUtils.permutations(5, 0)).toBe(1);
      expect(AdvancedMathUtils.permutations(5, 5)).toBe(120);
    });
  });

  describe('Edge Cases', () => {
    // F2P Tests
    test('should handle edge cases in calculations', () => {
      // Handle empty arrays
      expect(MathUtils.average([])).toBe(0);
      expect(MathUtils.sum([])).toBe(0);
      expect(MathUtils.standardDeviation([])).toBe(0);
      
      // Handle null/undefined
      expect(MathUtils.average(null)).toBe(0);
      expect(MathUtils.sum(null)).toBe(0);
      
      // Handle division by zero
      expect(MathUtils.percentage(50, 0)).toBe(0);
      
      // Handle negative numbers in factorial
      expect(AdvancedMathUtils.factorial(-5)).toBeNaN();
    });

    test('should handle large numbers', () => {
      expect(MathUtils.formatNumber(1234567890)).toBe('1,234,567,890');
      expect(MathUtils.formatBytes(1099511627776)).toBe('1 TB');
      
      // Large Fibonacci
      expect(AdvancedMathUtils.fibonacci(20)).toBe(6765);
      
      // Large factorial
      expect(AdvancedMathUtils.factorial(10)).toBe(3628800);
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complex mathematical workflow', () => {
      // Generate random data
      const data = Array.from({ length: 100 }, () => MathUtils.randomInt(1, 100));
      
      // Calculate statistics
      const mean = MathUtils.average(data);
      const stdDev = MathUtils.standardDeviation(data);
      const min = MathUtils.min(data);
      const max = MathUtils.max(data);
      
      expect(mean).toBeGreaterThan(0);
      expect(mean).toBeLessThan(100);
      expect(stdDev).toBeGreaterThan(0);
      expect(min).toBeGreaterThanOrEqual(1);
      expect(max).toBeLessThanOrEqual(100);
      
      // Format results
      const formattedMean = MathUtils.formatNumber(mean, { decimals: 2 });
      const formattedStdDev = MathUtils.formatNumber(stdDev, { decimals: 2 });
      
      expect(typeof formattedMean).toBe('string');
      expect(typeof formattedStdDev).toBe('string');
      
      // Calculate some advanced math
      const combination = AdvancedMathUtils.combinations(10, 3);
      const fibonacci = AdvancedMathUtils.fibonacci(10);
      const isPrime = AdvancedMathUtils.isPrime(mean);
      
      expect(combination).toBe(120);
      expect(fibonacci).toBe(55);
      expect(typeof isPrime).toBe('boolean');
    });
  });
});
