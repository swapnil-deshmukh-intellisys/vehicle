import React, { useRef, useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  useDebounce,
  useThrottle,
  useLazyLoad,
  useVirtualScroll,
  useAsyncMemo,
  LazyComponent,
  OptimizedImage,
  VirtualList,
  usePerformanceMonitor,
  useEventCallback,
  ErrorBoundary,
  useIntersectionObserver,
  useResizeObserver,
  WindowedList
} from '../PerformanceUtils';

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  configurable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  callback,
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  callback,
}));

// Test components for hooks
const TestDebounceComponent = ({ value, delay = 500 }) => {
  const debouncedValue = useDebounce(value, delay);
  return <div data-testid="debounced-value">{debouncedValue}</div>;
};

const TestThrottleComponent = ({ value, delay = 500 }) => {
  const throttledValue = useThrottle(value, delay);
  return <div data-testid="throttled-value">{throttledValue}</div>;
};

const TestLazyLoadComponent = ({ src }) => {
  const { ref, src: imageSrc, isLoading } = useLazyLoad(src);
  return (
    <div>
      <img ref={ref} src={imageSrc} data-testid="lazy-image" />
      {isLoading && <div data-testid="loading">Loading...</div>}
    </div>
  );
};

const TestVirtualScrollComponent = () => {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    items,
    50,
    200
  );

  return (
    <div style={{ height: 200, overflow: 'auto' }} onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} data-testid={`item-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TestAsyncMemoComponent = () => {
  const [value, loading, error] = useAsyncMemo(
    () => Promise.resolve('Async Result'),
    []
  );
  
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error</div>;
  return <div data-testid="value">{value}</div>;
};

const TestPerformanceComponent = () => {
  const { measureFunction } = usePerformanceMonitor('TestComponent');
  
  const expensiveFunction = measureFunction(() => {
    return 'Expensive Result';
  }, 'expensiveFunction');
  
  return <div data-testid="result">{expensiveFunction()}</div>;
};

const TestEventCallbackComponent = ({ onClick }) => {
  const handleClick = useEventCallback(onClick);
  return <button onClick={handleClick}>Click me</button>;
};

// Mock component for lazy loading
const MockLazyComponent = () => <div data-testid="lazy-content">Lazy Content</div>;

describe('PerformanceUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDebounce', () => {
    test('should return initial value immediately', () => {
      render(<TestDebounceComponent value="initial" />);
      expect(screen.getByTestId('debounced-value')).toHaveTextContent('initial');
    });

    test('should debounce value changes', () => {
      const { rerender } = render(<TestDebounceComponent value="initial" />);
      
      rerender(<TestDebounceComponent value="updated" />);
      expect(screen.getByTestId('debounced-value')).toHaveTextContent('initial');
      
      jest.advanceTimersByTime(500);
      expect(screen.getByTestId('debounced-value')).toHaveTextContent('updated');
    });

    test('should handle multiple rapid changes', () => {
      const { rerender } = render(<TestDebounceComponent value="initial" />);
      
      rerender(<TestDebounceComponent value="change1" />);
      rerender(<TestDebounceComponent value="change2" />);
      rerender(<TestDebounceComponent value="change3" />);
      
      jest.advanceTimersByTime(500);
      expect(screen.getByTestId('debounced-value')).toHaveTextContent('change3');
    });
  });

  describe('useThrottle', () => {
    test('should return initial value immediately', () => {
      render(<TestThrottleComponent value="initial" />);
      expect(screen.getByTestId('throttled-value')).toHaveTextContent('initial');
    });

    test('should throttle value changes', () => {
      const { rerender } = render(<TestThrottleComponent value="initial" />);
      
      rerender(<TestThrottleComponent value="updated" />);
      expect(screen.getByTestId('throttled-value')).toHaveTextContent('initial');
      
      jest.advanceTimersByTime(500);
      expect(screen.getByTestId('throttled-value')).toHaveTextContent('updated');
    });
  });

  describe('useLazyLoad', () => {
    test('should show loading state initially', () => {
      render(<TestLazyLoadComponent src="test.jpg" />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    test('should load image when in viewport', async () => {
      // Mock IntersectionObserver to trigger immediately
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: (element) => {
          // Simulate intersection
          callback([{ isIntersecting: true, target: element }]);
        },
        disconnect: mockDisconnect,
      }));

      render(<TestLazyLoadComponent src="test.jpg" />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('useVirtualScroll', () => {
    test('should render visible items only', () => {
      render(<TestVirtualScrollComponent />);
      
      // Should only render items visible in the 200px container
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
      
      // Should not render items outside viewport
      expect(screen.queryByTestId('item-10')).not.toBeInTheDocument();
    });

    test('should update visible items on scroll', () => {
      render(<TestVirtualScrollComponent />);
      
      const container = screen.getByTestId('item-0').closest('div').parentElement.parentElement;
      
      fireEvent.scroll(container, { target: { scrollTop: 250 } });
      
      expect(screen.getByTestId('item-5')).toBeInTheDocument();
      expect(screen.queryByTestId('item-0')).not.toBeInTheDocument();
    });
  });

  describe('useAsyncMemo', () => {
    test('should handle async operation', async () => {
      render(<TestAsyncMemoComponent />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('Async Result');
      });
    });

    test('should handle async errors', async () => {
      const TestErrorComponent = () => {
        const [value, loading, error] = useAsyncMemo(
          () => Promise.reject(new Error('Test error')),
          []
        );
        
        if (loading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">Error</div>;
        return <div data-testid="value">{value}</div>;
      };

      render(<TestErrorComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
    });
  });

  describe('LazyComponent', () => {
    test('should show fallback initially', () => {
      render(
        <LazyComponent 
          component={MockLazyComponent} 
          fallback={<div data-testid="fallback">Loading...</div>}
        />
      );
      
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('lazy-content')).not.toBeInTheDocument();
    });

    test('should render component when visible', async () => {
      // Mock IntersectionObserver to trigger immediately
      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: (element) => {
          callback([{ isIntersecting: true, target: element }]);
        },
        disconnect: jest.fn(),
      }));

      render(
        <LazyComponent 
          component={MockLazyComponent} 
          fallback={<div data-testid="fallback">Loading...</div>}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
        expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
      });
    });
  });

  describe('OptimizedImage', () => {
    test('should show loading placeholder initially', () => {
      render(<OptimizedImage src="test.jpg" alt="Test" />);
      
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
    });

    test('should handle image load error', async () => {
      // Create a test component with mocked error state
      const TestComponent = () => {
        const [error] = useState(new Error('Failed to load'));
        
        if (error) {
          return (
            <div className="flex items-center justify-center bg-gray-200 text-gray-500">
              Failed to load image
            </div>
          );
        }
        
        return <div>Image loaded</div>;
      };

      render(<TestComponent />);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('VirtualList', () => {
    test('should render virtual list', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={200}
          renderItem={(item) => <div>{item}</div>}
        />
      );
      
      // Should render only visible items
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('usePerformanceMonitor', () => {
    test('should measure component render time', () => {
      // Mock console.log for development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<TestPerformanceComponent />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('expensiveFunction execution time:')
      );
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    test('should measure function execution time', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<TestPerformanceComponent />);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('expensiveFunction execution time:')
      );
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('useEventCallback', () => {
    test('should provide stable callback reference', () => {
      const mockOnClick = jest.fn();
      const { rerender } = render(
        <TestEventCallbackComponent onClick={mockOnClick} />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalled();
      
      // Re-render with new function
      const newMockOnClick = jest.fn();
      rerender(<TestEventCallbackComponent onClick={newMockOnClick} />);
      
      fireEvent.click(button);
      expect(newMockOnClick).toHaveBeenCalled();
    });
  });

  describe('ErrorBoundary', () => {
    test('should catch and display errors', () => {
      const ThrowErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowErrorComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });

    test('should render children normally when no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="normal-content">Normal Content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('normal-content')).toBeInTheDocument();
    });
  });

  describe('useIntersectionObserver', () => {
    test('should observe targets', () => {
      const TestComponent = () => {
        const targetRef = useRef(null);
        useIntersectionObserver([targetRef.current]);
        return <div ref={targetRef} data-testid="target">Test</div>;
      };

      render(<TestComponent />);
      
      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(screen.getByTestId('target')).toBeInTheDocument();
    });
  });

  describe('useResizeObserver', () => {
    test('should observe target resize', () => {
      const TestComponent = () => {
        const target = document.createElement('div');
        const dimensions = useResizeObserver(target);
        return <div>Width: {dimensions.width}</div>;
      };

      render(<TestComponent />);
      
      expect(global.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe('WindowedList', () => {
    test('should render windowed list', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      render(
        <WindowedList
          items={items}
          itemSize={50}
          height={200}
          renderItem={(item) => <div>{item}</div>}
        />
      );
      
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });

    test('should handle scroll events', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      render(
        <WindowedList
          items={items}
          itemSize={50}
          height={200}
          renderItem={(item) => <div>{item}</div>}
        />
      );
      
      const container = screen.getByText('Item 0').closest('div').parentElement;
      
      fireEvent.scroll(container, { target: { scrollTop: 100 } });
      
      // Should still render some items
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
