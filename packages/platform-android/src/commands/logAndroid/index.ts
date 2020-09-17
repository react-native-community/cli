/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  logkitty,
  makeTagsFilter,
  formatEntry,
  formatError,
  AndroidPriority,
} from 'logkitty';
import {logger} from '@react-native-community/cli-tools';

async function logAndroid() {
  logger.info('Starting logkitty');

  const emitter = logkitty({
    platform: 'android',
    priority: AndroidPriority.VERBOSE,
    filter: makeTagsFilter('ReactNative', 'ReactNativeJS'),
  });

  emitter.on('entry', (entry) => {
    logger.log(formatEntry(entry));
  });

  emitter.on('error', (error) => {
    logger.log(formatError(error));
  });
}

export default {
  name: 'log-android',
  description: 'starts logkitty',
  func: logAndroid,
};
