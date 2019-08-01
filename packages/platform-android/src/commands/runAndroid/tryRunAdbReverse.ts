/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execFileSync} from 'child_process';
import {logger} from '@react-native-community/cli-tools';
import getAdbPath from './getAdbPath';

// Runs ADB reverse tcp:8081 tcp:8081 to allow loading the jsbundle from the packager
function tryRunAdbReverse(
  packagerPort: number | string,
  device?: string | void,
) {
  try {
    const adbPath = getAdbPath();
    const adbArgs = ['reverse', `tcp:${packagerPort}`, `tcp:${packagerPort}`];

    // If a device is specified then tell adb to use it
    if (device) {
      adbArgs.unshift('-s', device);
    }

    logger.info('Connecting to the development server...');
    logger.debug(`Running command "${adbPath} ${adbArgs.join(' ')}"`);

    execFileSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (e) {
    logger.warn(
      `Failed to connect to development server using "adb reverse": ${
        e.message
      }`,
    );
  }
}

export default tryRunAdbReverse;
