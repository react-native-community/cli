/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import envinfo from 'envinfo';
import {logger} from '@react-native-community/cli-tools';
import type {ConfigT} from 'types';
import releaseChecker from '../../tools/releaseChecker';

const info = async function getInfo(
  argv: Array<string>,
  ctx: ConfigT,
  options: {},
) {
  try {
    logger.info('Fetching system and libraries information...');
    const output = await envinfo.run({
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio'],
      SDKs: ['iOS SDK', 'Android SDK'],
      npmPackages: ['react', 'react-native', '@react-native-community/cli'],
      npmGlobalPackages: '*react-native*',
    });
    logger.log(output.trim());
  } catch (err) {
    logger.error(`Unable to print environment info.\n${err}`);
  } finally {
    await releaseChecker(ctx.root);
  }
};

export default {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  func: info,
};
