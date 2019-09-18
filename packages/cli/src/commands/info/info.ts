/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import releaseChecker from '../../tools/releaseChecker';
import getEnvironmentInfo from '../../tools/envinfo';

const info = async function getInfo(_argv: Array<string>, ctx: Config) {
  try {
    logger.info('Fetching system and libraries information...');
    const output = await getEnvironmentInfo();
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
