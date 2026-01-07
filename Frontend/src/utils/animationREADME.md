# Animation System Documentation

## Overview
This repository contains a comprehensive animation system built for modern web applications.

## Files Included

### Core Animation System
- `animationUtils.js` - Main animation framework with 388 lines of production code
- `animationConstants.js` - Animation presets and configurations
- `animationHelpers.js` - Helper utilities and accessibility functions

### Enhanced Systems
- `themeUtils.js` - Enhanced with animation support
- `performanceMonitor.js` - Performance monitoring for animations

## Features

### Animation Types
- Fade animations (in/out)
- Slide animations (up/down/left/right)
- Zoom animations (in/out)
- Rotate animations
- Bounce animations
- Flip animations
- Pulse animations

### Advanced Features
- Scroll-triggered animations
- Staggered entrance effects
- Animation queue system
- Performance monitoring
- Accessibility support (reduced motion)
- Responsive animations
- Loading animations

### Performance Features
- FPS monitoring
- Memory tracking
- Animation performance measurement
- Intersection Observer optimization

## Usage Examples

```javascript
import { fadeIn, slideIn, createStaggeredEntrance } from './animationUtils.js';
import { ANIMATION_PRESETS } from './animationConstants.js';

// Simple fade in
fadeIn(element, 300);

// Staggered entrance
createStaggeredEntrance(elements, {
  animationType: 'fade',
  staggerDelay: 100
});
```

## Browser Support
- Modern browsers with ES6+ support
- Intersection Observer API
- Performance Observer API
- CSS Animations and Transitions

## Accessibility
- Respects `prefers-reduced-motion`
- Provides fallbacks for unsupported features
- Semantic animation usage
