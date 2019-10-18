/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {logger, CLIError} from '@react-native-community/cli-tools';
import execa from 'execa';
import {Flags} from '.';

function tryLaunchAppOnDevice(
  device: string | void,
  packageName: string,
  adbPath: string,
  args: Flags,
) {
  const packageNameWithSuffix = args.appIdSuffix
    ? `${packageName}.${args.appIdSuffix}`
    : packageName;

  try {
    const adbArgs = [
      'shell',
      'am',
      'start',
      '-n',
      `${packageNameWithSuffix}/${packageName}.${args.mainActivity}`,
    ];
    if (device) {
      adbArgs.unshift('-s', device);
      logger.info(`Starting the app on "${device}"...`);
    } else {
      logger.info('Starting the app...');
    }
    logger.debug(`Running command "${adbPath} ${adbArgs.join(' ')}"`);
    execa.sync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to start the app.', error);
  }
}

export default tryLaunchAppOnDevice;
