/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import execa from 'execa';
import {Config} from '@react-native-community/cli-types';
import {
  link,
  logger,
  CLIError,
  printRunDoctorTip,
} from '@react-native-community/cli-tools';
import adb from './adb';
import tryRunAdbReverse from './tryRunAdbReverse';
import tryLaunchAppOnDevice from './tryLaunchAppOnDevice';
import tryLaunchEmulator from './tryLaunchEmulator';
import tryInstallAppOnDevice from './tryInstallAppOnDevice';
import {getTaskNames} from './getTaskNames';
import type {Flags} from '.';

type AndroidProject = NonNullable<Config['project']['android']>;

async function runOnAllDevices(
  args: Flags,
  cmd: string,
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

  try {
    if (!args.binaryPath) {
      let gradleArgs = getTaskNames(
        androidProject.appName,
        args.mode,
        args.tasks,
        'install',
        androidProject.sourceDir,
      );

      if (args.extraParams) {
        gradleArgs.push(...args.extraParams);
      }

      if (args.port != null) {
        gradleArgs.push('-PreactNativeDevServerPort=' + args.port);
      }

      if (args.activeArchOnly) {
        const architectures = devices
          .map((device) => {
            return adb.getCPU(adbPath, device);
          })
          .filter(
            (arch, index, array) =>
              arch != null && array.indexOf(arch) === index,
          );

        if (architectures.length > 0) {
          logger.info(`Detected architectures ${architectures.join(', ')}`);
          // `reactNativeDebugArchitectures` was renamed to `reactNativeArchitectures` in 0.68.
          // Can be removed when 0.67 no longer needs to be supported.
          gradleArgs.push(
            '-PreactNativeDebugArchitectures=' + architectures.join(','),
          );
          gradleArgs.push(
            '-PreactNativeArchitectures=' + architectures.join(','),
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
    }
  } catch (error) {
    printRunDoctorTip();
    throw createInstallError(error as any);
  }

  (devices.length > 0 ? devices : [undefined]).forEach(
    (device: string | void) => {
      tryRunAdbReverse(args.port, device);
      if (args.binaryPath && device) {
        tryInstallAppOnDevice(args, adbPath, device, androidProject);
      }
      tryLaunchAppOnDevice(device, androidProject, adbPath, args);
    },
  );
}

function createInstallError(error: Error & {stderr: string}) {
  const stderr = (error.stderr || '').toString();
  let message = '';
  // Pass the error message from the command to stdout because we pipe it to
  // parent process so it's not visible
  logger.log(stderr);

  // Handle some common failures and make the errors more helpful
  if (stderr.includes('No connected devices')) {
    message =
      'Make sure you have an Android emulator running or a device connected.';
  } else if (
    stderr.includes('licences have not been accepted') ||
    stderr.includes('accept the SDK license')
  ) {
    message = `Please accept all necessary Android SDK licenses using Android SDK Manager: "${chalk.bold(
      '$ANDROID_HOME/tools/bin/sdkmanager --licenses',
    )}."`;
  } else if (stderr.includes('requires Java')) {
    message = `Looks like your Android environment is not properly set. Please go to ${chalk.dim.underline(
      link.docs('environment-setup', 'android', {
        hash: 'jdk-studio',
        guide: 'native',
      }),
    )} and follow the React Native CLI QuickStart guide to install the compatible version of JDK.`;
  }

  return new CLIError(
    `Failed to install the app.${message ? ' ' + message : ''}`,
    error.message.length > 0 ? undefined : error,
  );
}

export default runOnAllDevices;
