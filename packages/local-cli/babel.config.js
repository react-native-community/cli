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
  plugins: ['@babel/plugin-proposal-class-properties'],
};
