import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input Component', () => {
  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');
    expect(handleChange).toHaveBeenCalled();
  });

  test('shows error state', () => {
    render(<Input error="This field is required" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('applies variant classes correctly', () => {
    render(<Input variant="outlined" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-outlined');
  });

  test('has proper accessibility attributes', () => {
    render(<Input aria-label="Custom input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Custom input');
  });
});
