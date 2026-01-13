import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from '../Tabs';

describe('Tabs Component', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content 3' }
  ];

  test('renders tabs with labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  test('shows first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  test('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    
    await user.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    
    const firstTab = screen.getByText('Tab 1');
    firstTab.focus();
    
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  test('applies variant classes correctly', () => {
    render(<Tabs tabs={tabs} variant="pills" />);
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveClass('tabs-pills');
  });

  test('has proper accessibility attributes', () => {
    render(<Tabs tabs={tabs} />);
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', 'Tabs');
  });

  test('calls onChange when tab changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Tabs tabs={tabs} onChange={handleChange} />);
    
    await user.click(screen.getByText('Tab 3'));
    expect(handleChange).toHaveBeenCalledWith('tab3');
  });
});
