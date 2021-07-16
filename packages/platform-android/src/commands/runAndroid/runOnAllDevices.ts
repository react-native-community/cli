/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import {Config} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import adb from './adb';
import tryRunAdbReverse from './tryRunAdbReverse';
import tryLaunchAppOnDevice from './tryLaunchAppOnDevice';
import tryLaunchEmulator from './tryLaunchEmulator';
import {Flags} from '.';
import {buildApk, installApk} from './buildAndInstallApk';

type AndroidProject = NonNullable<Config['project']['android']>;

async function runOnAllDevices(
  args: Flags,
  gradlew: string,
  packageName: string,
  adbPath: string,
  androidProject: AndroidProject,
) {
  let devices = adb.getDevices(adbPath);
  if (devices.length === 0) {
    logger.info('Launching emulator...');
    const result = await tryLaunchEmulator(adbPath);
    if (result.success) {
      logger.info('Successfully launched emulator.');
      devices = adb.getDevices(adbPath);
    } else {
      logger.error(
        `Failed to launch emulator. Reason: ${chalk.dim(result.error || '')}.`,
      );
      logger.warn(
        'Please launch an emulator manually or connect a device. Otherwise app may fail to launch.',
      );
    }
  }


  await buildApk(args, gradlew, androidProject);
  await installApk(args, gradlew, adbPath, devices, androidProject);

  try {
    const tasks = args.tasks || ['install' + toPascalCase(args.variant)];
    const gradleArgs = getTaskNames(
      args.appFolder || androidProject.appName,
      tasks,
    );

    if (args.port != null) {
      gradleArgs.push('-PreactNativeDevServerPort=' + args.port);
    }

    if (args.activeArchOnly) {
      const architectures = devices
        .map((device) => {
          return adb.getCPU(adbPath, device);
        })
        .filter((arch) => arch != null);
      if (architectures.length > 0) {
        logger.info(`Detected architectures ${architectures.join(', ')}`);
        gradleArgs.push(
          '-PreactNativeDebugArchitectures=' + architectures.join(','),
        );
      }
    }

    logger.info('Installing the app...');
    logger.debug(
      `Running command "cd android && ${cmd} ${gradleArgs.join(' ')}"`,
    );

    await execa(cmd, gradleArgs, {
      stdio: ['inherit', 'inherit', 'pipe'],
      cwd: androidProject.sourceDir,
    });
  } catch (error) {
    throw createInstallError(error);
  }

  (devices.length > 0 ? devices : [undefined]).forEach(
    (device: string | void) => {
      tryRunAdbReverse(args.port, device);
      tryLaunchAppOnDevice(device, packageName, adbPath, args);
    },
  );
}

export default runOnAllDevices;
