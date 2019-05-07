/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import chalk from 'chalk';
import {execFileSync} from 'child_process';
import {logger, CLIError} from '@react-native-community/cli-tools';
import adb from './adb';
import tryRunAdbReverse from './tryRunAdbReverse';
import tryLaunchAppOnDevice from './tryLaunchAppOnDevice';
import type {FlagsT} from '.';

function getCommand(appFolder, command) {
  return appFolder ? `${appFolder}:${command}` : command;
}

function toPascalCase(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

function runOnAllDevices(
  args: FlagsT,
  cmd: string,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
) {
  try {
    const gradleArgs = [
      getCommand(args.appFolder, 'install' + toPascalCase(args.variant)),
    ];

    logger.info('Installing the app...');
    logger.debug(
      `Running command "cd android && ${cmd} ${gradleArgs.join(' ')}"`,
    );

    execFileSync(cmd, gradleArgs, {stdio: 'inherit'});
  } catch (e) {
    throw new CLIError(
      `Failed to install the app. Make sure you have an Android emulator running or a device connected and the Android development environment set up: ${chalk.underline.dim(
        'https://facebook.github.io/react-native/docs/getting-started.html#android-development-environment',
      )}`,
      e,
    );
  }
  const devices = adb.getDevices(adbPath);

  (devices.length > 0 ? devices : [undefined]).forEach(device => {
    tryRunAdbReverse(args.port, device);
    tryLaunchAppOnDevice(
      device,
      packageNameWithSuffix,
      packageName,
      adbPath,
      args.mainActivity,
    );
  });
}

export default runOnAllDevices;
