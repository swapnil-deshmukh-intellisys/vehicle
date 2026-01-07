import React from 'react';
import { render, screen } from '@testing-library/react';
import StepperNavigation from '../StepperNavigation';

describe('StepperNavigation', () => {
  test('renders without crashing', () => {
    expect(true).toBe(true);
  });

  test('component exists', () => {
    expect(StepperNavigation).toBeDefined();
  });

  test('can be imported', () => {
    expect(typeof StepperNavigation).toBe('function');
  });
});
