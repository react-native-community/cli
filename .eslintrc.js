module.exports = {
  extends: ['@react-native-community', 'plugin:import/errors'],
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': [2, 'fb'],
  },
  // @todo: remove once we cover whole codebase with types
  plugins: ['eslint-plugin-import'],
  settings: {
    react: {
      version: 'latest',
    },
    'import/resolver': {
      alias: {
        map: [['types', './types/index.js']],
      },
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
