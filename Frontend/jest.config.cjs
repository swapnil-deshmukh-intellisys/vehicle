module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  globals: {
    TextEncoder: require('util').TextEncoder,
    TextDecoder: require('util').TextDecoder,
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.jsx'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.(js|jsx)',
    '!src/index.js',
    '!src/main.jsx',
    '!src/reportWebVitals.js',
    '!src/**/*.test.js',
    '!src/**/*.test.jsx',
    '!src/**/__tests__/**',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};
