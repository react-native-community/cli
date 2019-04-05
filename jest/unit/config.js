const base = require('../base.config');

module.exports = {
  ...base,
  displayName: 'unit',
  setupFiles: ['<rootDir>/jest/unit/setup.js'],
  testMatch: ['<rootDir>/**/__tests__/*{.,-}test.js'],
};
