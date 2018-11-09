const path = require('path');
const escapeRegExp = require('escape-string-regexp');

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
  only: [
    new RegExp('^' + escapeRegExp(__dirname))
  ]
};
