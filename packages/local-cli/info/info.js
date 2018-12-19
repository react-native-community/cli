/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const envinfo = require('envinfo');

const info = function getInfo(argv, ctx, options) {
  try {
    envinfo
      .run(
        {
          System: ['OS', 'CPU', 'Memory', 'Shell'],
          Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
          IDEs: ['Xcode', 'Android Studio'],
          SDKs: ['iOS SDK', 'Android SDK'],
          npmPackages:
            (typeof options.packages === 'string' &&
              !options.packages.includes('*')) ||
            !options.packages
              ? ['react', 'react-native'].concat(
                  (options.packages || '').split(',')
                )
              : options.packages,
          npmGlobalPackages: '*react-native*',
        },
        {
          clipboard: !!options.clipboard,
          title: 'React Native Environment Info',
        }
      )
      .then(console.log)
      .catch(err => {
        console.log('Error: unable to print environment info');
        console.log(err);
      });
  } catch (err) {
    console.log('Error: unable to print environment info');
    console.log(err);
  }
};

module.exports = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  options: [
    {
      command: '--packages [string]',
      description:
        'Which packages from your package.json to include, in addition to the default React Native and React versions.',
    },
    {
      command: '--clipboard [boolean]',
      description:
        'Automagically copy the environment report output to the clipboard',
    },
  ],
  examples: [
    {
      desc: 'Get standard version info',
      cmd: 'react-native info',
    },
    {
      desc: 'Get standard version info & specified package versions',
      cmd: 'react-native info --packages jest,eslint',
    },
    {
      desc: 'Get standard version info & globbed package versions',
      cmd: 'react-native info --packages "*react*"',
    },
    {
      desc: 'Get standard version info & all package versions',
      cmd: 'react-native info --packages',
    },
  ],
  func: info,
};
