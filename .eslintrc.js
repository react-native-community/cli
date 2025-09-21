module.exports = {
  extends: ['@react-native-community', 'plugin:import/errors'],
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': [2],
    // Conditionally disable import/no-unresolved for workspace packages on Windows
    // where junctions cause resolution issues. On Linux/macOS, full validation is preserved.
    ...(process.platform === 'win32'
      ? {
          'import/no-unresolved': [
            'error',
            {
              ignore: ['^@react-native-community/'],
            },
          ],
        }
      : {}),
  },
  // @todo: remove once we cover whole codebase with types
  plugins: ['import'],
  settings: {
    'import/resolver': {
      // Use TypeScript resolver for proper workspace resolution
      typescript: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        alwaysTryTypes: true,
      },
      // Use node resolver as fallback
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules'],
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
