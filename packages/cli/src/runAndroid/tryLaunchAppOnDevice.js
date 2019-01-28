/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import chalk from 'chalk';
import childProcess from 'child_process';

function tryLaunchAppOnDevice(
  device: string,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
  mainActivity: *
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
    console.log(
      chalk.bold(
        `Starting the app on ${device} (${adbPath} ${adbArgs.join(' ')})...`
      )
    );
    childProcess.spawnSync(adbPath, adbArgs, { stdio: 'inherit' });
  } catch (e) {
    console.log(
      chalk.red('adb invocation failed. Do you have adb in your PATH?')
    );
  }
}

export default tryLaunchAppOnDevice;
