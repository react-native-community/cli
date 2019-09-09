module.exports = {
  babelrcRoots: ['packages/*'],
  overrides: [
    {
      presets: ['@babel/preset-flow'],
      test: '**/*.js',
    },
    {
      presets: ['@babel/preset-typescript'],
      test: '**/*.ts',
    },
  ],
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {node: 8},
        useBuiltIns: 'entry',
      },
    ],
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-transform-strict-mode'),
    [require.resolve('@babel/plugin-transform-modules-commonjs'), {lazy: true}],
    [
      require.resolve('babel-plugin-module-resolver', {
        root: ['.'],
        alias: {
          types: './types',
        },
      }),
    ],
  ],
};
