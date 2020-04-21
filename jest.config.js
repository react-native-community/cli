const common = {testEnvironment: 'node'};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'e2e',
      setupFiles: ['<rootDir>/jest/setupE2eTests.js'],
      testMatch: ['<rootDir>/**/__e2e__/*{.,-}test.[jt]s'],
    },
    {
      ...common,
      displayName: 'unit',
      setupFiles: ['<rootDir>/jest/setupUnitTests.js'],
      testMatch: ['<rootDir>/**/__tests__/*{.,-}test.[jt]s'],
    },
    {
      displayName: 'ruby',
      runner: 'jest-runner-minitest',
      moduleFileExtensions: ['rb'],
      testMatch: ['<rootDir>/packages/platform-ios/native_modules.rb'],
    },
  ],
  collectCoverageFrom: [
    '**/packages/*/**/*.ts',
    '!**/__mocks__/**',
    '!**/__tests__/**',
    '!**/build/**',
  ],
};
