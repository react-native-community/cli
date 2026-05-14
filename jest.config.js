const common = {
  testEnvironment: 'node',
  snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
  testRunner: 'jest-circus/runner',
  moduleNameMapper: {
    '^@react-native-community/(.*)$': '<rootDir>/packages/$1/src',
  },
  // Transform execa since it's ESM-only in v9
  transformIgnorePatterns: [
    'node_modules/(?!(execa|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream|merge-stream)/)',
  ],
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
