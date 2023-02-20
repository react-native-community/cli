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
        targets: {node: '16'},
        useBuiltIns: 'entry',
        corejs: '2.x',
      },
    ],
  ],
  plugins: [
    [require.resolve('@babel/plugin-transform-modules-commonjs'), {lazy: true}],
  ],
  sourceMaps: true,
};
