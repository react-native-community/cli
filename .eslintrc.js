module.exports = {
  extends: ['@react-native-community', 'plugin:import/errors'],
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': [2],
  },
  // @todo: remove once we cover whole codebase with types
  plugins: ['import'],
  settings: {
    'import/resolver': {
      // Use <rootDir>/tsconfig.json for typescript resolution
      typescript: {},
    },
  },
  overrides: [
    {
      files: [
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/__e2e__/**',
        'jest/**',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
