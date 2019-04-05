const base = require('../base.config');

module.exports = {
  ...base,
  displayName: 'e2e',
  setupFiles: ['<rootDir>/jest/e2e/setup.js'],
  testMatch: ['<rootDir>/**/__e2e__/*{.,-}test.js'],
};
