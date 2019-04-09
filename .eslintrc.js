module.exports = {
  extends: '@react-native-community',
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': [2, 'fb'],
  },
  settings: {
    react: {
      version: 'latest',
    },
  },
  overrides: [
    {
      files: ['**/__mocks__/**', '**/__fixtures__/**', '**/__e2e__/**', 'jest/**'],
      env: {
        jest: true,
      },
    },
  ],
};
