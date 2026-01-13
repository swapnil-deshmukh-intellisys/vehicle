import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  test('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('badge-success');
  });

  test('applies size classes correctly', () => {
    render(<Badge size="large">Large Badge</Badge>);
    const badge = screen.getByText('Large Badge');
    expect(badge).toHaveClass('badge-large');
  });

  test('shows dot when dot prop is true', () => {
    render(<Badge dot />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('badge-dot');
  });

  test('has proper accessibility attributes', () => {
    render(<Badge aria-label="Status badge">Status</Badge>);
    const badge = screen.getByText('Status');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });

  test('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-badge');
  });
});
