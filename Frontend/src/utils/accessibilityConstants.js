// Accessibility constants and configurations

// WCAG compliance levels
export const WCAG_LEVELS = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
};

// ARIA roles
export const ARIA_ROLES = {
  // Landmark roles
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  FORM: 'form',
  REGION: 'region',
  
  // Widget roles
  BUTTON: 'button',
  LINK: 'link',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  TEXTBOX: 'textbox',
  SPINBUTTON: 'spinbutton',
  SLIDER: 'slider',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  TREE: 'tree',
  TREEITEM: 'treeitem',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  
  // Structure roles
  GROUP: 'group',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  TABLE: 'table',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  LIST: 'list',
  LISTITEM: 'listitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  TOOLTIP: 'tooltip',
  STATUS: 'status'
};

// ARIA attributes
export const ARIA_ATTRIBUTES = {
  // Widget attributes
  AUTOCOMPLETE: 'autocomplete',
  CHECKED: 'checked',
  DISABLED: 'disabled',
  EXPANDED: 'expanded',
  HASPOPUP: 'haspopup',
  HIDDEN: 'hidden',
  INVALID: 'invalid',
  LABEL: 'label',
  LABELLEDBY: 'labelledby',
  LEVEL: 'level',
  MULTILINE: 'multiline',
  MULTISELECTABLE: 'multiselectable',
  ORIENTATION: 'orientation',
  PRESSED: 'pressed',
  READONLY: 'readonly',
  REQUIRED: 'required',
  SELECTED: 'selected',
  SORT: 'sort',
  VALUEMAX: 'valuemax',
  VALUENOW: 'valuenow',
  VALUEMIN: 'valuemin',
  
  // Relationship attributes
  ACTIVEDESCENDANT: 'activedescendant',
  CONTROLS: 'controls',
  DESCRIBEDBY: 'describedby',
  DETAILS: 'details',
  ERRORMESSAGE: 'errormessage',
  FLOWTO: 'flowto',
  OWNS: 'owns',
  
  // Live region attributes
  ATOMIC: 'atomic',
  BUSY: 'busy',
  LIVE: 'live',
  RELEVANT: 'relevant'
};

// Live region politeness levels
export const LIVE_REGION_LEVELS = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive'
};

// Keyboard navigation keys
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
};

// Focus management
export const FOCUS_MANAGEMENT = {
  TRAP_FOCUS: 'trap',
  RESTORE_FOCUS: 'restore',
  SET_FOCUS: 'set',
  REMOVE_FOCUS: 'remove'
};

// Screen reader announcements
export const SCREEN_READER = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off'
};

// Color contrast requirements
export const COLOR_CONTRAST = {
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3.0,
  WCAG_AAA_NORMAL: 7.0,
  WCAG_AAA_LARGE: 4.5
};

// Heading levels
export const HEADING_LEVELS = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6
};

// Form validation states
export const VALIDATION_STATES = {
  VALID: 'valid',
  INVALID: 'invalid',
  WARNING: 'warning',
  INFO: 'info'
};

// Accessibility testing
export const ACCESSIBILITY_TESTS = {
  HEADING_STRUCTURE: 'heading_structure',
  COLOR_CONTRAST: 'color_contrast',
  FOCUS_ORDER: 'focus_order',
  ALT_TEXT: 'alt_text',
  LABELS: 'labels',
  ARIA_ATTRIBUTES: 'aria_attributes',
  KEYBOARD_NAVIGATION: 'keyboard_navigation',
  LINK_PURPOSE: 'link_purpose'
};

// Accessibility preferences
export const ACCESSIBILITY_PREFERENCES = {
  REDUCED_MOTION: 'prefers-reduced-motion',
  HIGH_CONTRAST: 'prefers-contrast',
  DARK_MODE: 'prefers-color-scheme',
  REDUCED_DATA: 'prefers-reduced-data',
  FORCED_COLORS: 'forced-colors'
};

// Skip link targets
export const SKIP_LINK_TARGETS = {
  MAIN: 'main-content',
  NAVIGATION: 'main-navigation',
  SEARCH: 'search-form',
  CONTENT: 'page-content'
};

// Error messages
export const ACCESSIBILITY_ERRORS = {
  MISSING_ALT: 'Missing alt attribute for image',
  MISSING_LABEL: 'Missing label for form input',
  INVALID_HEADING: 'Invalid heading structure',
  POOR_CONTRAST: 'Insufficient color contrast',
  NO_FOCUS: 'Element not focusable',
  MISSING_ARIA: 'Missing required ARIA attribute',
  INVALID_ROLE: 'Invalid ARIA role',
  NO_KEYBOARD: 'Not keyboard accessible'
};
