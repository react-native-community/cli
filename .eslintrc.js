const prettierConfig = require('./.prettierrc');

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
    react: {
      version: 'latest',
    },
    'import/resolver': {
      alias: {
        map: [['types', './types/index.js']],
      },
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
    {
      files: ['*.ts', '**/*.ts'],
      rules: {
        'prettier/prettier': [2, {prettierConfig, parser: 'typescript'}],
      },
    },
  ],
};
