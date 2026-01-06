import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';

// Custom hook for debouncing
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for throttling
export const useThrottle = (value, delay) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastExecuted.current >= delay) {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

// Custom hook for lazy loading images
export const useLazyLoad = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
          };
          img.onerror = () => {
            setError(new Error('Failed to load image'));
            setIsLoading(false);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, options]);

  return { ref: imgRef, src: imageSrc, isLoading, error };
};

// Custom hook for virtual scrolling
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd).map((item, index) => ({
      item,
      index: visibleStart + index,
    }));
  }, [items, visibleStart, visibleEnd]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

// Custom hook for memoized async operations
export const useAsyncMemo = (factory, deps) => {
  const [value, setValue] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(undefined);
    
    factory()
      .then((result) => {
        if (!cancelled) {
          setValue(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  return [value, loading, error];
};

// Component for lazy loading components
export const LazyComponent = ({ 
  component: Component, // eslint-disable-line no-unused-vars
  fallback = <div>Loading...</div>,
  rootMargin = '100px',
  ...restProps 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={elementRef}>
      {isVisible ? <Component {...restProps} /> : fallback}
    </div>
  );
};

// Component for optimized image rendering
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  ...restProps 
}) => {
  const { ref, src: imageSrc, isLoading, error } = useLazyLoad(src);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        {...restProps}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          {...restProps}
        />
      )}
      <img
        ref={ref}
        src={imageSrc}
        alt={alt}
        className={`
          transition-opacity duration-300
          ${isLoading || !isLoaded ? 'opacity-0' : 'opacity-100'}
          ${className}
        `}
        onLoad={handleLoad}
        loading="lazy"
        {...restProps}
      />
    </div>
  );
};

// Component for virtual list
export const VirtualList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  className = '',
  ...props 
}) => {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualScroll(items, itemHeight, containerHeight);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Custom hook for performance monitoring
export const usePerformanceMonitor = (name) => {
  const startTime = useRef();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`${name} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  const measureFunction = useCallback((fn, functionName) => {
    return (...args) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`${functionName} execution time: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  }, []);

  return { measureFunction };
};

// Custom hook for memoized event handlers
export const useEventCallback = (fn) => {
  const fnRef = useRef(fn);
  
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  return useCallback((...args) => {
    return fnRef.current(...args);
  }, []);
};

// Component for code splitting with error boundary
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600">Error details</summary>
            <pre className="mt-2 text-sm text-red-700">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility function for bundle size optimization
export const preloadComponent = (importFunc) => {
  return importFunc();
};

// Utility function for resource hints
export const addResourceHints = () => {
  // Preload critical resources
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.href = '/fonts/main-font.woff2';
  preloadLink.as = 'font';
  preloadLink.type = 'font/woff2';
  preloadLink.crossOrigin = 'anonymous';
  document.head.appendChild(preloadLink);

  // DNS prefetch for external domains
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = 'https://api.example.com';
  document.head.appendChild(dnsPrefetch);
};

// Custom hook for intersection observer with multiple targets
export const useIntersectionObserver = (targets, options = {}) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      setEntries(entries);
    }, options);

    const currentTargets = targets.filter(Boolean);
    currentTargets.forEach((target) => {
      if (target) observer.observe(target);
    });

    return () => {
      currentTargets.forEach((target) => {
        if (target) observer.unobserve(target);
      });
      observer.disconnect();
    };
  }, [targets, options]);

  return entries;
};

// Custom hook for resize observer
export const useResizeObserver = (target) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!target) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [target]);

  return dimensions;
};

// Component for optimized list rendering with windowing
export const WindowedList = ({ 
  items, 
  itemSize, 
  height, 
  renderItem,
  overscan = 5,
  className = '',
  ...props 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleStart = Math.max(0, Math.floor(scrollTop / itemSize) - overscan);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemSize) + overscan
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: items.length * itemSize, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={visibleStart + index}
            style={{
              position: 'absolute',
              top: (visibleStart + index) * itemSize,
              left: 0,
              right: 0,
              height: itemSize,
            }}
          >
            {renderItem(item, visibleStart + index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
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
  preloadComponent,
  addResourceHints,
  useIntersectionObserver,
  useResizeObserver,
  WindowedList,
};
