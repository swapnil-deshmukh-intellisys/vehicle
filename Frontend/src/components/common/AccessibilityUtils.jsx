import React, { useEffect, useRef, useState } from 'react';

// Custom hook for managing focus trap
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the previously focused element
    previousFocusRef.current = document.activeElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
};

// Custom hook for screen reader announcements
export const useScreenReader = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message) => {
    setAnnouncement(message);
    
    // Clear the announcement after it's been read
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  };

  const AnnouncementComponent = () => (
    <div
      aria-live={announcement.includes('error') ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, AnnouncementComponent };
};

// Component for skip links
export const SkipLinks = ({ links = [] }) => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="block bg-blue-600 text-white px-4 py-2 rounded-md mb-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};

// Component for accessible modal
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  closeOnEscape = true,
  closeOnOverlay = true 
}) => {
  const modalRef = useFocusTrap(isOpen);
  const { announce } = useScreenReader();

  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, title, announce]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
        announce('Modal closed');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose, announce]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
      announce('Modal closed');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-4">
          {children}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Component for accessible accordion
export const AccessibleAccordion = ({ items = [] }) => {
  const [openItems, setOpenItems] = useState(new Set());
  const { announce } = useScreenReader();

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
      announce(`Accordion section ${index + 1} collapsed`);
    } else {
      newOpenItems.add(index);
      announce(`Accordion section ${index + 1} expanded`);
    }
    
    setOpenItems(newOpenItems);
  };

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'Enter':
      case ' ': {
        e.preventDefault();
        toggleItem(index);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const nextButton = document.querySelector(`[data-accordion-button="${index + 1}"]`);
        nextButton?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevButton = document.querySelector(`[data-accordion-button="${index - 1}"]`);
        prevButton?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        const firstButton = document.querySelector('[data-accordion-button="0"]');
        firstButton?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        const lastButton = document.querySelector(`[data-accordion-button="${items.length - 1}"]`);
        lastButton?.focus();
        break;
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        
        return (
          <div key={index} className="border-b border-gray-200 last:border-b-0">
            <button
              data-accordion-button={index}
              type="button"
              className={`w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isOpen ? 'bg-gray-50' : ''
              }`}
              onClick={() => toggleItem(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${index}`}
            >
              <span className="font-medium">{item.title}</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              id={`accordion-panel-${index}`}
              className={`px-4 overflow-hidden transition-all duration-200 ${
                isOpen ? 'py-3' : 'max-h-0'
              }`}
              role="region"
              aria-labelledby={`accordion-button-${index}`}
              hidden={!isOpen}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Component for accessible tabs
export const AccessibleTabs = ({ tabs = [], defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { announce } = useScreenReader();

  const handleTabChange = (index) => {
    setActiveTab(index);
    announce(`Tab ${tabs[index].label} activated`);
  };

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIndex = (index - 1 + tabs.length) % tabs.length;
        handleTabChange(prevIndex);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const nextIndex = (index + 1) % tabs.length;
        handleTabChange(nextIndex);
        break;
      }
      case 'Home': {
        e.preventDefault();
        handleTabChange(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        handleTabChange(tabs.length - 1);
        break;
      }
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            className={`px-4 py-2 font-medium border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === index
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
            tabIndex={activeTab === index ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            hidden={activeTab !== index}
          >
            {activeTab === index && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom hook for keyboard navigation
export const useKeyboardNavigation = (items, onSelect, options = {}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = (activeIndex + 1) % items.length;
        setActiveIndex(nextIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = (activeIndex - 1 + items.length) % items.length;
        setActiveIndex(prevIndex);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (items[activeIndex]) {
          onSelect(items[activeIndex], activeIndex);
        }
        break;
      }
      case 'Escape': {
        if (options.onEscape) {
          e.preventDefault();
          options.onEscape();
        }
        break;
      }
    }
  };

  return { activeIndex, handleKeyDown, setActiveIndex };
};

// Component for accessible form validation
export const AccessibleForm = ({ children, onSubmit, errors = {} }) => {
  const { announce } = useScreenReader();
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      announce(`Form has ${errorKeys.length} error${errorKeys.length > 1 ? 's' : ''}`);
      
      // Focus on the first error field
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]');
      firstErrorField?.focus();
    } else {
      announce('Form submitted successfully');
      onSubmit(e);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.name) {
          const error = errors[child.props.name];
          return React.cloneElement(child, {
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': error ? `${child.props.name}-error` : undefined,
            error,
          });
        }
        return child;
      })}
    </form>
  );
};

// Utility function for checking color contrast
export const checkColorContrast = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export default {
  useFocusTrap,
  useScreenReader,
  SkipLinks,
  AccessibleModal,
  AccessibleAccordion,
  AccessibleTabs,
  useKeyboardNavigation,
  AccessibleForm,
  checkColorContrast,
};
