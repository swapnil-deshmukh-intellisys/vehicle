# State Management & Persistence System Documentation

## Overview
This repository contains a comprehensive state management and data persistence system built for modern web applications.

## Files Included

### Core Systems
- `stateManager.js` - State management framework with 324 lines of production code
- `dataPersistence.js` - Data persistence framework with 524 lines of production code
- `eventHandler.js` - Event handling framework with 464 lines of production code

### Supporting Files
- `statePersistenceConstants.js` - Constants and configurations
- `statePersistenceHelpers.js` - Helper utilities and validation functions

## Features

### State Management
- Complete state management with history tracking
- Middleware system for logging, validation, and timestamps
- Subscription system for reactive updates
- Undo/redo functionality
- Persistence to LocalStorage and SessionStorage

### Data Persistence
- Support for LocalStorage, SessionStorage, IndexedDB, and memory storage
- Data expiration strategies
- Encryption and compression support
- Storage usage monitoring
- Batch operations and cleanup utilities

### Event Handling
- Event delegation and cleanup
- Throttling and debouncing
- Passive and once listeners
- Custom event creation and dispatch
- Performance optimization

## Usage Examples

### State Management
```javascript
import { StateManager } from './stateManager.js';

const stateManager = new StateManager({
  count: 0,
  user: null
}, {
  persistKey: 'app-state',
  persistTo: 'localStorage'
});

// Subscribe to changes
stateManager.subscribe('count', (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// Update state
stateManager.setState({ count: 1 });
```

### Data Persistence
```javascript
import { persistData, retrieveData } from './dataPersistence.js';

// Store data
await persistData('user-settings', {
  theme: 'dark',
  language: 'en'
}, {
  storage: 'localStorage',
  expiration: 'time_based'
});

// Retrieve data
const settings = await retrieveData('user-settings');
```

### Event Handling
```javascript
import { onClick, delegateClick, addThrottledListener } from './eventHandler.js';

// Simple click handler
onClick(button, (event) => {
  console.log('Button clicked!');
});

// Event delegation
delegateClick(container, '.button', (event) => {
  console.log('Delegated click!');
});

// Throttled scroll handler
addThrottledListener(window, 'scroll', handleScroll, 100);
```

## Browser Support
- Modern browsers with ES6+ support
- LocalStorage and SessionStorage APIs
- IndexedDB API (optional)
- Event APIs

## Performance Features
- Storage quota management
- Data compression and encryption
- Batch operations
- Performance monitoring
- Automatic cleanup of expired data

## Security Features
- Data encryption (placeholder - use proper encryption in production)
- Input validation
- Safe serialization/deserialization
- Error handling and recovery

## Accessibility
- Respects user preferences
- Provides fallbacks for unsupported features
- Semantic event handling
- Performance optimization

## Integration
The system is designed to work seamlessly with:
- React applications (hooks provided)
- Vue applications
- Vanilla JavaScript
- Other frameworks
