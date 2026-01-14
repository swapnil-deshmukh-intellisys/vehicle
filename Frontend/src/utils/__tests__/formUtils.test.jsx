import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FormValidator,
  FormSubmissionHandler,
  FormFieldManager,
  formUtils
} from '../formUtils';

// Mock fetch for F2P tests
global.fetch = jest.fn();

describe('FormUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FormValidator', () => {
    // P2P Tests - Should pass consistently
    test('should create validator with rules', () => {
      const rules = {
        email: [{ type: 'required' }, { type: 'email' }],
        password: [{ type: 'required' }, { type: 'minLength', value: 8 }]
      };
      
      const validator = formUtils.createValidator(rules);
      expect(validator.rules).toEqual(rules);
    });

    test('should validate empty form with no errors', () => {
      const validator = new FormValidator();
      const result = validator.validate({});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should clear field errors', () => {
      const validator = new FormValidator({ name: [{ type: 'required' }] });
      validator.validate({ name: '' });
      expect(validator.getFieldErrors('name')).toHaveLength(1);
      
      validator.clearFieldErrors('name');
      expect(validator.getFieldErrors('name')).toHaveLength(0);
    });

    // F2P Tests - Will fail before fix, pass after
    test('should validate required field correctly', () => {
      const validator = new FormValidator({
        name: [{ type: 'required', message: 'Name is required' }]
      });
      
      // This should fail initially (F2P)
      const result1 = validator.validate({ name: '' });
      expect(result1.isValid).toBe(false);
      expect(result1.errors.name).toContain('Name is required');
      
      // This should pass after providing value
      const result2 = validator.validate({ name: 'John' });
      expect(result2.isValid).toBe(true);
      expect(result2.errors.name).toBeUndefined();
    });

    test('should validate email format correctly', () => {
      const validator = new FormValidator({
        email: [{ type: 'email', message: 'Invalid email' }]
      });
      
      // F2P: Invalid email should fail
      const result1 = validator.validate({ email: 'invalid-email' });
      expect(result1.isValid).toBe(false);
      expect(result1.errors.email).toContain('Invalid email');
      
      // Should pass with valid email
      const result2 = validator.validate({ email: 'test@example.com' });
      expect(result2.isValid).toBe(true);
      expect(result2.errors.email).toBeUndefined();
    });

    test('should validate minimum length correctly', () => {
      const validator = new FormValidator({
        password: [{ type: 'minLength', value: 8, message: 'Too short' }]
      });
      
      // F2P: Short password should fail
      const result1 = validator.validate({ password: '123' });
      expect(result1.isValid).toBe(false);
      expect(result1.errors.password).toContain('Too short');
      
      // Should pass with sufficient length
      const result2 = validator.validate({ password: '12345678' });
      expect(result2.isValid).toBe(true);
      expect(result2.errors.password).toBeUndefined();
    });
  });

  describe('FormSubmissionHandler', () => {
    // P2P Tests
    test('should create submission handler with options', () => {
      const handler = formUtils.createSubmissionHandler({
        timeout: 5000,
        retryAttempts: 2
      });
      
      expect(handler.options.timeout).toBe(5000);
      expect(handler.options.retryAttempts).toBe(2);
    });

    test('should make HTTP request correctly', async () => {
      const mockResponse = { data: 'success' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const handler = new FormSubmissionHandler();
      const result = await handler.makeRequest('https://api.example.com', { test: 'data' }, {
        method: 'POST'
      });
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    // F2P Tests
    test('should handle network errors with retry', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      fetch.mockRejectedValueOnce(new Error('Network error'));
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      const handler = new FormSubmissionHandler({ retryAttempts: 3 });
      const result = await handler.submit('https://api.example.com', { test: 'data' });
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    test('should handle HTTP errors correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const handler = new FormSubmissionHandler();
      
      await expect(handler.submit('https://api.example.com', {}))
        .rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('FormFieldManager', () => {
    // P2P Tests
    test('should create field manager with initial values', () => {
      const manager = formUtils.createFieldManager({ name: 'John', email: 'john@example.com' });
      
      expect(manager.getValue('name')).toBe('John');
      expect(manager.getValue('email')).toBe('john@example.com');
    });

    test('should set and get field values', () => {
      const manager = new FormFieldManager();
      
      manager.setValue('name', 'Jane');
      expect(manager.getValue('name')).toBe('Jane');
      
      const allValues = manager.getValues();
      expect(allValues).toEqual({ name: 'Jane' });
    });

    test('should track dirty state correctly', () => {
      const manager = new FormFieldManager({ name: 'John' });
      
      expect(manager.isDirty('name')).toBe(false);
      
      manager.setValue('name', 'Jane');
      expect(manager.isDirty('name')).toBe(true);
      expect(manager.isAnyDirty()).toBe(true);
    });

    // F2P Tests
    test('should notify listeners on field changes', () => {
      const manager = new FormFieldManager();
      const mockCallback = jest.fn();
      
      manager.addListener(mockCallback);
      manager.setValue('name', 'Test');
      
      expect(mockCallback).toHaveBeenCalledWith('fieldChanged', {
        fieldName: 'name',
        value: 'Test',
        oldValue: undefined,
        dirty: true
      });
    });

    test('should reset form correctly', () => {
      const manager = new FormFieldManager();
      const mockCallback = jest.fn();
      
      manager.addListener(mockCallback);
      manager.setValue('name', 'Test');
      manager.setTouched('name', true);
      
      manager.reset({ name: 'Reset' });
      
      expect(manager.getValue('name')).toBe('Reset');
      expect(manager.isDirty('name')).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith('formReset', { values: { name: 'Reset' } });
    });
  });

  describe('formUtils', () => {
    // P2P Tests
    test('should format form data correctly', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const formData = formUtils.formatFormData(data);
      
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('name')).toBe('John');
      expect(formData.get('email')).toBe('john@example.com');
    });

    test('should sanitize form data correctly', () => {
      const data = { name: '  John  ', age: 30 };
      const sanitized = formUtils.sanitizeFormData(data);
      
      expect(sanitized.name).toBe('John');
      expect(sanitized.age).toBe(30);
    });

    test('should provide validation rules helpers', () => {
      const required = formUtils.validationRules.required('Field is required');
      expect(required).toEqual({ type: 'required', message: 'Field is required' });
      
      const email = formUtils.validationRules.email('Invalid email');
      expect(email).toEqual({ type: 'email', message: 'Invalid email' });
      
      const minLength = formUtils.validationRules.minLength(8, 'Too short');
      expect(minLength).toEqual({ type: 'minLength', value: 8, message: 'Too short' });
    });

    // F2P Tests
    test('should extract form data from DOM element', () => {
      // Create a mock form element
      const mockForm = document.createElement('form');
      const mockInput1 = document.createElement('input');
      mockInput1.name = 'name';
      mockInput1.value = 'John';
      const mockInput2 = document.createElement('input');
      mockInput2.name = 'email';
      mockInput2.value = 'john@example.com';
      
      mockForm.appendChild(mockInput1);
      mockForm.appendChild(mockInput2);
      
      // Mock FormData constructor
      const mockFormData = new Map([
        ['name', 'John'],
        ['email', 'john@example.com']
      ]);
      
      global.FormData = jest.fn(() => mockFormData);
      
      const data = formUtils.extractFormData(mockForm);
      expect(data).toEqual({ name: 'John', email: 'john@example.com' });
    });
  });

  describe('Integration Tests', () => {
    // F2P Integration Test
    test('should handle complete form workflow', async () => {
      const validator = formUtils.createValidator({
        name: [{ type: 'required' }],
        email: [{ type: 'required' }, { type: 'email' }]
      });
      
      const fieldManager = formUtils.createFieldManager();
      
      // Initially invalid (F2P)
      let result = validator.validate(fieldManager.getValues());
      expect(result.isValid).toBe(false);
      
      // Fill in valid data
      fieldManager.setValue('name', 'John Doe');
      fieldManager.setValue('email', 'john@example.com');
      
      // Should now be valid
      result = validator.validate(fieldManager.getValues());
      expect(result.isValid).toBe(true);
      
      // Mock successful submission
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      const handler = formUtils.createSubmissionHandler();
      const submissionResult = await handler.submit('https://api.example.com', fieldManager.getValues());
      
      expect(submissionResult).toEqual({ success: true });
    });
  });
});
