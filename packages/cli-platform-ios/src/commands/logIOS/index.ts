/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createLog,
  logOptions,
} from '@react-native-community/cli-platform-apple';

export default {
  name: 'log-ios',
  description: 'starts iOS device syslog tail',
  func: createLog({platformName: 'ios'}),
  options: logOptions,
};
