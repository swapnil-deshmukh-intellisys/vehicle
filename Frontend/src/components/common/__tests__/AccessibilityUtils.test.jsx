import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useFocusTrap,
  useScreenReader,
  SkipLinks,
  AccessibleModal,
  AccessibleAccordion,
  AccessibleTabs,
  useKeyboardNavigation,
  AccessibleForm,
  checkColorContrast
} from '../AccessibilityUtils';

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

// Test components for hooks
const TestFocusTrapComponent = ({ isActive = true }) => {
  const containerRef = useFocusTrap(isActive);
  
  return (
    <div ref={containerRef} data-testid="focus-trap-container">
      <button data-testid="button-1">Button 1</button>
      <button data-testid="button-2">Button 2</button>
      <button data-testid="button-3">Button 3</button>
    </div>
  );
};

const TestScreenReaderComponent = () => {
  const { announce, AnnouncementComponent } = useScreenReader();
  
  return (
    <div>
      <button onClick={() => announce('Test announcement')}>
        Announce
      </button>
      <AnnouncementComponent />
    </div>
  );
};

const TestKeyboardNavigationComponent = ({ items = ['Item 1', 'Item 2', 'Item 3'] }) => {
  const [selected, setSelected] = React.useState(null);
  const { activeIndex, handleKeyDown } = useKeyboardNavigation(
    items,
    (item, index) => setSelected(item)
  );
  
  return (
    <div onKeyDown={handleKeyDown} data-testid="keyboard-container">
      {items.map((item, index) => (
        <div
          key={index}
          data-testid={`item-${index}`}
          className={activeIndex === index ? 'active' : ''}
        >
          {item}
        </div>
      ))}
      {selected && <div data-testid="selected">{selected}</div>}
    </div>
  );
};

describe('AccessibilityUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = 'unset';
  });

  describe('useFocusTrap', () => {
    test('should focus first element when activated', () => {
      render(<TestFocusTrapComponent />);
      
      const button1 = screen.getByTestId('button-1');
      expect(button1).toHaveFocus();
    });

    test('should trap focus within container', () => {
      render(<TestFocusTrapComponent />);
      
      const button1 = screen.getByTestId('button-1');
      const button3 = screen.getByTestId('button-3');
      
      // Focus on last element and press Tab
      button3.focus();
      fireEvent.keyDown(document.activeElement, { key: 'Tab' });
      
      // Should focus back to first element
      expect(button1).toHaveFocus();
    });

    test('should handle Shift+Tab correctly', () => {
      render(<TestFocusTrapComponent />);
      
      const button1 = screen.getByTestId('button-1');
      const button3 = screen.getByTestId('button-3');
      
      // Focus on first element and press Shift+Tab
      button1.focus();
      fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
      
      // Should focus to last element
      expect(button3).toHaveFocus();
    });

    test('should not trap focus when deactivated', () => {
      render(<TestFocusTrapComponent isActive={false} />);
      
      const button1 = screen.getByTestId('button-1');
      expect(button1).not.toHaveFocus();
    });
  });

  describe('useScreenReader', () => {
    test('should make announcements', async () => {
      render(<TestScreenReaderComponent />);
      
      const announceButton = screen.getByText('Announce');
      fireEvent.click(announceButton);
      
      await waitFor(() => {
        const announcement = screen.getByText('Test announcement');
        expect(announcement).toBeInTheDocument();
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('should use assertive for error announcements', async () => {
      const TestComponent = () => {
        const { announce, AnnouncementComponent } = useScreenReader();
        
        return (
          <div>
            <button onClick={() => announce('error message')}>
              Announce Error
            </button>
            <AnnouncementComponent />
          </div>
        );
      };

      render(<TestComponent />);
      
      const announceButton = screen.getByText('Announce Error');
      fireEvent.click(announceButton);
      
      await waitFor(() => {
        const announcement = screen.getByText('error message');
        expect(announcement).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('SkipLinks', () => {
    test('should render skip links', () => {
      const links = [
        { href: '#main', text: 'Skip to main content' },
        { href: '#nav', text: 'Skip to navigation' }
      ];

      render(<SkipLinks links={links} />);
      
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
      expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main');
    });

    test('should have proper accessibility classes', () => {
      const links = [{ href: '#main', text: 'Skip to main content' }];
      
      render(<SkipLinks links={links} />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('block', 'bg-blue-600', 'text-white', 'px-4', 'py-2', 'rounded-md', 'mb-2', 'hover:bg-blue-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('AccessibleModal', () => {
    test('should render modal when open', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('should not render modal when closed', () => {
      render(
        <AccessibleModal
          isOpen={false}
          onClose={jest.fn()}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    test('should close on escape key', () => {
      const mockOnClose = jest.fn();
      render(
        <AccessibleModal
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should close on overlay click', () => {
      const mockOnClose = jest.fn();
      render(
        <AccessibleModal
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
        >
          <div>Modal Content</div>
        </AccessibleModal>
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should have proper ARIA attributes', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('should prevent body scroll when open', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('AccessibleAccordion', () => {
    const items = [
      {
        title: 'Section 1',
        content: 'Content 1'
      },
      {
        title: 'Section 2',
        content: 'Content 2'
      }
    ];

    test('should render accordion items', () => {
      render(<AccessibleAccordion items={items} />);
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });

    test('should expand and collapse items', () => {
      render(<AccessibleAccordion items={items} />);
      
      const section1Button = screen.getByRole('button', { name: 'Section 1' });
      fireEvent.click(section1Button);
      
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(section1Button).toHaveAttribute('aria-expanded', 'true');
    });

    test('should handle keyboard navigation', () => {
      render(<AccessibleAccordion items={items} />);
      
      const section1Button = screen.getByRole('button', { name: 'Section 1' });
      section1Button.focus();
      
      fireEvent.keyDown(section1Button, { key: 'ArrowDown' });
      fireEvent.keyDown(document.activeElement, { key: 'Enter' });
      
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<AccessibleAccordion items={items} />);
      
      const section1Button = screen.getByRole('button', { name: 'Section 1' });
      expect(section1Button).toHaveAttribute('aria-expanded', 'false');
      expect(section1Button).toHaveAttribute('aria-controls');
    });
  });

  describe('AccessibleTabs', () => {
    const tabs = [
      {
        label: 'Tab 1',
        content: 'Content 1'
      },
      {
        label: 'Tab 2',
        content: 'Content 2'
      }
    ];

    test('should render tabs', () => {
      render(<AccessibleTabs tabs={tabs} />);
      
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    test('should switch tabs on click', () => {
      render(<AccessibleTabs tabs={tabs} />);
      
      const tab2 = screen.getByText('Tab 2');
      fireEvent.click(tab2);
      
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(tab2).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle keyboard navigation', () => {
      render(<AccessibleTabs tabs={tabs} />);
      
      const tab1 = screen.getByText('Tab 1');
      tab1.focus();
      
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<AccessibleTabs tabs={tabs} />);
      
      const tab1 = screen.getByText('Tab 1');
      expect(tab1).toHaveAttribute('role', 'tab');
      expect(tab1).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('useKeyboardNavigation', () => {
    test('should handle arrow key navigation', () => {
      render(<TestKeyboardNavigationComponent />);
      
      const container = screen.getByTestId('keyboard-container');
      
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      expect(screen.getByTestId('item-1')).toHaveClass('active');
      
      fireEvent.keyDown(container, { key: 'ArrowUp' });
      expect(screen.getByTestId('item-0')).toHaveClass('active');
    });

    test('should handle Enter key selection', () => {
      render(<TestKeyboardNavigationComponent />);
      
      const container = screen.getByTestId('keyboard-container');
      
      fireEvent.keyDown(container, { key: 'Enter' });
      expect(screen.getByTestId('selected')).toHaveTextContent('Item 1');
    });

    test('should handle Escape key', () => {
      const mockOnEscape = jest.fn();
      render(
        <TestKeyboardNavigationComponent items={['Item 1']} />
      );
      
      const container = screen.getByTestId('keyboard-container');
      
      fireEvent.keyDown(container, { key: 'Escape' });
      // Should not throw error even without onEscape handler
    });
  });

  describe('AccessibleForm', () => {
    test('should render form with children', () => {
      render(
        <AccessibleForm onSubmit={jest.fn()}>
          <input name="email" type="email" />
          <button type="submit">Submit</button>
        </AccessibleForm>
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    test('should handle form submission without errors', () => {
      const mockOnSubmit = jest.fn();
      render(
        <AccessibleForm onSubmit={mockOnSubmit}>
          <input name="email" type="email" />
          <button type="submit">Submit</button>
        </AccessibleForm>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    test('should handle form validation errors', () => {
      const mockOnSubmit = jest.fn();
      const errors = { email: 'Invalid email' };
      
      render(
        <AccessibleForm onSubmit={mockOnSubmit} errors={errors}>
          <input name="email" type="email" />
          <button type="submit">Submit</button>
        </AccessibleForm>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('checkColorContrast', () => {
    test('should calculate contrast ratio correctly', () => {
      const contrast = checkColorContrast('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      expect(contrast).toBeCloseTo(21, 0); // White on black should be ~21:1
    });

    test('should handle invalid color values', () => {
      const contrast = checkColorContrast('invalid', 'rgb(0, 0, 0)');
      expect(contrast).toBeCloseTo(1, 0); // Should return minimum contrast
    });

    test('should calculate contrast for similar colors', () => {
      const contrast = checkColorContrast('rgb(128, 128, 128)', 'rgb(127, 127, 127)');
      expect(contrast).toBeCloseTo(1.02, 1); // Similar colors should have low contrast
    });
  });
});
