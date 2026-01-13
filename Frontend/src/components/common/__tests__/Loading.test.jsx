import React from 'react';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading Component', () => {
  test('renders loading spinner', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays loading text when provided', () => {
    render(<Loading text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('applies size classes correctly', () => {
    render(<Loading size="large" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-large');
  });

  test('shows overlay when overlay prop is true', () => {
    render(<Loading overlay />);
    const overlay = screen.getByRole('status').parentElement;
    expect(overlay).toHaveClass('loading-overlay');
  });

  test('has proper accessibility attributes', () => {
    render(<Loading />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  test('applies custom className', () => {
    render(<Loading className="custom-loading" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-loading');
  });
});
