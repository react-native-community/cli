/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import {logger, CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import checkCommandExists from './../../../../tools/src/checkCommandExists';

function checkAdbPath() {
  const adbPath = getAdbPath();
  const adbPathExists = fs.existsSync(adbPath);
  const adbCmdExists = checkCommandExists('adb');
  const adbNotFoundError = `"adb" not found in $location$. APK installation $prediction$ fail. Make sure you installed the Android SDK correctly. Read more at ${chalk.underline.dim(
    'https://facebook.github.io/react-native/docs/getting-started',
  )}`;
  if (!adbPathExists || !adbCmdExists) {
    const notFoundLocation = `${
      !adbCmdExists ? 'PATH environment variable' : adbPath
    }`;
    logger.warn(
      adbNotFoundError
        .replace('$location$', notFoundLocation)
        .replace('$prediction$', 'might'),
    );
  } else if (!adbPathExists && !adbCmdExists) {
    throw new CLIError(
      adbNotFoundError
        .replace('$location$', `'PATH environment variable or ${adbPath}`)
        .replace('$prediction$', 'will'),
    );
  }
}

function checkAndroidSDKPath() {
  const {ANDROID_HOME} = process.env;
  if (!ANDROID_HOME || !fs.existsSync(ANDROID_HOME)) {
    throw new CLIError(
      `Android SDK not found. Make sure you have set ANDROID_HOME environment variable in the system. Read more at ${chalk.underline.dim(
        'https://facebook.github.io/react-native/docs/getting-started#3-configure-the-android_home-environment-variable',
      )}`,
    );
  }
  if (ANDROID_HOME.includes(' ')) {
    logger.warn(
      `Android SDK path "${ANDROID_HOME}" contains whitespaces which can cause build and install errors. Consider moving the Android SDK to a non-whitespace path.`,
    );
  }
}

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? `"${process.env.ANDROID_HOME}/platform-tools/adb"`
    : 'adb';
}

export default getAdbPath;
export {checkAndroidSDKPath, checkAdbPath};
