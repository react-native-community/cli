/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import execa from 'execa';
import {logger} from '@react-native-community/cli-tools';

async function logAndroid() {
  logger.info('Starting logkitty');

  await execa(
    'logkitty',
    ['custom', '*:S', 'ReactNative:V', 'ReactNativeJS:V'],
    {
      stdio: 'inherit',
    },
  );
}

export default {
  name: 'log-android',
  description: 'starts adb logcat',
  func: logAndroid,
};
