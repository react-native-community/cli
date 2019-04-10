/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {spawnSync} from 'child_process';
import {logger} from '@react-native-community/cli-tools';

function tryLaunchAppOnDevice(
  device: string,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
  mainActivity: string,
) {
  try {
    const adbArgs = [
      '-s',
      device,
      'shell',
      'am',
      'start',
      '-n',
      `${packageNameWithSuffix}/${packageName}.${mainActivity}`,
    ];
    logger.info(
      `Starting the app on ${device} (${adbPath} ${adbArgs.join(' ')})...`,
    );
    spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (e) {
    logger.error('adb invocation failed. Do you have adb in your PATH?');
  }
}

export default tryLaunchAppOnDevice;
