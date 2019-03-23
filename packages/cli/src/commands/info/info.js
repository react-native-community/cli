/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import envinfo from 'envinfo';
import logger from '../../tools/logger';
import type {ContextT} from '../../tools/types.flow';

const info = async function getInfo(
  argv: Array<string>,
  ctx: ContextT,
  options: {packages?: boolean | string},
) {
  try {
    logger.info('Fetching system and libraries information...');
    const output = await envinfo.run({
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio'],
      SDKs: ['iOS SDK', 'Android SDK'],
      npmPackages:
        (typeof options.packages === 'string' &&
          !options.packages.includes('*')) ||
        !options.packages
          ? ['react', 'react-native', '@react-native-community/cli'].concat(
              (options.packages || '').split(','),
            )
          : options.packages,
      npmGlobalPackages: '*react-native*',
    });
    logger.log(output.trim());
  } catch (err) {
    logger.error(`Unable to print environment info.\n${err}`);
  }
};

export default {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  options: [
    {
      command: '--packages [string]',
      description:
        'Which packages from your package.json to include, in addition to the default React Native and React versions.',
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
