import React, { useState, useEffect } from 'react';

// Breakpoint constants
export const BREAKPOINTS = {
  xs: '0px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px',
};

// Hook for responsive design
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile: windowSize.width < 576,
    isLargeMobile: windowSize.width >= 576 && windowSize.width < 768,
    isSmallTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isLargeTablet: windowSize.width >= 1024 && windowSize.width < 1200,
    isSmallDesktop: windowSize.width >= 1200 && windowSize.width < 1400,
    isLargeDesktop: windowSize.width >= 1400,
  };
};

// Hook for orientation detection
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

// Hook for device detection
export const useDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isTouch: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isTouch,
        isIOS: /iphone|ipad|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
        isChrome: /chrome/.test(userAgent),
        isFirefox: /firefox/.test(userAgent),
      });
    };

    detectDevice();
  }, []);

  return deviceInfo;
};

// Component for conditional rendering based on screen size
export const Responsive = ({ children, breakpoint, hide = false }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldShow = () => {
    switch (breakpoint) {
      case 'mobile':
        return hide ? !isMobile : isMobile;
      case 'tablet':
        return hide ? !isTablet : isTablet;
      case 'desktop':
        return hide ? !isDesktop : isDesktop;
      case 'mobileOnly':
        return hide ? !(isMobile && !isTablet && !isDesktop) : (isMobile && !isTablet && !isDesktop);
      case 'tabletOnly':
        return hide ? !isTablet : isTablet;
      case 'desktopOnly':
        return hide ? !(isDesktop && !isTablet && !isMobile) : (isDesktop && !isTablet && !isMobile);
      default:
        return true;
    }
  };

  return shouldShow() ? children : null;
};

// Hook for media queries
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event) => setMatches(event.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Custom hooks for common breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

// Component for responsive images
export const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '', 
  sizes = '100vw',
  breakpoints = {},
  ...props 
}) => {
  const generateSrcSet = () => {
    if (!breakpoints || Object.keys(breakpoints).length === 0) {
      return src;
    }

    return Object.entries(breakpoints)
      .map(([width, url]) => `${url} ${width}w`)
      .join(', ');
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      srcSet={generateSrcSet()}
      loading="lazy"
      {...props}
    />
  );
};

// Grid system component
export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = '',
  ...props 
}) => {
  const getGridClasses = () => {
    const classes = [];
    
    Object.entries(cols).forEach(([breakpoint, columns]) => {
      if (breakpoint === 'xs') {
        classes.push(`grid-cols-${columns}`);
      } else {
        classes.push(`${breakpoint}:grid-cols-${columns}`);
      }
    });
    
    classes.push(`gap-${gap}`);
    return classes.join(' ');
  };

  return (
    <div 
      className={`grid ${getGridClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Container component for responsive layouts
export const Container = ({ 
  children, 
  fluid = false, 
  className = '', 
  maxWidth = '7xl',
  ...props 
}) => {
  const getContainerClasses = () => {
    if (fluid) {
      return 'w-full px-4 sm:px-6 lg:px-8';
    }
    
    return `max-w-${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`;
  };

  return (
    <div 
      className={`${getContainerClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Spacer component for responsive spacing
export const Spacer = ({ 
  size = 'md', 
  direction = 'vertical',
  className = '',
  ...props 
}) => {
  const getSpacerClasses = () => {
    const sizes = {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
      xxl: 'space-y-12',
    };

    const horizontalSizes = {
      xs: 'space-x-1',
      sm: 'space-x-2',
      md: 'space-x-4',
      lg: 'space-x-6',
      xl: 'space-x-8',
      xxl: 'space-x-12',
    };

    return direction === 'horizontal' ? horizontalSizes[size] : sizes[size];
  };

  return (
    <div className={`${getSpacerClasses()} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Hook for viewport height calculation (useful for mobile browsers)
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      setViewportHeight(`${vh * 100}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  return viewportHeight;
};

export default {
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
  BREAKPOINTS,
};
