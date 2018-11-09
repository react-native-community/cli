const path = require('path');
const escapeRegExp = require('escape-string-regexp');

module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: { node: '8' },
        useBuiltIns: 'entry',
      },
    ],
    require.resolve('@babel/preset-flow'),
  ],
  only: [
    new RegExp('^' + escapeRegExp(__dirname))
  ]
};
