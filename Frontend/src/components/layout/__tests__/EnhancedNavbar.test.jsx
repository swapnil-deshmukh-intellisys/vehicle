import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import EnhancedNavbar from '../EnhancedNavbar';

// Mock contexts
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    logout: jest.fn(),
    user: null,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock react-router-dom
const MockRouter = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderWithProviders = (component, props = {}) => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <MockRouter>
          <EnhancedNavbar 
            selectedCity="Pune" 
            onCityChange={jest.fn()}
            isDetectingLocation={false}
            {...props}
          />
        </MockRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('EnhancedNavbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navbar with logo and navigation items', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    expect(screen.getByText('ServX')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  test('displays city selector with correct city', () => {
    renderWithProviders(<EnhancedNavbar selectedCity="Mumbai" />);
    
    const citySelect = screen.getByDisplayValue('Mumbai');
    expect(citySelect).toBeInTheDocument();
  });

  test('handles city change', () => {
    const mockOnCityChange = jest.fn();
    renderWithProviders(<EnhancedNavbar />, { onCityChange: mockOnCityChange });
    
    const citySelect = screen.getByDisplayValue('Pune');
    fireEvent.change(citySelect, { target: { value: 'Mumbai' } });
    
    expect(mockOnCityChange).toHaveBeenCalledWith('Mumbai');
  });

  test('shows loading indicator when detecting location', () => {
    renderWithProviders(<EnhancedNavbar isDetectingLocation={true} />);
    
    const loadingIndicator = document.querySelector('.animate-spin');
    expect(loadingIndicator).toBeInTheDocument();
  });

  test('handles search functionality', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    const form = searchInput.closest('form');
    
    fireEvent.change(searchInput, { target: { value: 'bike service' } });
    fireEvent.submit(form);
    
    expect(searchInput.value).toBe('');
  });

  test('opens and closes mobile menu', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const mobileMenuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(mobileMenuButton);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    
    fireEvent.click(mobileMenuButton);
  });

  test('opens user dropdown when user icon is clicked', async () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const userButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(userButton.closest('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
  });

  test('displays user options when logged in', () => {
    // Override the auth mock for logged in user
    jest.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        isLoggedIn: true,
        logout: jest.fn(),
        user: { name: 'Test User' },
      }),
      AuthProvider: ({ children }) => children,
    }));

    renderWithProviders(<EnhancedNavbar />);
    
    const userButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(userButton.closest('button'));
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  test('handles navigation item clicks', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const aboutButton = screen.getByText('About');
    fireEvent.click(aboutButton);
    
    // Navigation should be called (mocked by react-router)
    expect(aboutButton).toBeInTheDocument();
  });

  test('handles theme toggle', () => {
    const mockToggleTheme = jest.fn();
    jest.doMock('../context/ThemeContext', () => ({
      useTheme: () => ({
        theme: 'light',
        toggleTheme: mockToggleTheme,
      }),
      ThemeProvider: ({ children }) => children,
    }));

    renderWithProviders(<EnhancedNavbar />);
    
    const themeButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(themeButton.closest('button'));
    
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test('applies correct classes for scrolled state', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const navbar = document.querySelector('nav');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveClass('sticky', 'top-0', 'z-50');
  });

  test('handles logout correctly', () => {
    const mockLogout = jest.fn();
    jest.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        isLoggedIn: true,
        logout: mockLogout,
        user: { name: 'Test User' },
      }),
      AuthProvider: ({ children }) => children,
    }));

    renderWithProviders(<EnhancedNavbar />);
    
    const userButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(userButton.closest('button'));
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('closes dropdown when clicking outside', async () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const userButton = screen.getByRole('button').querySelector('svg');
    fireEvent.click(userButton.closest('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  test('prevents body scroll when mobile menu is open', () => {
    renderWithProviders(<EnhancedNavbar />);
    
    const mobileMenuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(mobileMenuButton);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    fireEvent.click(mobileMenuButton);
    
    expect(document.body.style.overflow).toBe('unset');
  });
});
