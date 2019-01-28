/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import childProcess from 'child_process';

/**
 * Starts adb logcat
 */
async function logAndroid() {
  const adbPath = process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';

  const adbArgs = ['logcat', '*:S', 'ReactNative:V', 'ReactNativeJS:V'];

  console.log(
    chalk.bold(`Starting the logger (${adbPath} ${adbArgs.join(' ')})...`)
  );

  const log = childProcess.spawnSync(adbPath, adbArgs, { stdio: 'inherit' });

  if (log.error !== null) {
    throw log.error;
  }
}

export default {
  name: 'log-android',
  description: 'starts adb logcat',
  func: logAndroid,
};
