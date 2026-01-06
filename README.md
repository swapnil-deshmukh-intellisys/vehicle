# ServX24 - Vehicle Maintenance Platform

A comprehensive vehicle maintenance platform that connects users with garage services, car washes, EV charging stations, and roadside assistance.

## 🚀 Features

### Core Services
- **Garage Services**: Find and book vehicle maintenance and repair services
- **Car Wash**: Locate and schedule car washing and detailing services
- **EV Services**: Electric vehicle charging stations and maintenance
- **Roadside Assistance**: 24/7 emergency roadside support

### Technical Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: WCAG 2.1 compliant with full keyboard navigation
- **Performance Optimized**: Lazy loading, virtual scrolling, and code splitting
- **Modern UI**: Built with React, TailwindCSS, and modern design patterns
- **Testing**: Comprehensive test suite with Jest and React Testing Library

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **FontAwesome**: Icon library
- **Axios**: HTTP client for API calls

### Development Tools
- **Jest**: Testing framework
- **React Testing Library**: Component testing utilities
- **ESLint**: Code linting and formatting
- **PNPM**: Package manager
- **GitHub Actions**: CI/CD pipeline

## 📁 Project Structure

```
Servx/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Reusable utility components
│   │   │   │   ├── ResponsiveUtils.jsx
│   │   │   │   ├── AccessibilityUtils.jsx
│   │   │   │   └── PerformanceUtils.jsx
│   │   │   └── layout/          # Layout components
│   │   │       ├── EnhancedNavbar.jsx
│   │   │       ├── EnhancedFooter.jsx
│   │   │       └── EnhancedPageLayout.jsx
│   │   ├── pages/               # Page components
│   │   ├── context/             # React context providers
│   │   ├── utils/               # Utility functions
│   │   └── __tests__/           # Test files
│   ├── public/                  # Static assets
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- PNPM package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Servx.git
cd Servx
```

2. Install dependencies:
```bash
cd Frontend
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- EnhancedNavbar.test.jsx
```

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Performance Tests**: Loading and rendering optimization

## 🎨 Components

### Enhanced Navbar
- Responsive navigation with mobile menu
- City selector with geolocation
- Search functionality
- User authentication states
- Theme toggle support

### Enhanced Footer
- Newsletter subscription
- Social media integration
- Contact information
- Multiple footer sections
- Responsive grid layout

### Responsive Utilities
- Custom hooks for device detection
- Breakpoint-based rendering
- Touch and orientation detection
- Viewport height calculations

### Accessibility Features
- Focus trap for modals
- Screen reader announcements
- Keyboard navigation
- ARIA attributes and roles
- Skip links and landmarks

### Performance Optimizations
- Lazy loading components
- Virtual scrolling for lists
- Image optimization
- Code splitting
- Debouncing and throttling

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_MAP_API_KEY=your_map_api_key
VITE_ENV=development
```

### Build Configuration
```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📱 Responsive Breakpoints

- **xs**: 0px - 575px (Mobile)
- **sm**: 576px - 767px (Large Mobile)
- **md**: 768px - 1023px (Tablet)
- **lg**: 1024px - 1199px (Small Desktop)
- **xl**: 1200px - 1399px (Desktop)
- **xxl**: 1400px+ (Large Desktop)

## ♿ Accessibility

This application follows WCAG 2.1 guidelines:

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Compatible with screen readers
- **Focus Management**: Proper focus indicators and traps
- **ARIA Labels**: Descriptive labels for interactive elements
- **Color Contrast**: Meets AA contrast ratios

## 🚀 Performance

### Optimization Techniques
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Responsive images with lazy loading
- **Virtual Scrolling**: Efficient rendering of large lists
- **Caching**: Service worker for offline support
- **Bundle Analysis**: Regular bundle size monitoring

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
- **Automated Testing**: Run tests on multiple Node.js versions
- **Code Quality**: ESLint and formatting checks
- **Build Verification**: Ensure production builds succeed
- **Coverage Reports**: Upload coverage to Codecov
- **Multi-environment**: Test on Ubuntu with different configurations

### Deployment
```bash
# Deploy to production
pnpm build
# Deploy build artifacts to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Ensure accessibility compliance
- Update documentation as needed
- Keep performance in mind

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- Vite for the fast build tool
- All contributors and users of this project

## 📞 Support

For support, please contact:
- Email: support@servx24.com
- Phone: +91 98765 43210
- Address: Pune, Maharashtra 411001

---

Made with ❤️ in India | Serving customers nationwide
