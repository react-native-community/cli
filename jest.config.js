module.exports = {
  testEnvironment: 'node',
  projects: [
    {
      displayName: '<rootDir>/packages/*',
    },
    {displayName: '<rootDir>/e2e', testMatch: ['<rootDir>/e2e/**/*.test.js']},
  ],
};
