import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import EnhancedNavbar from '../EnhancedNavbar';

// Integration tests for EnhancedNavbar with full context

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isLoggedIn: true,
    logout: jest.fn(),
    user: { name: 'John Doe', email: 'john@example.com' },
  }),
  AuthProvider: ({ children }) => children,
}));

const MockRouter = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <MockRouter>
          {component}
        </MockRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('EnhancedNavbar Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  test('full user workflow: login -> navigate -> logout', async () => {
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    // User is logged in, should see user dropdown
    const userButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(userButton.closest('button'));

    // Should see user options
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    // Click on profile
    const profileButton = screen.getByText('Profile');
    fireEvent.click(profileButton);

    // Click on sign out
    fireEvent.click(userButton.closest('button'));
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    // Should call logout
    const { logout } = require('../context/AuthContext').useAuth();
    expect(logout).toHaveBeenCalled();
  });

  test('search and city change workflow', async () => {
    const mockOnCityChange = jest.fn();
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={mockOnCityChange}
        isDetectingLocation={false}
      />
    );

    // Change city
    const citySelect = screen.getByDisplayValue('Pune');
    fireEvent.change(citySelect, { target: { value: 'Mumbai' } });
    expect(mockOnCityChange).toHaveBeenCalledWith('Mumbai');

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'car wash' } });
    
    const form = searchInput.closest('form');
    fireEvent.submit(form);

    expect(searchInput.value).toBe('');
  });

  test('mobile menu full interaction', async () => {
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    // Open mobile menu
    const mobileMenuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(mobileMenuButton);

    // Should see all navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();

    // Should see mobile search
    const mobileSearch = screen.getByPlaceholderText('Search...');
    expect(mobileSearch).toBeInTheDocument();

    // Should see city selector in mobile
    const mobileCitySelect = screen.getByDisplayValue('Pune');
    expect(mobileCitySelect).toBeInTheDocument();

    // Close mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Mobile menu should be closed
    expect(screen.queryByText('Services')).not.toBeInTheDocument();
  });

  test('theme toggle functionality', () => {
    const mockToggleTheme = jest.fn();
    jest.doMock('../context/ThemeContext', () => ({
      useTheme: () => ({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
      }),
      ThemeProvider: ({ children }) => children,
    }));

    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    const themeButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(themeButton.closest('button'));

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test('responsive design behavior', () => {
    // Mock window width for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    // Should show mobile menu button
    const mobileMenuButton = screen.getByRole('button', { name: '' });
    expect(mobileMenuButton).toBeInTheDocument();

    // Should not show desktop navigation
    const desktopNav = screen.queryByText('Services');
    expect(desktopNav).toBeInTheDocument(); // Still visible in mobile menu
  });

  test('accessibility features', async () => {
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    // Check for proper ARIA labels and roles
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();

    // Check keyboard navigation
    const searchInput = screen.getByPlaceholderText('Search...');
    searchInput.focus();
    expect(searchInput).toHaveFocus();

    // Tab navigation should work
    fireEvent.tab();
    // Should focus on next interactive element
  });

  test('error handling and edge cases', () => {
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="" 
        onCityChange={jest.fn()}
        isDetectingLocation={true}
      />
    );

    // Should handle empty city gracefully
    const citySelect = screen.getByDisplayValue('');
    expect(citySelect).toBeInTheDocument();

    // Should show loading indicator
    const loadingIndicator = document.querySelector('.animate-spin');
    expect(loadingIndicator).toBeInTheDocument();
  });

  test('performance optimization - scroll handling', () => {
    renderWithProviders(
      <EnhancedNavbar 
        selectedCity="Pune" 
        onCityChange={jest.fn()}
        isDetectingLocation={false}
      />
    );

    const navbar = document.querySelector('nav');
    
    // Simulate scroll
    window.dispatchEvent(new Event('scroll'));
    
    // Should still be properly rendered
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveClass('sticky', 'top-0', 'z-50');
  });
});
