/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createRun,
  getRunOptions,
} from '@react-native-community/cli-platform-apple';

export default {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: createRun({platformName: 'ios'}),
  examples: [
    {
      desc: 'Run on a different simulator, e.g. iPhone SE (2nd generation)',
      cmd: 'npx react-native run-ios --simulator "iPhone SE (2nd generation)"',
    },
    {
      desc: "Run on a connected device, e.g. Max's iPhone",
      cmd: 'npx react-native run-ios --device "Max\'s iPhone"',
    },
    {
      desc: 'Run on the AppleTV simulator',
      cmd: 'npx react-native run-ios --simulator "Apple TV"  --scheme "helloworld-tvOS"',
    },
  ],
  options: getRunOptions({platformName: 'ios'}),
};
