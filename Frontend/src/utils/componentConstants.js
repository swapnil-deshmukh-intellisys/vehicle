// Component system constants and configurations

// Component lifecycle phases
export const COMPONENT_LIFECYCLE = {
  CREATED: 'created',
  MOUNTED: 'mounted',
  UPDATED: 'updated',
  UNMOUNTED: 'unmounted',
  DESTROYED: 'destroyed',
  ERROR: 'error'
};

// Component types
export const COMPONENT_TYPES = {
  FUNCTIONAL: 'functional',
  CLASS: 'class',
  HOOK: 'hook',
  HOC: 'hoc',
  RENDER_PROP: 'render-prop',
  CONTEXT: 'context',
  PROVIDER: 'provider',
  CONSUMER: 'consumer'
};

// Component validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  TYPE_STRING: 'string',
  TYPE_NUMBER: 'number',
  TYPE_BOOLEAN: 'boolean',
  TYPE_ARRAY: 'array',
  TYPE_OBJECT: 'object',
  TYPE_FUNCTION: 'function',
  TYPE_NODE: 'node',
  TYPE_ELEMENT: 'element',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  PATTERN: 'pattern',
  ENUM: 'enum',
  CUSTOM: 'custom'
};

// Component props validation
export const PROP_VALIDATION = {
  STRING: {
    type: VALIDATION_RULES.TYPE_STRING,
    required: false
  },
  NUMBER: {
    type: VALIDATION_RULES.TYPE_NUMBER,
    required: false
  },
  BOOLEAN: {
    type: VALIDATION_RULES.TYPE_BOOLEAN,
    required: false
  },
  ARRAY: {
    type: VALIDATION_RULES.TYPE_ARRAY,
    required: false
  },
  OBJECT: {
    type: VALIDATION_RULES.TYPE_OBJECT,
    required: false
  },
  FUNCTION: {
    type: VALIDATION_RULES.TYPE_FUNCTION,
    required: false
  },
  NODE: {
    type: VALIDATION_RULES.TYPE_NODE,
    required: false
  },
  ELEMENT: {
    type: VALIDATION_RULES.TYPE_ELEMENT,
    required: false
  }
};

// Component event types
export const COMPONENT_EVENTS = {
  // Mouse events
  CLICK: 'click',
  DOUBLE_CLICK: 'dblclick',
  MOUSE_DOWN: 'mousedown',
  MOUSE_UP: 'mouseup',
  MOUSE_MOVE: 'mousemove',
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
  MOUSE_OVER: 'mouseover',
  MOUSE_OUT: 'mouseout',
  
  // Keyboard events
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  KEY_PRESS: 'keypress',
  
  // Form events
  SUBMIT: 'submit',
  RESET: 'reset',
  CHANGE: 'change',
  INPUT: 'input',
  FOCUS: 'focus',
  BLUR: 'blur',
  FOCUS_IN: 'focusin',
  FOCUS_OUT: 'focusout',
  
  // Touch events
  TOUCH_START: 'touchstart',
  TOUCH_END: 'touchend',
  TOUCH_MOVE: 'touchmove',
  TOUCH_CANCEL: 'touchcancel',
  
  // Drag events
  DRAG_START: 'dragstart',
  DRAG: 'drag',
  DRAG_ENTER: 'dragenter',
  DRAG_LEAVE: 'dragleave',
  DRAG_OVER: 'dragover',
  DROP: 'drop',
  DRAG_END: 'dragend',
  
  // Window events
  LOAD: 'load',
  UNLOAD: 'unload',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  
  // Custom events
  CUSTOM: 'custom',
  LIFECYCLE: 'lifecycle',
  STATE_CHANGE: 'stateChange',
  ERROR: 'error'
};

// Component state management
export const COMPONENT_STATE = {
  INITIAL: 'initial',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  SUCCESS: 'success',
  IDLE: 'idle',
  BUSY: 'busy',
  READY: 'ready',
  DIRTY: 'dirty',
  CLEAN: 'clean'
};

// Component performance metrics
export const PERFORMANCE_METRICS = {
  RENDER_TIME: 'renderTime',
  MOUNT_TIME: 'mountTime',
  UPDATE_TIME: 'updateTime',
  UNMOUNT_TIME: 'unmountTime',
  RE_RENDER_COUNT: 'reRenderCount',
  STATE_UPDATES: 'stateUpdates',
  PROP_UPDATES: 'propUpdates',
  EVENT_HANDLERS: 'eventHandlers',
  MEMORY_USAGE: 'memoryUsage',
  DOM_NODES: 'domNodes'
};

// Component hooks
export const COMPONENT_HOOKS = {
  // Lifecycle hooks
  BEFORE_CREATE: 'beforeCreate',
  CREATED: 'created',
  BEFORE_MOUNT: 'beforeMount',
  MOUNTED: 'mounted',
  BEFORE_UPDATE: 'beforeUpdate',
  UPDATED: 'updated',
  BEFORE_UNMOUNT: 'beforeUnmount',
  UNMOUNTED: 'unmounted',
  ERROR_CAPTURED: 'errorCaptured',
  
  // State hooks
  USE_STATE: 'useState',
  USE_REDUCER: 'useReducer',
  USE_CONTEXT: 'useContext',
  USE_REF: 'useRef',
  USE_EFFECT: 'useEffect',
  USE_LAYOUT_EFFECT: 'useLayoutEffect',
  USE_MEMO: 'useMemo',
  USE_CALLBACK: 'useCallback',
  
  // Custom hooks
  BEFORE_RENDER: 'beforeRender',
  AFTER_RENDER: 'afterRender',
  BEFORE_UPDATE_PROPS: 'beforeUpdateProps',
  AFTER_UPDATE_PROPS: 'afterUpdateProps',
  BEFORE_STATE_CHANGE: 'beforeStateChange',
  AFTER_STATE_CHANGE: 'afterStateChange'
};

// Component middleware types
export const MIDDLEWARE_TYPES = {
  VALIDATION: 'validation',
  TRANSFORMATION: 'transformation',
  LOGGING: 'logging',
  PERFORMANCE: 'performance',
  ERROR_HANDLING: 'errorHandling',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  CACHING: 'caching',
  ANALYTICS: 'analytics',
  DEBUGGING: 'debugging'
};

// Component error types
export const COMPONENT_ERRORS = {
  VALIDATION_ERROR: 'ValidationError',
  RENDER_ERROR: 'RenderError',
  STATE_ERROR: 'StateError',
  PROP_ERROR: 'PropError',
  EVENT_ERROR: 'EventError',
  LIFECYCLE_ERROR: 'LifecycleError',
  NETWORK_ERROR: 'NetworkError',
  PERMISSION_ERROR: 'PermissionError',
  TIMEOUT_ERROR: 'TimeoutError',
  UNKNOWN_ERROR: 'UnknownError'
};

// Component patterns
export const COMPONENT_PATTERNS = {
  // Structural patterns
  COMPOUND: 'compound',
  COMPOSITION: 'composition',
  INHERITANCE: 'inheritance',
  DECORATOR: 'decorator',
  FACADE: 'facade',
  ADAPTER: 'adapter',
  BRIDGE: 'bridge',
  PROXY: 'proxy',
  
  // Behavioral patterns
  OBSERVER: 'observer',
  PUBLISHER_SUBSCRIBER: 'publisher-subscriber',
  COMMAND: 'command',
  STRATEGY: 'strategy',
  STATE: 'state',
  MEMENTO: 'memento',
  ITERATOR: 'iterator',
  VISITOR: 'visitor',
  
  // Creational patterns
  FACTORY: 'factory',
  BUILDER: 'builder',
  PROTOTYPE: 'prototype',
  SINGLETON: 'singleton',
  ABSTRACT_FACTORY: 'abstractFactory',
  
  // React-specific patterns
  HOC: 'hoc',
  RENDER_PROP: 'renderProp',
  HOOK: 'hook',
  CONTEXT: 'context',
  PROVIDER: 'provider',
  CONSUMER: 'consumer',
  PORTAL: 'portal',
  FORWARD_REF: 'forwardRef',
  LAZY: 'lazy',
  SUSPENSE: 'suspense'
};

// Component sizes
export const COMPONENT_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  AUTO: 'auto'
};

// Component variants
export const COMPONENT_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  LIGHT: 'light',
  DARK: 'dark',
  GHOST: 'ghost',
  LINK: 'link',
  OUTLINE: 'outline',
  FILLED: 'filled',
  CONTAINED: 'contained',
  TEXT: 'text'
};

// Component states
export const COMPONENT_STATES_VISUAL = {
  DEFAULT: 'default',
  HOVER: 'hover',
  ACTIVE: 'active',
  FOCUS: 'focus',
  DISABLED: 'disabled',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
};

// Component roles
export const COMPONENT_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  HEADER: 'header',
  FOOTER: 'footer',
  SECTION: 'section',
  ARTICLE: 'article',
  ASIDE: 'aside',
  DIALOG: 'dialog',
  MODAL: 'modal',
  ALERT: 'alert',
  STATUS: 'status',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SWITCH: 'switch',
  SLIDER: 'slider',
  PROGRESSBAR: 'progressbar',
  SPINBUTTON: 'spinbutton',
  TEXTBOX: 'textbox',
  SEARCH: 'search',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  TABLE: 'table',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEITEM: 'treeitem',
  TREEGRID: 'treegrid'
};

// Component data flow
export const DATA_FLOW = {
  UNIDIRECTIONAL: 'unidirectional',
  BIDIRECTIONAL: 'bidirectional',
  EVENT_DRIVEN: 'event-driven',
  STATE_DRIVEN: 'state-driven',
  PROP_DRIVEN: 'prop-driven',
  CONTEXT_DRIVEN: 'context-driven',
  REDUX_DRIVEN: 'redux-driven',
  MOBX_DRIVEN: 'mobx-driven',
  RXJS_DRIVEN: 'rxjs-driven'
};

// Component testing types
export const TESTING_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  END_TO_END: 'end-to-end',
  VISUAL: 'visual',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  COMPONENT: 'component',
  HOOK: 'hook',
  STORYBOOK: 'storybook'
};

// Component debugging levels
export const DEBUG_LEVELS = {
  NONE: 'none',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
  ALL: 'all'
};

// Component optimization strategies
export const OPTIMIZATION_STRATEGIES = {
  MEMOIZATION: 'memoization',
  LAZY_LOADING: 'lazy-loading',
  CODE_SPLITTING: 'code-splitting',
  TREE_SHAKING: 'tree-shaking',
  VIRTUALIZATION: 'virtualization',
  DEBOUNCING: 'debouncing',
  THROTTLING: 'throttling',
  BATCHING: 'batching',
  CACHING: 'caching',
  PRELOADING: 'preloading'
};

// Component configuration presets
export const COMPONENT_PRESETS = {
  // Form components
  FORM_INPUT: {
    type: COMPONENT_TYPES.FUNCTIONAL,
    validation: [VALIDATION_RULES.REQUIRED],
    events: [COMPONENT_EVENTS.CHANGE, COMPONENT_EVENTS.FOCUS, COMPONENT_EVENTS.BLUR],
    state: [COMPONENT_STATE.DEFAULT, COMPONENT_STATE.ERROR],
    optimization: [OPTIMIZATION_STRATEGIES.MEMOIZATION]
  },
  
  // Button components
  BUTTON: {
    type: COMPONENT_TYPES.FUNCTIONAL,
    events: [COMPONENT_EVENTS.CLICK],
    variants: [COMPONENT_VARIANTS.PRIMARY, COMPONENT_VARIANTS.SECONDARY],
    sizes: [COMPONENT_SIZES.SM, COMPONENT_SIZES.MD, COMPONENT_SIZES.LG],
    states: [COMPONENT_STATES_VISUAL.DEFAULT, COMPONENT_STATES_VISUAL.DISABLED]
  },
  
  // Modal components
  MODAL: {
    type: COMPONENT_TYPES.FUNCTIONAL,
    lifecycle: [COMPONENT_LIFECYCLE.MOUNTED, COMPONENT_LIFECYCLE.UNMOUNTED],
    events: [COMPONENT_EVENTS.CLICK, COMPONENT_EVENTS.KEY_DOWN],
    state: [COMPONENT_STATE.OPEN, COMPONENT_STATE.CLOSED],
    optimization: [OPTIMIZATION_STRATEGIES.LAZY_LOADING]
  },
  
  // List components
  LIST: {
    type: COMPONENT_TYPES.FUNCTIONAL,
    patterns: [COMPONENT_PATTERNS.VIRTUALIZATION],
    optimization: [OPTIMIZATION_STRATEGIES.VIRTUALIZATION, OPTIMIZATION_STRATEGIES.MEMOIZATION],
    performance: [PERFORMANCE_METRICS.RENDER_TIME, PERFORMANCE_METRICS.DOM_NODES]
  },
  
  // Form components
  FORM: {
    type: COMPONENT_TYPES.FUNCTIONAL,
    validation: [VALIDATION_RULES.REQUIRED, VALIDATION_RULES.CUSTOM],
    events: [COMPONENT_EVENTS.SUBMIT, COMPONENT_EVENTS.CHANGE],
    state: [COMPONENT_STATE.DEFAULT, COMPONENT_STATE.ERROR, COMPONENT_STATE.SUBMITTING],
    optimization: [OPTIMIZATION_STRATEGIES.DEBOUNCING]
  }
};

// Component development guidelines
export const DEVELOPMENT_GUIDELINES = {
  // Naming conventions
  NAMING: {
    COMPONENTS: 'PascalCase',
    PROPS: 'camelCase',
    METHODS: 'camelCase',
    EVENTS: 'camelCase',
    CONSTANTS: 'UPPER_SNAKE_CASE',
    FILES: 'PascalCase'
  },
  
  // File structure
  FILE_STRUCTURE: {
    COMPONENTS: 'components/',
    HOOKS: 'hooks/',
    UTILS: 'utils/',
    TYPES: 'types/',
    STYLES: 'styles/',
    TESTS: '__tests__/',
    STORIES: '__stories__/'
  },
  
  // Code organization
  ORGANIZATION: {
    IMPORTS: 'imports',
    TYPES: 'types',
    CONSTANTS: 'constants',
    HOOKS: 'hooks',
    STATE: 'state',
    HANDLERS: 'handlers',
    EFFECTS: 'effects',
    RENDER: 'render',
    EXPORTS: 'exports'
  },
  
  // Best practices
  BEST_PRACTICES: {
    SINGLE_RESPONSIBILITY: 'single-responsibility',
    COMPOSITION_OVER_INHERITANCE: 'composition-over-inheritance',
    IMMUTABLE_STATE: 'immutable-state',
    PURE_FUNCTIONS: 'pure-functions',
    ERROR_BOUNDARIES: 'error-boundaries',
    ACCESSIBILITY: 'accessibility',
    PERFORMANCE: 'performance',
    TESTING: 'testing'
  }
};
