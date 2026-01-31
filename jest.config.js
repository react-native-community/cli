const common = {
  testEnvironment: 'node',
  snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
  testRunner: 'jest-circus/runner',
};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'e2e',
      setupFilesAfterEnv: ['<rootDir>/jest/setupE2eTests.js'],
      testMatch: ['<rootDir>/__e2e__/*{.,-}test.[jt]s'],
    },
    {
      ...common,
      displayName: 'unit',
      setupFilesAfterEnv: ['<rootDir>/jest/setupUnitTests.js'],
      testMatch: ['<rootDir>/**/__tests__/*{.,-}test.[jt]s'],
    },
  ],
  collectCoverageFrom: [
    '**/packages/*/**/*.ts',
    '!**/__mocks__/**',
    '!**/__tests__/**',
    '!**/build/**',
  ],
};
