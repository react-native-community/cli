/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {logkitten} from 'logkitten';
import type {AndroidEntry} from 'logkitten';
import {logger} from '@react-native-community/cli-tools';

const TAGS = new Set(['ReactNative', 'ReactNativeJS']);

const LEVEL_LABELS: Record<number, string> = {
  10: 'V',
  20: 'D',
  30: 'I',
  40: 'W',
  50: 'E',
  60: 'F',
};

function formatEntry(entry: AndroidEntry): string {
  const level = LEVEL_LABELS[entry.level] ?? '?';
  return `${level} | ${entry.tag}: ${entry.msg}`;
}

async function logAndroid() {
  logger.info('Starting logkitten');

  const emitter = logkitten({
    platform: 'android',
    filter: (entry: AndroidEntry) => TAGS.has(entry.tag),
  });

  emitter.on('entry', (entry) => {
    logger.log(formatEntry(entry));
  });

  emitter.on('error', (error) => {
    logger.log(error.message);
  });
}

export default {
  name: 'log-android',
  description: 'starts logkitten',
  func: logAndroid,
};
