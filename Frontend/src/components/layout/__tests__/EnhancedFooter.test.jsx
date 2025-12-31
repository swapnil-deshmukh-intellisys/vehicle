import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import EnhancedFooter from '../EnhancedFooter';

// Mock context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaFacebook: () => <div data-testid="facebook-icon">FB</div>,
  FaTwitter: () => <div data-testid="twitter-icon">TW</div>,
  FaInstagram: () => <div data-testid="instagram-icon">IG</div>,
  FaYoutube: () => <div data-testid="youtube-icon">YT</div>,
  FaLinkedin: () => <div data-testid="linkedin-icon">LI</div>,
}));

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('EnhancedFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  test('renders footer with all sections', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByText('ServX24')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Stay Updated')).toBeInTheDocument();
  });

  test('renders newsletter subscription form', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  test('handles newsletter subscription', async () => {
    renderWithProviders(<EnhancedFooter />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Subscribed!')).toBeInTheDocument();
    });
  });

  test('renders social media links', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-icon')).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
  });

  test('renders contact information', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
    expect(screen.getByText('support@servx24.com')).toBeInTheDocument();
    expect(screen.getByText('Pune, Maharashtra 411001')).toBeInTheDocument();
    expect(screen.getByText('Mon-Sat: 9AM-8PM')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Garage Services')).toBeInTheDocument();
  });

  test('handles navigation link clicks', () => {
    renderWithProviders(<EnhancedFooter />);
    
    const aboutLink = screen.getByText('About Us');
    fireEvent.click(aboutLink);
    
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('handles brand logo click', () => {
    renderWithProviders(<EnhancedFooter />);
    
    const brandLogo = screen.getByText('ServX24');
    fireEvent.click(brandLogo);
    
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('handles scroll to top button', () => {
    renderWithProviders(<EnhancedFooter />);
    
    const scrollTopButton = screen.getByLabelText('Scroll to top');
    fireEvent.click(scrollTopButton);
    
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('handles theme toggle button', () => {
    const mockToggleTheme = jest.fn();
    jest.doMock('../../context/ThemeContext', () => ({
      useTheme: () => ({
        theme: 'light',
        toggleTheme: mockToggleTheme,
      }),
      ThemeProvider: ({ children }) => children,
    }));

    renderWithProviders(<EnhancedFooter />);
    
    const themeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeButton);
    
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test('validates email input', () => {
    renderWithProviders(<EnhancedFooter />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
    
    // Test empty email
    fireEvent.click(subscribeButton);
    expect(emailInput).toBeInvalid();
    
    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(subscribeButton);
    expect(emailInput).toBeInvalid();
  });

  test('renders copyright information', () => {
    renderWithProviders(<EnhancedFooter />);
    
    expect(screen.getByText('© 2024 ServX24. All rights reserved.')).toBeInTheDocument();
    expect(screen.getByText('Made with ❤️ in India | Serving customers nationwide')).toBeInTheDocument();
  });

  test('displays subscription success message temporarily', async () => {
    renderWithProviders(<EnhancedFooter />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Subscribed!')).toBeInTheDocument();
    });
    
    // Button should return to normal after timeout
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  test('clears email input after successful subscription', async () => {
    renderWithProviders(<EnhancedFooter />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });

  test('renders responsive design elements', () => {
    renderWithProviders(<EnhancedFooter />);
    
    // Check for responsive classes
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
    
    // Check for grid layout
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  test('handles keyboard navigation', () => {
    renderWithProviders(<EnhancedFooter />);
    
    const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
    subscribeButton.focus();
    expect(subscribeButton).toHaveFocus();
    
    // Test Enter key submission
    fireEvent.keyPress(subscribeButton, { key: 'Enter', code: 'Enter' });
  });

  test('accessibility attributes are present', () => {
    renderWithProviders(<EnhancedFooter />);
    
    // Check for proper ARIA labels
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    
    // Check social links have aria-labels
    const socialLinks = screen.getAllByRole('link');
    socialLinks.forEach(link => {
      expect(link).toHaveAttribute('aria-label');
    });
  });
});
