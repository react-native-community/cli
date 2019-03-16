module.exports = {
  babelrcRoots: ['packages/*'],
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {node: 8},
        useBuiltIns: 'entry',
      },
    ],
    require.resolve('@babel/preset-flow'),
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-strict-mode'),
    [require.resolve('@babel/plugin-transform-modules-commonjs'), {lazy: true}],
  ],
};
