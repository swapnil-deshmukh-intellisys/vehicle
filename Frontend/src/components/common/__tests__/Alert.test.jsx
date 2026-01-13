import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../Alert';

describe('Alert Component', () => {
  test('renders alert with message', () => {
    render(<Alert message="This is an alert" />);
    expect(screen.getByText('This is an alert')).toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    render(<Alert message="Success message" variant="success" />);
    const alert = screen.getByText('Success message').parentElement;
    expect(alert).toHaveClass('alert-success');
  });

  test('shows close button when closable is true', () => {
    render(<Alert message="Closable alert" closable />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(<Alert message="Alert" closable onClose={handleClose} />);
    
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  test('auto-dismisses after timeout', () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();
    render(<Alert message="Auto dismiss" autoDismiss timeout={3000} onClose={handleClose} />);
    
    jest.advanceTimersByTime(3000);
    expect(handleClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('has proper accessibility attributes', () => {
    render(<Alert message="Warning message" variant="warning" />);
    const alert = screen.getByText('Warning message').parentElement;
    expect(alert).toHaveAttribute('role', 'alert');
  });

  test('applies custom className', () => {
    render(<Alert message="Custom alert" className="custom-alert" />);
    const alert = screen.getByText('Custom alert').parentElement;
    expect(alert).toHaveClass('custom-alert');
  });
});
