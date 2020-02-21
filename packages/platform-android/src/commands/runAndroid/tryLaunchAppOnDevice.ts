/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {spawnSync} from 'child_process';
import {logger, CLIError} from '@react-native-community/cli-tools';

function tryLaunchAppOnDevice(
  device: string | void,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
  mainActivity: string,
) {
  try {
    const adbArgs = [
      'shell',
      'am',
      'start',
      '-n',
      `${packageNameWithSuffix}/${packageName}.${mainActivity}`,
    ];
    if (device) {
      adbArgs.unshift('-s', device);
      logger.info(`Starting the app on "${device}"...`);
    } else {
      logger.info('Starting the app...');
    }
    logger.debug(`Running command "${adbPath} ${adbArgs.join(' ')}"`);
    spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to start the app.', error);
  }
}

export default tryLaunchAppOnDevice;
