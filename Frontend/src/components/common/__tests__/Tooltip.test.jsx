import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
  test('renders tooltip content', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  test('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    
    await user.hover(screen.getByRole('button'));
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  test('hides tooltip on unhover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );
    
    const button = screen.getByRole('button');
    await user.hover(button);
    await user.unhover(button);
    
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
  });

  test('applies position classes correctly', () => {
    render(
      <Tooltip content="Tooltip text" position="top">
        <button>Button</button>
      </Tooltip>
    );
    
    const tooltip = screen.getByRole('button').parentElement;
    expect(tooltip).toHaveClass('tooltip-top');
  });

  test('has proper accessibility attributes', () => {
    render(
      <Tooltip content="Tooltip text" aria-label="Custom tooltip">
        <button>Button</button>
      </Tooltip>
    );
    
    const tooltip = screen.getByRole('button').parentElement;
    expect(tooltip).toHaveAttribute('aria-label', 'Custom tooltip');
  });

  test('applies custom className', () => {
    render(
      <Tooltip content="Tooltip text" className="custom-tooltip">
        <button>Button</button>
      </Tooltip>
    );
    
    const tooltip = screen.getByRole('button').parentElement;
    expect(tooltip).toHaveClass('custom-tooltip');
  });
});
