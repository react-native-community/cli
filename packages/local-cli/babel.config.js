module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: '8' },
        useBuiltIns: 'entry',
      },
    ],
    '@babel/preset-flow',
  ],
};
