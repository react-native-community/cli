/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import execa from 'execa';
import {AndroidProject, Flags} from '.';
import {logger, CLIError} from '@react-native-community/cli-tools';

function tryLaunchAppOnDevice(
  device: string | void,
  androidProject: AndroidProject,
  adbPath: string,
  args: Flags,
) {
  const {appId, appIdSuffix} = args;

  const {packageName, mainActivity, applicationId} = androidProject;

  const applicationIdWithSuffix = [appId || applicationId, appIdSuffix]
    .filter(Boolean)
    .join('.');

  const activityToLaunch = mainActivity.includes('.')
    ? mainActivity
    : [packageName, mainActivity].filter(Boolean).join('.');

  try {
    // Here we're using the same flags as Android Studio to launch the app
    const adbArgs = [
      'shell',
      'am',
      'start',
      '-n',
      `${applicationIdWithSuffix}/${activityToLaunch}`,
      '-a',
      'android.intent.action.MAIN',
      '-c',
      'android.intent.category.LAUNCHER',
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
    throw new CLIError('Failed to start the app.', error as any);
  }
}

export default tryLaunchAppOnDevice;
