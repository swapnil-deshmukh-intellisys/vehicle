import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  useResponsive,
  useOrientation,
  useDevice,
  Responsive,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  ResponsiveImage,
  ResponsiveGrid,
  Container,
  Spacer,
  useViewportHeight,
  BREAKPOINTS
} from '../ResponsiveUtils';

// Mock window and navigator
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
});

// Test components
const TestComponent = ({ children, ...props }) => <div {...props}>{children}</div>;

describe('ResponsiveUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  describe('BREAKPOINTS', () => {
    test('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.xs).toBe('0px');
      expect(BREAKPOINTS.sm).toBe('576px');
      expect(BREAKPOINTS.md).toBe('768px');
      expect(BREAKPOINTS.lg).toBe('992px');
      expect(BREAKPOINTS.xl).toBe('1200px');
      expect(BREAKPOINTS.xxl).toBe('1400px');
    });
  });

  describe('useResponsive', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const responsive = useResponsive();
        return (
          <div data-testid="responsive-data">
            <span data-testid="width">{responsive.windowSize.width}</span>
            <span data-testid="height">{responsive.windowSize.height}</span>
            <span data-testid="is-mobile">{responsive.isMobile.toString()}</span>
            <span data-testid="is-tablet">{responsive.isTablet.toString()}</span>
            <span data-testid="is-desktop">{responsive.isDesktop.toString()}</span>
          </div>
        );
      };
    });

    test('should return correct responsive values for desktop', () => {
      window.innerWidth = 1200;
      window.innerHeight = 800;

      render(<TestHookComponent />);

      expect(screen.getByTestId('width')).toHaveTextContent('1200');
      expect(screen.getByTestId('height')).toHaveTextContent('800');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    });

    test('should return correct responsive values for tablet', () => {
      window.innerWidth = 800;
      window.innerHeight = 600;

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
    });

    test('should return correct responsive values for mobile', () => {
      window.innerWidth = 375;
      window.innerHeight = 667;

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
    });

    test('should update on window resize', async () => {
      render(<TestHookComponent />);

      expect(screen.getByTestId('width')).toHaveTextContent('1024');

      // Simulate window resize
      window.innerWidth = 500;
      fireEvent.resize(window);

      await waitFor(() => {
        expect(screen.getByTestId('width')).toHaveTextContent('500');
      });
    });
  });

  describe('useOrientation', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const orientation = useOrientation();
        return <span data-testid="orientation">{orientation}</span>;
      };
    });

    test('should detect portrait orientation', () => {
      window.innerWidth = 768;
      window.innerHeight = 1024;

      render(<TestHookComponent />);

      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');
    });

    test('should detect landscape orientation', () => {
      window.innerWidth = 1024;
      window.innerHeight = 768;

      render(<TestHookComponent />);

      expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
    });
  });

  describe('useDevice', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const device = useDevice();
        return (
          <div data-testid="device-data">
            <span data-testid="is-touch">{device.isTouch.toString()}</span>
            <span data-testid="is-ios">{device.isIOS.toString()}</span>
            <span data-testid="is-android">{device.isAndroid.toString()}</span>
            <span data-testid="is-safari">{device.isSafari.toString()}</span>
            <span data-testid="is-chrome">{device.isChrome.toString()}</span>
          </div>
        );
      };
    });

    test('should detect device properties', () => {
      // Mock touch capability
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: () => {},
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-touch')).toHaveTextContent('true');
      expect(screen.getByTestId('is-ios')).toHaveTextContent('false');
      expect(screen.getByTestId('is-android')).toHaveTextContent('false');
    });

    test('should detect iOS device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-ios')).toHaveTextContent('true');
    });

    test('should detect Android device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-android')).toHaveTextContent('true');
    });
  });

  describe('Responsive component', () => {
    beforeEach(() => {
      window.innerWidth = 1024;
    });

    test('should show content for desktop breakpoint', () => {
      render(
        <Responsive breakpoint="desktop">
          <span>Desktop Content</span>
        </Responsive>
      );

      expect(screen.getByText('Desktop Content')).toBeInTheDocument();
    });

    test('should hide content for mobile breakpoint on desktop', () => {
      render(
        <Responsive breakpoint="mobile" hide>
          <span>Mobile Content</span>
        </Responsive>
      );

      expect(screen.queryByText('Mobile Content')).not.toBeInTheDocument();
    });

    test('should show content for mobile breakpoint on mobile', () => {
      window.innerWidth = 375;
      
      render(
        <Responsive breakpoint="mobile">
          <span>Mobile Content</span>
        </Responsive>
      );

      expect(screen.getByText('Mobile Content')).toBeInTheDocument();
    });
  });

  describe('useMediaQuery', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const matches = useMediaQuery('(min-width: 768px)');
        return <span data-testid="matches">{matches.toString()}</span>;
      };
    });

    test('should return true for matching media query', () => {
      window.innerWidth = 1024;

      // Mock matchMedia
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(<TestHookComponent />);

      expect(screen.getByTestId('matches')).toHaveTextContent('true');
    });

    test('should return false for non-matching media query', () => {
      window.innerWidth = 500;

      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(<TestHookComponent />);

      expect(screen.getByTestId('matches')).toHaveTextContent('false');
    });
  });

  describe('useIsMobile, useIsTablet, useIsDesktop', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const isMobile = useIsMobile();
        const isTablet = useIsTablet();
        const isDesktop = useIsDesktop();
        return (
          <div>
            <span data-testid="is-mobile">{isMobile.toString()}</span>
            <span data-testid="is-tablet">{isTablet.toString()}</span>
            <span data-testid="is-desktop">{isDesktop.toString()}</span>
          </div>
        );
      };
    });

    test('should detect desktop correctly', () => {
      window.innerWidth = 1200;

      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(<TestHookComponent />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    });
  });

  describe('ResponsiveImage', () => {
    test('should render image with basic props', () => {
      render(
        <ResponsiveImage 
          src="/test.jpg" 
          alt="Test image"
          className="test-class"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/test.jpg');
      expect(img).toHaveAttribute('alt', 'Test image');
      expect(img).toHaveClass('test-class');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    test('should generate srcset for responsive images', () => {
      const breakpoints = {
        '500': '/test-small.jpg',
        '1000': '/test-medium.jpg',
        '1500': '/test-large.jpg',
      };

      render(
        <ResponsiveImage 
          src="/test.jpg" 
          alt="Test image"
          breakpoints={breakpoints}
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('srcset', '/test-small.jpg 500w, /test-medium.jpg 1000w, /test-large.jpg 1500w');
    });
  });

  describe('ResponsiveGrid', () => {
    test('should render grid with default props', () => {
      render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid', 'gap-4');
    });

    test('should render grid with custom columns', () => {
      render(
        <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 3 }}>
          <div>Item 1</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByText('Item 1').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4');
    });
  });

  describe('Container', () => {
    test('should render container with max-width', () => {
      render(
        <Container maxWidth="4xl">
          <div>Content</div>
        </Container>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('max-w-4xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    test('should render fluid container', () => {
      render(
        <Container fluid>
          <div>Content</div>
        </Container>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('w-full', 'px-4', 'sm:px-6', 'lg:px-8');
      expect(container).not.toHaveClass('mx-auto');
    });
  });

  describe('Spacer', () => {
    test('should render vertical spacer', () => {
      render(
        <Spacer size="lg">
          <div>Item 1</div>
          <div>Item 2</div>
        </Spacer>
      );

      const spacer = screen.getByText('Item 1').parentElement;
      expect(spacer).toHaveClass('space-y-6');
    });

    test('should render horizontal spacer', () => {
      render(
        <Spacer size="md" direction="horizontal">
          <div>Item 1</div>
          <div>Item 2</div>
        </Spacer>
      );

      const spacer = screen.getByText('Item 1').parentElement;
      expect(spacer).toHaveClass('space-x-4');
    });
  });

  describe('useViewportHeight', () => {
    let TestHookComponent;

    beforeEach(() => {
      TestHookComponent = () => {
        const viewportHeight = useViewportHeight();
        return <span data-testid="viewport-height">{viewportHeight}</span>;
      };
    });

    test('should calculate viewport height correctly', () => {
      window.innerHeight = 1000;

      render(<TestHookComponent />);

      expect(screen.getByTestId('viewport-height')).toHaveTextContent('1000px');
    });
  });
});
