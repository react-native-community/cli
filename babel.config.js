module.exports = {
  babelrcRoots: ['packages/*'],
  overrides: [
    {
      presets: ['@babel/preset-typescript'],
      test: '**/*.ts',
    },
  ],
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {node: '18'},
        useBuiltIns: 'entry',
        corejs: '2.x',
      },
    ],
  ],
  plugins: [
    [require.resolve('@babel/plugin-transform-modules-commonjs'), {lazy: true}],
    '@babel/plugin-proposal-export-namespace-from',
  ],
  sourceMaps: true,
};
