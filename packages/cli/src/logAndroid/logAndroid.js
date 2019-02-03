/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawnSync } from 'child_process';
import logger from '../util/logger';

/**
 * Starts adb logcat
 */
async function logAndroid() {
  const adbPath = process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';

  const adbArgs = ['logcat', '*:S', 'ReactNative:V', 'ReactNativeJS:V'];

  logger.info(`Starting the logger (${adbPath} ${adbArgs.join(' ')})...`);

  const log = spawnSync(adbPath, adbArgs, { stdio: 'inherit' });

  if (log.error !== null) {
    throw log.error;
  }
}

module.exports = {
  name: 'log-android',
  description: 'starts adb logcat',
  func: logAndroid,
};
