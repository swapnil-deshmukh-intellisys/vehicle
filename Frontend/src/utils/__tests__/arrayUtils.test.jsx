import React from 'react';
import { render, screen } from '@testing-library/react';

// Array Utilities
export class ArrayUtils {
  // Check if array contains item
  static contains(array, item) {
    return array.includes(item);
  }

  // Remove duplicates from array
  static unique(array) {
    return [...new Set(array)];
  }

  // Get unique items by key
  static uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  // Chunk array into smaller arrays
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Flatten nested arrays
  static flatten(array) {
    return array.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
  }

  // Shuffle array
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get random item from array
  static random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Get random sample from array
  static sample(array, count) {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  // Group array by key
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }

  // Sort array by key
  static sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter array by condition
  static filter(array, predicate) {
    return array.filter(predicate);
  }

  // Find item in array
  static find(array, predicate) {
    return array.find(predicate);
  }

  // Check if all items pass condition
  static every(array, predicate) {
    return array.every(predicate);
  }

  // Check if any item passes condition
  static some(array, predicate) {
    return array.some(predicate);
  }

  // Map array and filter falsy values
  static compact(array) {
    return array.filter(Boolean);
  }

  // Get difference between arrays
  static difference(array1, array2) {
    return array1.filter(item => !array2.includes(item));
  }

  // Get intersection of arrays
  static intersection(array1, array2) {
    return array1.filter(item => array2.includes(item));
  }

  // Get union of arrays
  static union(array1, array2) {
    return this.unique([...array1, ...array2]);
  }

  // Partition array into two arrays based on condition
  static partition(array, predicate) {
    const truthy = [];
    const falsy = [];
    
    array.forEach(item => {
      if (predicate(item)) {
        truthy.push(item);
      } else {
        falsy.push(item);
      }
    });
    
    return [truthy, falsy];
  }

  // Get first n items
  static first(array, n = 1) {
    return n === 1 ? array[0] : array.slice(0, n);
  }

  // Get last n items
  static last(array, n = 1) {
    return n === 1 ? array[array.length - 1] : array.slice(-n);
  }

  // Get nth item
  static nth(array, index) {
    return index >= 0 ? array[index] : array[array.length + index];
  }

  // Remove item at index
  static removeAt(array, index) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
  }

  // Insert item at index
  static insertAt(array, index, item) {
    return [...array.slice(0, index), item, ...array.slice(index)];
  }

  // Move item from one index to another
  static move(array, fromIndex, toIndex) {
    const item = array[fromIndex];
    const newArray = this.removeAt(array, fromIndex);
    return this.insertAt(newArray, toIndex, item);
  }

  // Sum array of numbers
  static sum(array) {
    return array.reduce((sum, num) => sum + num, 0);
  }

  // Get average of array of numbers
  static average(array) {
    return array.length === 0 ? 0 : this.sum(array) / array.length;
  }

  // Get min value
  static min(array) {
    return Math.min(...array);
  }

  // Get max value
  static max(array) {
    return Math.max(...array);
  }

  // Get range (min to max)
  static range(array) {
    return this.min(array) + ' to ' + this.max(array);
  }
}

// Advanced Array Utilities
export class AdvancedArrayUtils {
  // Deep flatten nested arrays
  static deepFlatten(array) {
    const result = [];
    
    const flatten = (arr) => {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flatten(item);
        } else {
          result.push(item);
        }
      }
    };
    
    flatten(array);
    return result;
  }

  // Paginate array
  static paginate(array, page = 1, pageSize = 10) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = array.slice(startIndex, endIndex);
    
    return {
      items,
      page,
      pageSize,
      totalItems: array.length,
      totalPages: Math.ceil(array.length / pageSize),
      hasNextPage: endIndex < array.length,
      hasPrevPage: page > 1
    };
  }

  // Create tree structure from flat array
  static toTree(array, options = {}) {
    const { idKey = 'id', parentKey = 'parentId', childrenKey = 'children' } = options;
    const tree = [];
    const map = {};
    
    // Create map of all items
    array.forEach(item => {
      map[item[idKey]] = { ...item, [childrenKey]: [] };
    });
    
    // Build tree structure
    array.forEach(item => {
      const node = map[item[idKey]];
      const parentId = item[parentKey];
      
      if (parentId && map[parentId]) {
        map[parentId][childrenKey].push(node);
      } else {
        tree.push(node);
      }
    });
    
    return tree;
  }

  // Flatten tree structure
  static fromTree(tree, options = {}) {
    const { childrenKey = 'children' } = options;
    const result = [];
    
    const flatten = (nodes, parent = null) => {
      nodes.forEach(node => {
        const { [childrenKey]: children, ...item } = node;
        result.push({ ...item, parent });
        
        if (children && children.length > 0) {
          flatten(children, item);
        }
      });
    };
    
    flatten(tree);
    return result;
  }

  // Create matrix from array
  static toMatrix(array, columns) {
    const matrix = [];
    for (let i = 0; i < array.length; i += columns) {
      matrix.push(array.slice(i, i + columns));
    }
    return matrix;
  }

  // Rotate matrix
  static rotateMatrix(matrix, times = 1) {
    const rotated = [...matrix];
    
    for (let i = 0; i < times; i++) {
      const rows = rotated.length;
      const cols = rotated[0].length;
      const newMatrix = Array(cols).fill(null).map(() => Array(rows));
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          newMatrix[col][rows - 1 - row] = rotated[row][col];
        }
      }
      
      rotated.length = 0;
      rotated.push(...newMatrix);
    }
    
    return rotated;
  }

  // Find duplicates in array
  static findDuplicates(array, key = null) {
    const duplicates = [];
    const seen = new Set();
    const duplicatesSet = new Set();
    
    array.forEach(item => {
      const value = key ? item[key] : item;
      
      if (seen.has(value)) {
        if (!duplicatesSet.has(value)) {
          duplicates.push(item);
          duplicatesSet.add(value);
        }
      } else {
        seen.add(value);
      }
    });
    
    return duplicates;
  }

  // Zip multiple arrays
  static zip(...arrays) {
    const maxLength = Math.max(...arrays.map(arr => arr.length));
    const zipped = [];
    
    for (let i = 0; i < maxLength; i++) {
      const row = arrays.map(arr => arr[i]);
      zipped.push(row);
    }
    
    return zipped;
  }

  // Unzip array of arrays
  static unzip(array) {
    const maxLength = Math.max(...array.map(row => row.length));
    const unzipped = Array(maxLength).fill(null).map(() => []);
    
    array.forEach(row => {
      row.forEach((item, index) => {
        unzipped[index].push(item);
      });
    });
    
    return unzipped;
  }
}

describe('ArrayUtils', () => {
  const testArray = [1, 2, 3, 4, 5];
  const testObjects = [
    { id: 1, name: 'John', age: 25 },
    { id: 2, name: 'Jane', age: 30 },
    { id: 3, name: 'Bob', age: 25 }
  ];

  describe('Basic Array Operations', () => {
    // P2P Tests
    test('should check if array contains item', () => {
      expect(ArrayUtils.contains([1, 2, 3], 2)).toBe(true);
      expect(ArrayUtils.contains([1, 2, 3], 4)).toBe(false);
    });

    test('should remove duplicates', () => {
      expect(ArrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(ArrayUtils.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    test('should chunk array', () => {
      expect(ArrayUtils.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(ArrayUtils.chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    test('should flatten array', () => {
      expect(ArrayUtils.flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, [5, 6]]);
      expect(ArrayUtils.flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
    });

    test('should get first and last items', () => {
      expect(ArrayUtils.first(testArray)).toBe(1);
      expect(ArrayUtils.first(testArray, 3)).toEqual([1, 2, 3]);
      expect(ArrayUtils.last(testArray)).toBe(5);
      expect(ArrayUtils.last(testArray, 2)).toEqual([4, 5]);
    });

    // F2P Tests
    test('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = ArrayUtils.shuffle(original);
      
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      expect(shuffled).not.toEqual(original); // Very unlikely to be the same
    });

    test('should get random items', () => {
      const random = ArrayUtils.random(testArray);
      expect(testArray).toContain(random);
      
      const sample = ArrayUtils.sample(testArray, 3);
      expect(sample).toHaveLength(3);
      expect(testArray).toEqual(expect.arrayContaining(sample));
    });

    test('should group and sort by key', () => {
      const grouped = ArrayUtils.groupBy(testObjects, 'age');
      expect(grouped[25]).toHaveLength(2);
      expect(grouped[30]).toHaveLength(1);
      
      const sorted = ArrayUtils.sortBy(testObjects, 'name');
      expect(sorted[0].name).toBe('Bob');
      expect(sorted[1].name).toBe('Jane');
      expect(sorted[2].name).toBe('John');
    });
  });

  describe('Array Filtering and Finding', () => {
    // P2P Tests
    test('should filter array', () => {
      const filtered = ArrayUtils.filter(testArray, x => x > 3);
      expect(filtered).toEqual([4, 5]);
    });

    test('should find item', () => {
      const found = ArrayUtils.find(testObjects, x => x.age === 30);
      expect(found).toEqual({ id: 2, name: 'Jane', age: 30 });
    });

    test('should check every and some', () => {
      expect(ArrayUtils.every(testArray, x => x > 0)).toBe(true);
      expect(ArrayUtils.every(testArray, x => x > 3)).toBe(false);
      expect(ArrayUtils.some(testArray, x => x > 3)).toBe(true);
      expect(ArrayUtils.some(testArray, x => x > 5)).toBe(false);
    });

    test('should compact array', () => {
      expect(ArrayUtils.compact([1, 0, '', false, null, undefined, 2])).toEqual([1, 2]);
    });

    // F2P Tests
    test('should get array differences and intersections', () => {
      const arr1 = [1, 2, 3, 4];
      const arr2 = [3, 4, 5, 6];
      
      expect(ArrayUtils.difference(arr1, arr2)).toEqual([1, 2]);
      expect(ArrayUtils.intersection(arr1, arr2)).toEqual([3, 4]);
      expect(ArrayUtils.union(arr1, arr2)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('should partition array', () => {
      const [even, odd] = ArrayUtils.partition(testArray, x => x % 2 === 0);
      expect(even).toEqual([2, 4]);
      expect(odd).toEqual([1, 3, 5]);
    });

    test('should get unique items by key', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' }
      ];
      
      const unique = ArrayUtils.uniqueBy(items, 'category');
      expect(unique).toHaveLength(2);
      expect(unique.map(item => item.category)).toEqual(['A', 'B']);
    });
  });

  describe('Array Manipulation', () => {
    // P2P Tests
    test('should get nth item', () => {
      expect(ArrayUtils.nth(testArray, 2)).toBe(3);
      expect(ArrayUtils.nth(testArray, -1)).toBe(5);
      expect(ArrayUtils.nth(testArray, -2)).toBe(4);
    });

    test('should remove and insert at index', () => {
      const removed = ArrayUtils.removeAt(testArray, 2);
      expect(removed).toEqual([1, 2, 4, 5]);
      
      const inserted = ArrayUtils.insertAt(testArray, 2, 99);
      expect(inserted).toEqual([1, 2, 99, 3, 4, 5]);
    });

    test('should move items', () => {
      const moved = ArrayUtils.move(testArray, 0, 4);
      expect(moved).toEqual([2, 3, 4, 5, 1]);
    });

    // F2P Tests
    test('should calculate statistics', () => {
      expect(ArrayUtils.sum([1, 2, 3, 4, 5])).toBe(15);
      expect(ArrayUtils.average([1, 2, 3, 4, 5])).toBe(3);
      expect(ArrayUtils.min([1, 2, 3, 4, 5])).toBe(1);
      expect(ArrayUtils.max([1, 2, 3, 4, 5])).toBe(5);
      expect(ArrayUtils.range([1, 2, 3, 4, 5])).toBe('1 to 5');
    });
  });

  describe('Advanced Array Operations', () => {
    // P2P Tests
    test('should deep flatten arrays', () => {
      const nested = [1, [2, [3, [4, 5]], 6], 7];
      const flattened = AdvancedArrayUtils.deepFlatten(nested);
      expect(flattened).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    test('should paginate array', () => {
      const pagination = AdvancedArrayUtils.paginate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 2, 3);
      
      expect(pagination.items).toEqual([4, 5, 6]);
      expect(pagination.page).toBe(2);
      expect(pagination.pageSize).toBe(3);
      expect(pagination.totalItems).toBe(11);
      expect(pagination.totalPages).toBe(4);
      expect(pagination.hasNextPage).toBe(true);
      expect(pagination.hasPrevPage).toBe(true);
    });

    test('should create and flatten tree structure', () => {
      const flat = [
        { id: 1, parentId: null, name: 'Root' },
        { id: 2, parentId: 1, name: 'Child 1' },
        { id: 3, parentId: 1, name: 'Child 2' },
        { id: 4, parentId: 2, name: 'Grandchild' }
      ];
      
      const tree = AdvancedArrayUtils.toTree(flat);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].children).toHaveLength(1);
      
      const flattened = AdvancedArrayUtils.fromTree(tree);
      expect(flattened).toHaveLength(4);
    });

    // F2P Tests
    test('should create and rotate matrix', () => {
      const matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      
      const rotated = AdvancedArrayUtils.rotateMatrix(matrix, 1);
      expect(rotated).toEqual([
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3]
      ]);
    });

    test('should find duplicates', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'A' },
        { id: 4, name: 'C' },
        { id: 5, name: 'B' }
      ];
      
      const duplicates = AdvancedArrayUtils.findDuplicates(items, 'name');
      expect(duplicates).toHaveLength(2);
      expect(duplicates.map(item => item.name)).toEqual(['A', 'B']);
    });

    test('should zip and unzip arrays', () => {
      const zipped = AdvancedArrayUtils.zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true]);
      expect(zipped).toEqual([[1, 'a', true], [2, 'b', false], [3, 'c', true]]);
      
      const unzipped = AdvancedArrayUtils.unzip(zipped);
      expect(unzipped).toEqual([[1, 2, 3], ['a', 'b', 'c'], [true, false, true]]);
    });
  });

  describe('Edge Cases', () => {
    // F2P Tests
    test('should handle empty arrays', () => {
      expect(ArrayUtils.first([])).toBeUndefined();
      expect(ArrayUtils.last([])).toBeUndefined();
      expect(ArrayUtils.sum([])).toBe(0);
      expect(ArrayUtils.average([])).toBe(0);
      expect(ArrayUtils.min([])).toBe(Infinity);
      expect(ArrayUtils.max([])).toBe(-Infinity);
    });

    test('should handle single item arrays', () => {
      const single = [42];
      expect(ArrayUtils.first(single)).toBe(42);
      expect(ArrayUtils.last(single)).toBe(42);
      expect(ArrayUtils.sum(single)).toBe(42);
      expect(ArrayUtils.average(single)).toBe(42);
    });

    test('should handle invalid indices', () => {
      expect(ArrayUtils.nth(testArray, 100)).toBeUndefined();
      expect(ArrayUtils.nth(testArray, -100)).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complex array processing workflow', () => {
      const data = [
        { id: 1, category: 'A', value: 10, active: true },
        { id: 2, category: 'B', value: 20, active: false },
        { id: 3, category: 'A', value: 30, active: true },
        { id: 4, category: 'C', value: 40, active: true },
        { id: 5, category: 'B', value: 50, active: false }
      ];
      
      // Filter active items
      const active = ArrayUtils.filter(data, item => item.active);
      expect(active).toHaveLength(3);
      
      // Group by category
      const grouped = ArrayUtils.groupBy(active, 'category');
      expect(grouped.A).toHaveLength(2);
      expect(grouped.C).toHaveLength(1);
      
      // Sort by value
      const sorted = ArrayUtils.sortBy(active, 'value');
      expect(sorted[0].value).toBe(10);
      expect(sorted[2].value).toBe(40);
      
      // Get statistics
      const values = active.map(item => item.value);
      const sum = ArrayUtils.sum(values);
      const avg = ArrayUtils.average(values);
      const range = ArrayUtils.range(values);
      
      expect(sum).toBe(80);
      expect(avg).toBeCloseTo(26.67, 1);
      expect(range).toBe('10 to 40');
      
      // Paginate results
      const pagination = AdvancedArrayUtils.paginate(sorted, 1, 2);
      expect(pagination.items).toHaveLength(2);
      expect(pagination.totalPages).toBe(2);
    });
  });
});
