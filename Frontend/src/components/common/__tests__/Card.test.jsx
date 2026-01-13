import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  test('renders card with title and content', () => {
    render(
      <Card title="Card Title">
        <p>Card content</p>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('renders card without title', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    render(<Card variant="elevated">Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('card-elevated');
  });

  test('shows footer when provided', () => {
    render(
      <Card footer={<button>Footer Button</button>}>
        <p>Content</p>
      </Card>
    );
    
    expect(screen.getByRole('button', { name: 'Footer Button' })).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<Card aria-label="Custom card">Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveAttribute('aria-label', 'Custom card');
  });

  test('applies custom className', () => {
    render(<Card className="custom-card">Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('custom-card');
  });
});
