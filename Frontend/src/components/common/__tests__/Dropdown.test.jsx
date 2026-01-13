import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown from '../Dropdown';

describe('Dropdown Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  test('renders dropdown trigger', () => {
    render(<Dropdown options={options} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={options} />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  test('selects option when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Dropdown options={options} onChange={handleChange} />);
    
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Option 2'));
    
    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  test('closes dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={options} />);
    
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Option 1'));
    
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  test('filters options when search is enabled', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={options} searchable />);
    
    await user.click(screen.getByRole('button'));
    await user.type(screen.getByRole('textbox'), 'Option 2');
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<Dropdown options={options} aria-label="Select option" />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-label', 'Select option');
  });
});
