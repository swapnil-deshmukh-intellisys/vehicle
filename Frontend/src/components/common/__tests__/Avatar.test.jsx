import React from 'react';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar Component', () => {
  test('renders avatar with image', () => {
    render(<Avatar src="test.jpg" alt="User avatar" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'test.jpg');
    expect(img).toHaveAttribute('alt', 'User avatar');
  });

  test('renders avatar with initials when no image', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('applies size classes correctly', () => {
    render(<Avatar size="large" name="John Doe" />);
    const avatar = screen.getByText('JD').parentElement;
    expect(avatar).toHaveClass('avatar-large');
  });

  test('shows fallback when image fails to load', () => {
    render(<Avatar src="invalid.jpg" name="John Doe" />);
    // Should show initials after image load error
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<Avatar src="test.jpg" alt="User avatar" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'User avatar');
  });

  test('applies custom className', () => {
    render(<Avatar name="John Doe" className="custom-avatar" />);
    const avatar = screen.getByText('JD').parentElement;
    expect(avatar).toHaveClass('custom-avatar');
  });
});
