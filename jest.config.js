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
  ],
};
