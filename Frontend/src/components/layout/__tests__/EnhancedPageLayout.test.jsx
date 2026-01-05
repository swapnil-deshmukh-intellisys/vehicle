import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import EnhancedPageLayout from '../EnhancedPageLayout';

// Mock contexts
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock utils
jest.mock('../../../utils/geolocation', () => ({
  getCurrentLocation: jest.fn(),
  getCityFromCoordinates: jest.fn(),
  storeLocationData: jest.fn(),
}));

// Mock child components
jest.mock('../EnhancedNavbar', () => {
  return function MockEnhancedNavbar({ selectedCity, onCityChange, isDetectingLocation }) {
    return (
      <nav data-testid="enhanced-navbar">
        <span data-testid="selected-city">{selectedCity}</span>
        <span data-testid="detecting-location">{isDetectingLocation.toString()}</span>
        <button onClick={() => onCityChange('Mumbai')}>Change City</button>
      </nav>
    );
  };
});

jest.mock('../EnhancedFooter', () => {
  return function MockEnhancedFooter() {
    return <footer data-testid="enhanced-footer">Footer</footer>;
  };
});

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('EnhancedPageLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    // Mock document.documentElement.scrollHeight
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  test('renders loading state initially', () => {
    const { getCurrentLocation } = require('../../utils/geolocation');
    getCurrentLocation.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  test('renders location detection message', async () => {
    const { getCurrentLocation } = require('../../utils/geolocation');
    getCurrentLocation.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    expect(screen.getByText('Detecting your location...')).toBeInTheDocument();
  });

  test('renders main content after loading', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    // Mock sessionStorage to have existing data
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    expect(screen.getByTestId('enhanced-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-footer')).toBeInTheDocument();
  });

  test('handles city change', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-city')).toHaveTextContent('Pune');
    });

    fireEvent.click(screen.getByText('Change City'));
    
    expect(screen.getByTestId('selected-city')).toHaveTextContent('Mumbai');
    expect(sessionStorage.getItem('selectedCity')).toBe('Mumbai');
  });

  test('uses existing location data from sessionStorage', async () => {
    const { getCurrentLocation } = require('../../utils/geolocation');
    
    // Set existing data in sessionStorage
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Mumbai');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Should not call getCurrentLocation if data exists
    expect(getCurrentLocation).not.toHaveBeenCalled();
    expect(screen.getByTestId('selected-city')).toHaveTextContent('Mumbai');
  });

  test('handles geolocation error gracefully', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockRejectedValue(new Error('Location error'));
    
    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Should set fallback location (Pune)
    expect(sessionStorage.getItem('selectedCity')).toBe('Pune');
    expect(sessionStorage.getItem('latitude')).toBe('18.5204');
    expect(sessionStorage.getItem('longitude')).toBe('73.8567');
  });

  test('shows scroll progress bar', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 200,
    });

    fireEvent.scroll(window);

    const progressBar = document.querySelector('.fixed.top-0.left-0.h-1');
    expect(progressBar).toBeInTheDocument();
  });

  test('shows back to top button when scrolled', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Simulate scroll to show back to top button
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 300,
    });

    fireEvent.scroll(window);

    const backToTopButton = screen.getByLabelText('Back to top');
    expect(backToTopButton).toBeInTheDocument();

    fireEvent.click(backToTopButton);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('includes accessibility features', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Check for skip to main content link
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // Check for proper ARIA roles
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('role', 'main');
  });

  test('handles storage change events', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Pune');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-city')).toHaveTextContent('Pune');
    });

    // Simulate storage change event
    const storageEvent = new StorageEvent('storage', {
      key: 'selectedCity',
      newValue: 'Delhi'
    });
    
    window.dispatchEvent(storageEvent);

    expect(screen.getByTestId('selected-city')).toHaveTextContent('Delhi');
  });

  test('converts localities to main cities', async () => {
    const { getCurrentLocation, getCityFromCoordinates, storeLocationData } = require('../../utils/geolocation');
    
    getCurrentLocation.mockResolvedValue({ latitude: 18.5204, longitude: 73.8567 });
    getCityFromCoordinates.mockResolvedValue({ city: 'Pune' });
    
    // Set locality that should be converted to Pune
    sessionStorage.setItem('latitude', '18.5204');
    sessionStorage.setItem('longitude', '73.8567');
    sessionStorage.setItem('selectedCity', 'Hinjewadi');

    renderWithProviders(
      <EnhancedPageLayout>
        <div>Test Content</div>
      </EnhancedPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    // Should convert Hinjewadi to Pune
    expect(sessionStorage.getItem('selectedCity')).toBe('Pune');
    expect(screen.getByTestId('selected-city')).toHaveTextContent('Pune');
  });
});
